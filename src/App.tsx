import { useEffect, useMemo, useState } from 'react'
import type * as echarts from 'echarts'
import { BookmarkPlus, FileSpreadsheet, X, SlidersHorizontal } from 'lucide-react'
import type {
  ActiveTab,
  AggregationMethod,
  Dataset,
  EventAnnotation,
  MissingDataMethod,
  MovingAverageConfig,
  ProcessedSeries,
  TimeGranularity,
  TransformMode,
} from './types'
import {
  calculateCorrelationMatrix,
  calculateSeriesMetrics,
  processSeriesPipeline,
} from './utils/timeSeries'
import {
  getEcommercePreset,
  getEnergyPreset,
  getSampleDatasets,
} from './data/sampleDatasets'
import {
  dbClearDatasets,
  dbClearEvents,
  dbGetAllDatasets,
  dbGetAllEvents,
  dbGetSettings,
  dbSaveAllDatasets,
  dbSaveAllEvents,
  dbSaveSettings,
} from './utils/db'
import { Header } from './components/Header'
import { TabNav } from './components/TabNav'
import { ControlToolbar } from './components/ControlToolbar'
import { StatusBar } from './components/StatusBar'
import { DatasetManager } from './components/DatasetManager'
import { EventAnnotationPanel } from './components/EventAnnotationPanel'
import { MainChart } from './components/MainChart'
import { SeasonalityView } from './components/SeasonalityView'
import { MetricsSummaryCard } from './components/MetricsSummaryCard'
import { DataTableView } from './components/DataTableView'
import { ExportModal } from './components/ExportModal'

export function App() {
  const initialPreset = useMemo(() => getSampleDatasets(), [])

  const [datasets, setDatasets] = useState<Dataset[]>(initialPreset.datasets)
  const [events, setEvents] = useState<EventAnnotation[]>(initialPreset.events)
  const [isDBLoaded, setIsDBLoaded] = useState(false)

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Granularity & Cleaning
  const [granularity, setGranularity] = useState<TimeGranularity>('daily')
  const [aggregation, setAggregation] = useState<AggregationMethod>('avg')
  const [missingMethod, setMissingMethod] = useState<MissingDataMethod>('none')

  // Transform
  const [transformMode, setTransformMode] = useState<TransformMode>('raw')
  const [baseDate, setBaseDate] = useState<string>('')

  // Moving Average
  const [maConfig, setMaConfig] = useState<MovingAverageConfig>({
    enabled: true,
    type: 'sma',
    window: 20,
    overlay: true,
  })

  // View state
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline')
  const [sidebarTab, setSidebarTab] = useState<'datasets' | 'events'>('datasets')
  const [activeDateRange, setActiveDateRange] = useState<[string, string] | null>(null)
  const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Initialize from IndexedDB
  useEffect(() => {
    async function initDB() {
      try {
        const [savedDs, savedEvts, savedSettings] = await Promise.all([
          dbGetAllDatasets(),
          dbGetAllEvents(),
          dbGetSettings(),
        ])

        if (savedDs && savedDs.length > 0) {
          setDatasets(savedDs)
        } else {
          // First visit: Seed preset to IndexedDB
          await dbSaveAllDatasets(initialPreset.datasets)
        }

        if (savedEvts && savedEvts.length > 0) {
          setEvents(savedEvts)
        } else {
          await dbSaveAllEvents(initialPreset.events)
        }

        if (savedSettings) {
          if (savedSettings.granularity) setGranularity(savedSettings.granularity)
          if (savedSettings.aggregation) setAggregation(savedSettings.aggregation)
          if (savedSettings.missingMethod) setMissingMethod(savedSettings.missingMethod)
          if (savedSettings.transformMode) setTransformMode(savedSettings.transformMode)
          if (savedSettings.baseDate) setBaseDate(savedSettings.baseDate)
          if (savedSettings.maConfig) setMaConfig(savedSettings.maConfig)
          if (savedSettings.activeTab) setActiveTab(savedSettings.activeTab)
        }
      } catch (err) {
        console.error('IndexedDB loading error:', err)
      } finally {
        setIsDBLoaded(true)
      }
    }

    initDB()
  }, [initialPreset])

  // Persist datasets to IndexedDB when changed
  useEffect(() => {
    if (isDBLoaded) {
      dbSaveAllDatasets(datasets)
    }
  }, [datasets, isDBLoaded])

  // Persist events to IndexedDB when changed
  useEffect(() => {
    if (isDBLoaded) {
      dbSaveAllEvents(events)
    }
  }, [events, isDBLoaded])

  // Persist settings to IndexedDB when changed
  useEffect(() => {
    if (isDBLoaded) {
      dbSaveSettings({
        granularity,
        aggregation,
        missingMethod,
        transformMode,
        baseDate,
        maConfig,
        activeTab,
      })
    }
  }, [granularity, aggregation, missingMethod, transformMode, baseDate, maConfig, activeTab, isDBLoaded])

  // Pipeline computation
  const processedSeriesList: ProcessedSeries[] = useMemo(() => {
    return datasets
      .filter((d) => d.visible)
      .map((ds) => {
        const { points, maPoints } = processSeriesPipeline(
          ds,
          granularity,
          aggregation,
          missingMethod,
          transformMode,
          maConfig,
          baseDate
        )

        return {
          datasetId: ds.id,
          datasetName: ds.name,
          metricCol: ds.metricCol,
          color: ds.color,
          lineStyle: ds.lineStyle,
          yAxisIndex: ds.yAxisIndex,
          points,
          maPoints,
          baselineDate: baseDate,
        }
      })
  }, [datasets, granularity, aggregation, missingMethod, transformMode, maConfig, baseDate])

  // Total points calculation across active series
  const totalPointsCount = useMemo(() => {
    return processedSeriesList.reduce((acc, s) => acc + s.points.length, 0)
  }, [processedSeriesList])

  // Available unique dates
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    processedSeriesList.forEach((s) => {
      s.points.forEach((p) => dates.add(p.date))
    })
    return Array.from(dates).sort()
  }, [processedSeriesList])

  // Summary Metrics (dynamic to active zoom brush window)
  const metricsList = useMemo(() => {
    return datasets
      .filter((d) => d.visible)
      .map((ds) => {
        const processed = processedSeriesList.find((p) => p.datasetId === ds.id)
        const pts = processed ? processed.points : []
        return calculateSeriesMetrics(ds, pts, activeDateRange || undefined)
      })
  }, [datasets, processedSeriesList, activeDateRange])

  // Correlation Matrix
  const correlationData = useMemo(() => {
    const active = datasets
      .filter((d) => d.visible)
      .map((d) => {
        const processed = processedSeriesList.find((p) => p.datasetId === d.id)
        return {
          dataset: d,
          points: processed ? processed.points : [],
        }
      })
    return calculateCorrelationMatrix(active)
  }, [datasets, processedSeriesList])

  // Presets
  const handleLoadPreset = async (key: 'semi' | 'ecom' | 'energy') => {
    let preset: { datasets: Dataset[]; events: EventAnnotation[] }
    if (key === 'semi') {
      preset = getSampleDatasets()
      setGranularity('daily')
      setTransformMode('baseline100')
    } else if (key === 'ecom') {
      preset = getEcommercePreset()
      setGranularity('daily')
      setTransformMode('raw')
    } else {
      preset = getEnergyPreset()
      setGranularity('daily')
      setTransformMode('raw')
    }

    setDatasets(preset.datasets)
    setEvents(preset.events)
    setActiveDateRange(null)
    await dbSaveAllDatasets(preset.datasets)
    await dbSaveAllEvents(preset.events)
  }

  // Import JSON Workspace
  const handleImportWorkspace = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.datasets && Array.isArray(data.datasets)) {
        setDatasets(data.datasets)
        await dbSaveAllDatasets(data.datasets)
      }
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events)
        await dbSaveAllEvents(data.events)
      }
      if (data.settings) {
        if (data.settings.granularity) setGranularity(data.settings.granularity)
        if (data.settings.aggregation) setAggregation(data.settings.aggregation)
        if (data.settings.missingMethod) setMissingMethod(data.settings.missingMethod)
        if (data.settings.transformMode) setTransformMode(data.settings.transformMode)
        if (data.settings.maConfig) setMaConfig(data.settings.maConfig)
      }
    } catch {
      alert('專案 JSON 檔案格式錯誤，無法解析')
    }
  }

  // Reset Workspace
  const handleReset = async () => {
    if (confirm('確定要清空所有資料集與事件標註嗎？此操作將同時重設本機 IndexedDB 儲存空間。')) {
      setDatasets([])
      setEvents([])
      setActiveDateRange(null)
      await dbClearDatasets()
      await dbClearEvents()
    }
  }

  // Jump to Event
  const handleSelectEventDate = (date: string) => {
    if (chartInstance) {
      const targetTs = new Date(date).getTime()
      const startTs = targetTs - 45 * 86400000
      const endTs = targetTs + 45 * 86400000

      chartInstance.dispatchAction({
        type: 'dataZoom',
        startValue: startTs,
        endValue: endTs,
      })

      // On mobile, close drawer so user sees the chart
      setIsMobileDrawerOpen(false)
    }
  }

  // Common sidebar content for desktop & mobile drawer
  const sidebarContent = (
    <div className="space-y-3">
      {/* Sidebar Tab Switcher */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 text-xs">
        <button
          onClick={() => setSidebarTab('datasets')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md font-medium transition-colors ${
            sidebarTab === 'datasets'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
          <span>資料集 ({datasets.length})</span>
        </button>
        <button
          onClick={() => setSidebarTab('events')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md font-medium transition-colors ${
            sidebarTab === 'events'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <BookmarkPlus className="w-3.5 h-3.5 flex-shrink-0" />
          <span>事件註記 ({events.length})</span>
        </button>
      </div>

      {/* Panels */}
      {sidebarTab === 'datasets' ? (
        <DatasetManager
          datasets={datasets}
          onAddDataset={(newDs) => setDatasets((prev) => [...prev, newDs])}
          onUpdateDataset={(updated) =>
            setDatasets((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            )
          }
          onRemoveDataset={async (id) => {
            setDatasets((prev) => prev.filter((d) => d.id !== id))
          }}
          onClearAll={async () => {
            setDatasets([])
            await dbClearDatasets()
          }}
        />
      ) : (
        <EventAnnotationPanel
          events={events}
          onAddEvent={(newEvt) => setEvents((prev) => [...prev, newEvt])}
          onUpdateEvent={(updated) =>
            setEvents((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e))
            )
          }
          onDeleteEvent={async (id) => {
            setEvents((prev) => prev.filter((e) => e.id !== id))
          }}
          onToggleAll={(visible) =>
            setEvents((prev) => prev.map((e) => ({ ...e, visible })))
          }
          onSelectEventDate={handleSelectEventDate}
        />
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors">
      {/* Top Header */}
      <Header
        onLoadPreset={handleLoadPreset}
        onOpenExport={() => setIsExportModalOpen(true)}
        onImportWorkspace={handleImportWorkspace}
        onReset={handleReset}
        dbSavedCount={datasets.length}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        datasetCount={datasets.length}
        eventCount={events.length}
      />

      {/* Sub-Navigation Tab Bar */}
      <TabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        datasetCount={datasets.length}
        eventCount={events.length}
      />

      {/* Control Toolbar Bar */}
      <ControlToolbar
        granularity={granularity}
        setGranularity={setGranularity}
        aggregation={aggregation}
        setAggregation={setAggregation}
        missingMethod={missingMethod}
        setMissingMethod={setMissingMethod}
        transformMode={transformMode}
        setTransformMode={setTransformMode}
        baseDate={baseDate}
        setBaseDate={setBaseDate}
        availableDates={availableDates}
        maConfig={maConfig}
        setMaConfig={setMaConfig}
      />

      {/* Mobile Drawer (visible on < lg when open) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/75 transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[85vw] max-w-xs sm:max-w-sm bg-white dark:bg-zinc-900 h-full p-3 sm:p-4 shadow-2xl flex flex-col z-50 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 animate-slideRight">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                <span>資料與事件管理</span>
              </span>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="關閉抽屜"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Workbench */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-2 sm:p-3.5 md:p-4 space-y-3 flex flex-col pb-6">
        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 items-start min-w-0">
          {/* Desktop Left Column: Datasets & Events Manager (hidden on < lg, shown as drawer) */}
          <aside className="hidden lg:block lg:col-span-4 2xl:col-span-3 min-w-0">
            {sidebarContent}
          </aside>

          {/* Right Main Column (Full width on < lg, 8 cols on lg, 9 cols on 2xl) */}
          <div className="col-span-1 lg:col-span-8 2xl:col-span-9 space-y-3.5 min-w-0">
            {activeTab === 'timeline' && (
              <>
                {/* Main ECharts Timeline View */}
                <MainChart
                  seriesList={processedSeriesList}
                  datasets={datasets}
                  events={events}
                  transformMode={transformMode}
                  granularity={granularity}
                  maConfig={maConfig}
                  onDateRangeChange={setActiveDateRange}
                  onChartInstanceReady={setChartInstance}
                />

                {/* Quantitative Metrics & Correlation Matrix */}
                <MetricsSummaryCard
                  metricsList={metricsList}
                  correlationData={correlationData}
                  datasets={datasets}
                />
              </>
            )}

            {activeTab === 'seasonality' && (
              <SeasonalityView
                seriesList={processedSeriesList}
                datasets={datasets}
              />
            )}

            {activeTab === 'table' && (
              <DataTableView seriesList={processedSeriesList} />
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Status Bar */}
      <StatusBar
        totalPoints={totalPointsCount}
        datasetCount={datasets.filter((d) => d.visible).length}
        granularity={granularity}
        dateRange={activeDateRange}
        transformMode={transformMode}
        maEnabled={maConfig.enabled}
        maWindow={maConfig.window}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        chartInstance={chartInstance}
        seriesList={processedSeriesList}
        datasets={datasets}
        events={events}
        settings={{
          granularity,
          aggregation,
          missingMethod,
          transformMode,
          baseDate,
          maConfig,
        }}
      />
    </div>
  )
}

export default App
