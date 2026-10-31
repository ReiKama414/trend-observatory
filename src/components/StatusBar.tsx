import { HardDrive, ShieldCheck, Clock, TrendingUp, Layers } from 'lucide-react'
import type { TimeGranularity, TransformMode } from '../types'

interface StatusBarProps {
  totalPoints: number
  datasetCount: number
  granularity: TimeGranularity
  dateRange: [string, string] | null
  transformMode: TransformMode
  maEnabled: boolean
  maWindow: number
}

const granularityNames: Record<TimeGranularity, string> = {
  raw: '原始採樣',
  daily: '日粒度 (Daily)',
  weekly: '週粒度 (Weekly)',
  monthly: '月粒度 (Monthly)',
  quarterly: '季粒度 (Quarterly)',
  yearly: '年粒度 (Yearly)',
}

const transformNames: Record<TransformMode, string> = {
  raw: '原始數值',
  baseline100: '基準 100 標準化',
  mom: '月增率 (MoM %)',
  yoy: '年增率 (YoY %)',
  pct_change: '期別變動率 (PoP %)',
}

export const StatusBar = ({
  totalPoints,
  datasetCount,
  granularity,
  dateRange,
  transformMode,
  maEnabled,
  maWindow,
}: StatusBarProps) => {
  return (
    <footer className="bg-zinc-900 dark:bg-black text-zinc-400 border-t border-zinc-800 text-[11px] py-2 px-3 sm:px-4 sticky bottom-0 z-30 select-none transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 min-w-0">
        {/* Left Stats: Records and Series */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <span className="text-zinc-400">總採樣點數:</span>
            <span className="font-mono font-semibold">{totalPoints.toLocaleString()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400">活躍序列:</span>
            <span className="font-mono text-zinc-300 font-semibold">{datasetCount} 組</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400">採樣粒度:</span>
            <span className="font-mono text-zinc-300">{granularityNames[granularity]}</span>
          </div>

          {dateRange && (
            <div className="hidden lg:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
              <span className="text-zinc-400 whitespace-nowrap">目前視圖區間:</span>
              <span className="font-mono text-cyan-400 font-medium whitespace-nowrap">
                {dateRange[0]} ~ {dateRange[1]}
              </span>
            </div>
          )}

          <div className="hidden xl:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400">轉換計算:</span>
            <span className="text-zinc-300">
              {transformNames[transformMode]}
              {maEnabled && ` · SMA(${maWindow})`}
            </span>
          </div>
        </div>

        {/* Right Status: Privacy and IndexedDB */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-mono text-[10px] sm:text-[11px]">IndexedDB 狀態已同步</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-medium text-[10px] sm:text-[11px] hidden sm:inline">
              本地 Sandbox 零傳輸
            </span>
            <span className="font-mono font-medium text-[10px] sm:hidden">
              本地沙盒
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
