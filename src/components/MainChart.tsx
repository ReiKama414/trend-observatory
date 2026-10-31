import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import {
  LineChart,
  Layers,
  Database,
  TrendingUp,
  BookmarkPlus,
  Calendar,
  HelpCircle,
} from 'lucide-react'
import type {
  Dataset,
  EventAnnotation,
  MovingAverageConfig,
  ProcessedSeries,
  TimeGranularity,
  TransformMode,
} from '../types'
import { useTheme } from '../context/useTheme'

interface MainChartProps {
  seriesList: ProcessedSeries[]
  datasets?: Dataset[]
  events: EventAnnotation[]
  transformMode: TransformMode
  granularity: TimeGranularity
  maConfig: MovingAverageConfig
  onDateRangeChange?: (range: [string, string] | null) => void
  onChartInstanceReady?: (instance: echarts.ECharts | null) => void
  chartTitle?: string
}

export const MainChart = ({
  seriesList,
  events,
  transformMode,
  granularity,
  maConfig,
  onDateRangeChange,
  onChartInstanceReady,
}: MainChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const latestPropsRef = useRef({ seriesList, onDateRangeChange, onChartInstanceReady })

  useEffect(() => {
    latestPropsRef.current = { seriesList, onDateRangeChange, onChartInstanceReady }
  })

  // Visible active series with data
  const visibleSeries = useMemo(
    () => seriesList.filter((s) => s.points.length > 0),
    [seriesList]
  )

  // Compute summary stats for Statistics bar
  const summaryStats = useMemo(() => {
    let minDate = ''
    let maxDate = ''
    let totalPoints = 0

    visibleSeries.forEach((s) => {
      totalPoints += s.points.length
      if (s.points.length > 0) {
        const start = s.points[0].date
        const end = s.points[s.points.length - 1].date
        if (!minDate || start < minDate) minDate = start
        if (!maxDate || end > maxDate) maxDate = end
      }
    })

    const visibleEventsCount = events.filter((e) => e.visible).length

    return {
      minDate: minDate || '-',
      maxDate: maxDate || '-',
      totalPoints,
      seriesCount: visibleSeries.length,
      visibleEventsCount,
    }
  }, [visibleSeries, events])

  // Transform mode text
  const transformModeLabels: Record<TransformMode, { name: string; desc: string }> = {
    raw: {
      name: '原始數值 (Raw)',
      desc: '呈現時間序列原始數值，可自由設定左/右雙 Y 軸以消除不同量級之可讀性落差。',
    },
    baseline100: {
      name: '基準值 100 (Rebase)',
      desc: '以基準日之數值重新標準化為 100 點，消除單位與量級差距，精確反映跨序列相對成長強度。',
    },
    mom: {
      name: '月增率 (MoM %)',
      desc: '呈現各期相對於前一月期別之百分比成長率，快速識別月度增減趨勢。',
    },
    yoy: {
      name: '年增率 (YoY %)',
      desc: '呈現各期相對於去年同期之百分比成長率，排除季節性規律後的長線動能。',
    },
    pct_change: {
      name: '期別變動率 (PoP %)',
      desc: '呈現各相鄰採樣週期之百分比變動率，適合觀察短期波動幅度。',
    },
  }

  const granularityLabels: Record<TimeGranularity, string> = {
    raw: '原始取樣',
    daily: '日粒度 (Daily)',
    weekly: '週粒度 (Weekly)',
    monthly: '月粒度 (Monthly)',
    quarterly: '季粒度 (Quarterly)',
    yearly: '年粒度 (Yearly)',
  }

  // Initialize and re-initialize ECharts instance when resolvedTheme changes
  useEffect(() => {
    if (!chartRef.current) return

    if (instanceRef.current) {
      instanceRef.current.dispose()
      instanceRef.current = null
    }

    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
    })
    instanceRef.current = chart

    if (latestPropsRef.current.onChartInstanceReady) {
      latestPropsRef.current.onChartInstanceReady(chart)
    }

    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })
    resizeObserver.observe(chartRef.current)

    // Listen to dataZoom event
    const handleZoom = (params: any) => {
      const { onDateRangeChange: onRange, seriesList: currentSeries } = latestPropsRef.current
      if (!onRange) return
      let startPercent = 0
      let endPercent = 100

      if (params.batch && params.batch.length > 0) {
        startPercent = params.batch[0].start ?? 0
        endPercent = params.batch[0].end ?? 100
      } else if (params.start !== undefined && params.end !== undefined) {
        startPercent = params.start
        endPercent = params.end
      }

      // Convert percentages to date strings using the current series x-axis
      const activeSeries = currentSeries.find((s) => s.points.length > 0)
      if (!activeSeries || activeSeries.points.length === 0) {
        onRange(null)
        return
      }

      const allDates = activeSeries.points.map((p) => p.date)
      const startIdx = Math.max(0, Math.floor((startPercent / 100) * (allDates.length - 1)))
      const endIdx = Math.min(allDates.length - 1, Math.ceil((endPercent / 100) * (allDates.length - 1)))

      onRange([allDates[startIdx], allDates[endIdx]])
    }

    chart.on('dataZoom', handleZoom)

    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      instanceRef.current = null
      if (latestPropsRef.current.onChartInstanceReady) {
        latestPropsRef.current.onChartInstanceReady(null)
      }
    }
  }, [isDark])

  // Update chart options whenever props or theme changes
  useEffect(() => {
    const chart = instanceRef.current
    if (!chart) return

    const bgColor = isDark ? '#070b14' : '#ffffff'
    const textColor = isDark ? '#94a3b8' : '#475569'
    const headingColor = isDark ? '#f8fafc' : '#0f172a'
    const splitLineColor = isDark ? '#1e293b' : '#f1f5f9'
    const axisLineColor = isDark ? '#334155' : '#cbd5e1'
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'
    const tooltipBorder = isDark ? '#334155' : '#cbd5e1'
    const tooltipText = isDark ? '#f8fafc' : '#0f172a'
    const dataZoomBg = isDark ? '#0f172a' : '#f8fafc'
    const dataZoomBorder = isDark ? '#334155' : '#e2e8f0'

    if (visibleSeries.length === 0) {
      chart.setOption(
        {
          backgroundColor: bgColor,
          title: {
            text: '尚未選取或上傳資料集，請從左側面板新增或點選上方範例資料',
            left: 'center',
            top: 'center',
            textStyle: {
              color: textColor,
              fontSize: 13,
              fontWeight: 'normal',
            },
          },
          series: [],
        },
        true
      )
      return
    }

    // Determine Y-axis units and format
    const isPct = transformMode === 'mom' || transformMode === 'yoy' || transformMode === 'pct_change'
    const isBaseline = transformMode === 'baseline100'

    const hasSecondaryAxis = visibleSeries.some((s) => s.yAxisIndex === 1)

    // Build event mark lines & areas
    const visibleEvents = events.filter((e) => e.visible)
    const markLineData: any[] = []
    const markAreaData: any[] = []

    visibleEvents.forEach((evt) => {
      if (evt.endDate && evt.endDate !== evt.date) {
        // Range event (markArea) - position inside top with pill background to avoid colliding with legend
        markAreaData.push([
          {
            name: evt.label,
            xAxis: evt.date,
            itemStyle: {
              color: evt.color ? `${evt.color}22` : 'rgba(59, 130, 246, 0.15)',
            },
            label: {
              color: isDark ? '#ffffff' : '#0f172a',
              position: 'insideTop',
              distance: 12,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: evt.color || (isDark ? '#60a5fa' : '#2563eb'),
              borderWidth: 1,
              borderRadius: 4,
              padding: [3, 6],
              formatter: evt.label,
              fontSize: 10,
              fontWeight: 'bold',
            },
          },
          {
            xAxis: evt.endDate,
          },
        ])
      } else {
        // Point event (markLine) - position inside top with clear clearance
        markLineData.push({
          name: evt.label,
          xAxis: evt.date,
          lineStyle: {
            color: evt.color || '#f59e0b',
            type: 'dashed',
            width: 1.8,
          },
          label: {
            formatter: evt.label,
            position: 'insideEndTop',
            distance: 8,
            color: evt.color || (isDark ? '#fbbf24' : '#b45309'),
            fontSize: 10,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: evt.color || '#f59e0b',
            borderWidth: 1,
            borderRadius: 4,
            padding: [3, 6],
          },
        })
      }
    })

    // Build ECharts series
    const echartsSeries: any[] = []

    visibleSeries.forEach((s, idx) => {
      // Main points data: [date, value]
      const data = s.points.map((p) => [p.date, p.value])

      const seriesDef: any = {
        name: s.datasetName,
        type: 'line',
        data,
        yAxisIndex: isBaseline ? 0 : s.yAxisIndex,
        smooth: false,
        showSymbol: s.points.length < 50,
        symbolSize: 4,
        lineStyle: {
          color: s.color,
          width: 2.2,
          type: s.lineStyle,
        },
        itemStyle: {
          color: s.color,
        },
      }

      // Attach markLine / markArea to the first series
      if (idx === 0) {
        if (markLineData.length > 0) {
          seriesDef.markLine = {
            silent: false,
            symbol: ['none', 'triangle'],
            symbolSize: 6,
            data: markLineData,
          }
        }
        if (markAreaData.length > 0) {
          seriesDef.markArea = {
            silent: false,
            data: markAreaData,
          }
        }
      }

      echartsSeries.push(seriesDef)

      // Moving Average series if enabled
      if (maConfig.enabled && s.maPoints && s.maPoints.length > 0) {
        const maData = s.maPoints.map((p) => [p.date, p.value])
        echartsSeries.push({
          name: `${s.datasetName} (${maConfig.type.toUpperCase()}-${maConfig.window})`,
          type: 'line',
          data: maData,
          yAxisIndex: isBaseline ? 0 : s.yAxisIndex,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: s.color,
            width: 1.6,
            type: 'dashed',
            opacity: 0.85,
          },
          itemStyle: {
            color: s.color,
          },
        })
      }
    })

    // Calculate data ranges for primary and secondary axes to adapt tick precision
    const primaryVals: number[] = []
    const secondaryVals: number[] = []

    visibleSeries.forEach((s) => {
      const isSec = !isBaseline && s.yAxisIndex === 1
      s.points.forEach((p) => {
        if (p.value !== null && !isNaN(p.value)) {
          if (isSec) secondaryVals.push(p.value)
          else primaryVals.push(p.value)
        }
      })
      if (maConfig.enabled && s.maPoints) {
        s.maPoints.forEach((p) => {
          if (p.value !== null && !isNaN(p.value)) {
            if (isSec) secondaryVals.push(p.value)
            else primaryVals.push(p.value)
          }
        })
      }
    })

    const primaryRange = primaryVals.length > 0
      ? Math.max(...primaryVals) - Math.min(...primaryVals)
      : 1000
    const secondaryRange = secondaryVals.length > 0
      ? Math.max(...secondaryVals) - Math.min(...secondaryVals)
      : 1000

    const createAxisFormatter = (range: number) => (val: number) => {
      if (isPct) return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`
      if (isBaseline) return `${Math.round(val)}`

      const abs = Math.abs(val)
      if (abs >= 1e9) {
        return range >= 1e8 ? `${(val / 1e9).toFixed(1)}B` : `${(val / 1e9).toFixed(2)}B`
      }
      if (abs >= 1e6) {
        return range >= 1e5 ? `${(val / 1e6).toFixed(1)}M` : `${(val / 1e6).toFixed(2)}M`
      }
      // For values in thousands: only format as 'k' when the axis range is broad (>= 3000).
      // If the axis span is narrow (< 3000, e.g. 49620 to 49720), use toLocaleString() to prevent identical tick labels
      if (abs >= 10000 && range >= 3000) {
        return range >= 10000 ? `${(val / 1e3).toFixed(0)}k` : `${(val / 1e3).toFixed(1)}k`
      }
      if (abs >= 1000 && range >= 5000) {
        return `${(val / 1e3).toFixed(0)}k`
      }
      return val.toLocaleString(undefined, {
        maximumFractionDigits: range < 2 ? 2 : range < 20 ? 1 : 0,
      })
    }

    // Y Axis Configs
    const yAxisConfig: any[] = [
      {
        type: 'value',
        scale: true,
        splitLine: {
          lineStyle: {
            color: splitLineColor,
            type: 'dashed',
          },
        },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: createAxisFormatter(primaryRange),
        },
        axisLine: {
          show: true,
          lineStyle: { color: axisLineColor },
        },
      },
    ]

    // If secondary axis is needed and we are NOT in baseline mode
    if (hasSecondaryAxis && !isBaseline) {
      yAxisConfig.push({
        type: 'value',
        scale: true,
        splitLine: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: createAxisFormatter(secondaryRange),
        },
        axisLine: {
          show: true,
          lineStyle: { color: axisLineColor },
        },
      })
    }

    // Dynamic top space for chart grid to comfortably accommodate multi-row wrapped legend items
    const totalLegendCount = visibleSeries.length * (maConfig.enabled ? 2 : 1)
    const dynamicGridTop = totalLegendCount <= 2 ? 56 : totalLegendCount <= 4 ? 78 : totalLegendCount <= 6 ? 102 : 124

    const option: echarts.EChartsOption = {
      backgroundColor: bgColor,
      title: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: textColor,
          },
          lineStyle: {
            color: axisLineColor,
            type: 'dashed',
          },
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: {
          color: tooltipText,
          fontSize: 12,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const dateStr = params[0].axisValue
          let html = `<div style="padding: 4px 6px;">
            <div style="font-weight: 600; color: ${headingColor}; margin-bottom: 6px; border-bottom: 1px solid ${axisLineColor}; padding-bottom: 4px;">
              ${dateStr}
            </div>`

          params.forEach((item: any) => {
            const val = item.value[1]
            const color = item.color
            const seriesName = item.seriesName

            let formattedVal = 'N/A'
            if (val !== null && val !== undefined) {
              if (isPct) {
                formattedVal = `${val > 0 ? '+' : ''}${val.toFixed(2)}%`
              } else if (isBaseline) {
                formattedVal = `${val.toFixed(2)} pts`
              } else {
                formattedVal = Number(val).toLocaleString()
              }
            }

            html += `<div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: 4px 0;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
                <span style="color: ${textColor}; font-size: 11px;">${seriesName}:</span>
              </span>
              <span style="font-weight: 600; font-family: monospace; color: ${headingColor};">${formattedVal}</span>
            </div>`
          })

          html += `</div>`
          return html
        },
      },
      legend: {
        type: 'plain',
        top: 8,
        left: 20,
        right: 20,
        itemWidth: 16,
        itemHeight: 12,
        itemGap: 16,
        textStyle: {
          color: textColor,
          fontSize: 11,
          lineHeight: 15,
        },
      },
      grid: {
        left: '2%',
        right: hasSecondaryAxis && !isBaseline ? '3%' : '2%',
        bottom: 50,
        top: dynamicGridTop,
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        boundaryGap: ['0%', '0%'],
        splitLine: {
          show: true,
          lineStyle: {
            color: splitLineColor,
          },
        },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          hideOverlap: true,
          formatter: (value: number) => {
            const d = new Date(value)
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${y}-${m}-${day}`
          },
        },
        axisLine: {
          lineStyle: { color: axisLineColor },
        },
      },
      yAxis: yAxisConfig,
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          bottom: 4,
          height: 26,
          backgroundColor: dataZoomBg,
          borderColor: dataZoomBorder,
          fillerColor: 'rgba(59, 130, 246, 0.2)',
          handleStyle: {
            color: '#3b82f6',
            borderColor: '#60a5fa',
          },
          moveHandleStyle: {
            color: '#3b82f6',
          },
          textStyle: {
            color: textColor,
            fontSize: 10,
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
        },
      ],
      series: echartsSeries,
    }

    chart.setOption(option, true)
  }, [visibleSeries, events, transformMode, granularity, maConfig, isDark])

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col space-y-3 transition-colors min-w-0">
      {/* 1. Header: Title, Mode Badges & Quick Indicators */}
      <div
        data-testid="chart-card-header"
        className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <LineChart className="w-4 h-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
          <h2
            data-testid="main-chart-title"
            className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
          >
            時間序列走勢主圖 (Multi-Series Timeline)
          </h2>
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
            {transformModeLabels[transformMode].name}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {granularityLabels[granularity]}
          </span>
          {maConfig.enabled && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{maConfig.type.toUpperCase()}-{maConfig.window}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Description: Natural document flow explanation */}
      <div
        data-testid="chart-card-description"
        className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed"
      >
        <p>{transformModeLabels[transformMode].desc}</p>
      </div>

      {/* 3. Statistics: Summary Bar for Active Viewport */}
      <div
        data-testid="chart-card-statistics"
        className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-2.5 bg-zinc-50 dark:bg-zinc-950/70 rounded-lg border border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-700 dark:text-zinc-300"
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">總體範圍:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 truncate whitespace-nowrap">
            {summaryStats.minDate} ~ {summaryStats.maxDate}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 min-w-0">
          <Database className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">採樣數據點:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {summaryStats.totalPoints.toLocaleString()} 點
          </span>
        </div>

        <div className="flex items-center space-x-1.5 min-w-0">
          <Layers className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">活躍線條:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {summaryStats.seriesCount} 組
          </span>
        </div>

        <div className="flex items-center space-x-1.5 min-w-0">
          <BookmarkPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">標註事件:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {summaryStats.visibleEventsCount} 個
          </span>
        </div>
      </div>

      {/* 4. Chart: Dedicated Drawing Area with Auto-Resize */}
      <div
        data-testid="chart-card-canvas-container"
        className="relative w-full h-[380px] xs:h-[420px] sm:h-[480px] md:h-[520px] min-w-0 overflow-hidden"
      >
        <div ref={chartRef} className="w-full h-full rounded-md" />
      </div>

      {/* 5. Legend / Footer: Active Series Pills & Helper Hint */}
      <div
        data-testid="chart-card-footer"
        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400"
      >
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">圖例項目:</span>
          {visibleSeries.map((s) => (
            <span
              key={s.datasetId}
              title={`${s.datasetName} [指標: ${s.metricCol}] (${s.yAxisIndex === 0 ? '左側主軸' : '右側副軸'})`}
              className="inline-flex items-center space-x-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-default"
            >
              <span
                className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="font-medium">{s.datasetName}</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">[{s.metricCol}]</span>
              <span className="text-zinc-400">({s.yAxisIndex === 0 ? '左' : '右'})</span>
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-1 text-zinc-400 dark:text-zinc-500">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>滾輪或下方滑動條可縮放，點選事件線自動跳至該時段</span>
        </div>
      </div>
    </div>
  )
}
