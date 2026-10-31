import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Dataset } from '../types'
import { parseCSVFile } from '../utils/csvHelper'

interface DatasetManagerProps {
  datasets: Dataset[]
  onAddDataset: (dataset: Dataset) => void
  onUpdateDataset: (dataset: Dataset) => void
  onRemoveDataset: (id: string) => void
  onClearAll: () => void
}

const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#71717a', // zinc
]

export const DatasetManager = ({
  datasets,
  onAddDataset,
  onUpdateDataset,
  onRemoveDataset,
  onClearAll,
}: DatasetManagerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
          continue
        }

        const parsed = await parseCSVFile(file)
        const newColor = COLOR_PALETTE[(datasets.length + i) % COLOR_PALETTE.length]

        const newDataset: Dataset = {
          id: `ds-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          name: parsed.fileName.replace(/\.csv$/i, ''),
          fileName: parsed.fileName,
          fileSize: parsed.fileSize,
          rows: parsed.rows,
          headers: parsed.headers,
          dateCol: parsed.guessedDateCol,
          metricCol: parsed.guessedMetricCol,
          color: newColor,
          lineStyle: 'solid',
          visible: true,
          yAxisIndex: 0,
          createdAt: Date.now(),
        }

        onAddDataset(newDataset)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'CSV 讀取解析失敗，請確認檔案格式')
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleCloneAsNewMetric = (ds: Dataset) => {
    const otherHeader = ds.headers.find((h) => h !== ds.dateCol && h !== ds.metricCol) || ds.metricCol
    const newColor = COLOR_PALETTE[(datasets.length + 1) % COLOR_PALETTE.length]

    const cloned: Dataset = {
      ...ds,
      id: `ds-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${ds.name} - ${otherHeader}`,
      metricCol: otherHeader,
      color: newColor,
      yAxisIndex: 1,
      createdAt: Date.now(),
    }
    onAddDataset(cloned)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col h-full transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-2.5">
        <div className="flex items-center space-x-2 min-w-0">
          <FileSpreadsheet className="w-4 h-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            資料集管理 (Datasets)
          </h3>
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
            {datasets.length}
          </span>
        </div>

        {datasets.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline transition-colors flex-shrink-0"
          >
            清空所有
          </button>
        )}
      </div>

      {/* CSV Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3.5 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100/50 dark:bg-zinc-800/40'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-950/60'
        } mb-3`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadCloud className="w-6 h-6 mx-auto mb-1 text-zinc-700 dark:text-zinc-300" />
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
          點選或拖曳上傳 CSV 檔案
        </p>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
          支援多檔批次，純前端本機解析
        </p>
        {isProcessing && (
          <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium mt-1 animate-pulse">
            處理解析資料中...
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="mb-2.5 p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-md text-rose-700 dark:text-rose-300 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Datasets List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[460px]">
        {datasets.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
            尚未載入任何 CSV 資料集
          </div>
        ) : (
          datasets.map((ds) => {
            const isExpanded = expandedId === ds.id

            return (
              <div
                key={ds.id}
                className={`rounded-lg border transition-colors ${
                  ds.visible
                    ? 'bg-zinc-50 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800'
                    : 'bg-zinc-100/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-900 opacity-60'
                }`}
              >
                {/* Main Card Row */}
                <div className="p-2.5 flex items-center justify-between gap-1.5 min-w-0">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <input
                      type="color"
                      value={ds.color}
                      onChange={(e) => onUpdateDataset({ ...ds, color: e.target.value })}
                      className="w-4 h-4 rounded border-0 cursor-pointer bg-transparent flex-shrink-0"
                      title="調整線條顏色"
                    />
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={ds.name}
                        title={ds.name}
                        onChange={(e) => onUpdateDataset({ ...ds, name: e.target.value })}
                        className="bg-transparent border-0 font-medium text-xs text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-400 rounded px-1 w-full truncate"
                      />
                      <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 px-1 truncate">
                        <span>{ds.rows.length} 筆</span>
                        <span>•</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 truncate max-w-[90px] sm:max-w-[130px]">
                          {ds.metricCol}
                        </span>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {ds.yAxisIndex === 0 ? '左軸' : '右軸'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-0.5 flex-shrink-0">
                    <button
                      onClick={() => onUpdateDataset({ ...ds, visible: !ds.visible })}
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded"
                      title={ds.visible ? '隱藏此線條' : '顯示此線條'}
                    >
                      {ds.visible ? (
                        <Eye className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCloneAsNewMetric(ds)}
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded"
                      title="以此檔案新增另一指標線"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ds.id)}
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded"
                      title="設定欄位與樣式"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onRemoveDataset(ds.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      title="移除此資料集"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Column & Style Settings */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-1 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                          時間欄位 (Date)
                        </label>
                        <select
                          value={ds.dateCol}
                          onChange={(e) => onUpdateDataset({ ...ds, dateCol: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
                        >
                          {ds.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                          指標欄位 (Metric)
                        </label>
                        <select
                          value={ds.metricCol}
                          onChange={(e) => onUpdateDataset({ ...ds, metricCol: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
                        >
                          {ds.headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                          Y 軸刻度分配
                        </label>
                        <div className="flex rounded overflow-hidden border border-zinc-300 dark:border-zinc-700">
                          <button
                            type="button"
                            onClick={() => onUpdateDataset({ ...ds, yAxisIndex: 0 })}
                            className={`flex-1 py-1 text-[10px] font-medium transition-colors ${
                              ds.yAxisIndex === 0
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            左軸 (主)
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateDataset({ ...ds, yAxisIndex: 1 })}
                            className={`flex-1 py-1 text-[10px] font-medium transition-colors ${
                              ds.yAxisIndex === 1
                                ? 'bg-amber-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            右軸 (副)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                          線條樣式
                        </label>
                        <select
                          value={ds.lineStyle}
                          onChange={(e) =>
                            onUpdateDataset({
                              ...ds,
                              lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted',
                            })
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
                        >
                          <option value="solid">實線 (Solid)</option>
                          <option value="dashed">虛線 (Dashed)</option>
                          <option value="dotted">點線 (Dotted)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
