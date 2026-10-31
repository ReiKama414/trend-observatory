import { useState } from 'react'
import type * as echarts from 'echarts'
import {
  Download,
  Image,
  FileSpreadsheet,
  FileJson,
  X,
  Check,
} from 'lucide-react'
import type { Dataset, EventAnnotation, ProcessedSeries } from '../types'
import { exportProcessedSeriesToCSV, exportWorkspaceJSON } from '../utils/csvHelper'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  chartInstance: echarts.ECharts | null
  seriesList: ProcessedSeries[]
  datasets: Dataset[]
  events: EventAnnotation[]
  settings: Record<string, any>
}

function getTimestampString(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

export const ExportModal = ({
  isOpen,
  onClose,
  chartInstance,
  seriesList,
  datasets,
  events,
  settings,
}: ExportModalProps) => {
  const [pixelRatio, setPixelRatio] = useState<number>(2)
  const [bgColor, setBgColor] = useState<'dark' | 'white' | 'transparent'>('dark')
  const [includeMA, setIncludeMA] = useState<boolean>(true)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExportPNG = () => {
    if (!chartInstance) {
      alert('圖表尚未初始化')
      return
    }

    const bg = bgColor === 'dark' ? '#09090b' : bgColor === 'white' ? '#ffffff' : 'transparent'

    const url = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: pixelRatio,
      backgroundColor: bg,
      excludeComponents: ['dataZoom'],
    })

    const a = document.createElement('a')
    a.href = url
    a.download = `trend_observatory_chart_${getTimestampString()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    showSuccess('PNG 圖表已匯出')
  }

  const handleExportCSV = () => {
    const list = seriesList.map((s) => ({
      name: s.datasetName,
      points: s.points,
      maPoints: s.maPoints,
      includeMA: includeMA && !!s.maPoints,
    }))

    exportProcessedSeriesToCSV(list, `trend_observatory_data_${getTimestampString()}.csv`)
    showSuccess('已下載合併清洗後 CSV')
  }

  const handleExportWorkspace = () => {
    exportWorkspaceJSON(datasets, events, settings, `trend_observatory_workspace_${getTimestampString()}.json`)
    showSuccess('研究專案 JSON 已匯出')
  }

  const showSuccess = (msg: string) => {
    setExportSuccess(msg)
    setTimeout(() => {
      setExportSuccess(null)
    }, 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/75 p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-lg p-4 sm:p-5 shadow-xl space-y-3.5 max-h-[92vh] overflow-y-auto transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">匯出研究成果與圖表</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Image Export */}
        <div className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">圖表影像 (PNG)</h4>
            </div>
            <button
              onClick={handleExportPNG}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              下載 PNG 圖檔
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">解析度 (倍率)</label>
              <select
                value={pixelRatio}
                onChange={(e) => setPixelRatio(Number(e.target.value))}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
              >
                <option value={1}>1x (螢幕標準)</option>
                <option value={2}>2x (Retina 簡報高清推薦)</option>
                <option value={3}>3x (印刷/出版級超高清)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">底色風格</label>
              <select
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value as any)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
              >
                <option value="dark">深色底 (#09090b)</option>
                <option value="white">白色清晰底 (#ffffff)</option>
                <option value="transparent">透明背景 (Transparent)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Processed CSV Data */}
        <div className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">時序資料 (CSV)</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">包含對齊日期、重採樣、標準化與均線欄位</p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              下載 CSV 檔案
            </button>
          </div>

          <label className="flex items-center space-x-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={includeMA}
              onChange={(e) => setIncludeMA(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800"
            />
            <span className="text-[11px]">同時匯出移動平均 (MA) 計算欄位</span>
          </label>
        </div>

        {/* Section 3: Workspace JSON */}
        <div className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 sm:p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileJson className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">專案狀態工作區 (JSON)</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">打包儲存資料集、指標對應與事件註記</p>
            </div>
          </div>
          <button
            onClick={handleExportWorkspace}
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            匯出專案 JSON
          </button>
        </div>

        {/* Status Toast */}
        {exportSuccess && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-center space-x-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-medium"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}
