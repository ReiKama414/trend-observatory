import type { Dispatch, SetStateAction } from 'react'
import {
  Clock,
  Layers,
  Calculator,
  TrendingUp,
  Hash,
} from 'lucide-react'
import type {
  AggregationMethod,
  MissingDataMethod,
  MovingAverageConfig,
  TimeGranularity,
  TransformMode,
} from '../types'

interface ControlToolbarProps {
  granularity: TimeGranularity
  setGranularity: (g: TimeGranularity) => void
  aggregation: AggregationMethod
  setAggregation: (a: AggregationMethod) => void
  missingMethod: MissingDataMethod
  setMissingMethod: (m: MissingDataMethod) => void
  transformMode: TransformMode
  setTransformMode: (t: TransformMode) => void
  baseDate: string
  setBaseDate: (d: string) => void
  availableDates: string[]
  maConfig: MovingAverageConfig
  setMaConfig: Dispatch<SetStateAction<MovingAverageConfig>>
}

export const ControlToolbar = ({
  granularity,
  setGranularity,
  aggregation,
  setAggregation,
  missingMethod,
  setMissingMethod,
  transformMode,
  setTransformMode,
  baseDate,
  setBaseDate,
  availableDates,
  maConfig,
  setMaConfig,
}: ControlToolbarProps) => {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 py-2 text-xs select-none transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 min-w-0">
        {/* Group 1: Granularity, Aggregation & Missing Data */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Time Granularity */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">粒度:</span>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="raw" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">原始 (Raw)</option>
              <option value="daily" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">日 (Daily)</option>
              <option value="weekly" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">週 (Weekly)</option>
              <option value="monthly" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">月 (Monthly)</option>
              <option value="quarterly" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">季 (Quarterly)</option>
              <option value="yearly" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">年 (Yearly)</option>
            </select>
          </div>

          {/* Aggregation Method */}
          {granularity !== 'raw' && (
            <div className="flex items-center space-x-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">聚合:</span>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as AggregationMethod)}
                className="bg-transparent text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none cursor-pointer"
              >
                <option value="avg" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">平均 (Avg)</option>
                <option value="sum" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">加總 (Sum)</option>
                <option value="max" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">最大 (Max)</option>
                <option value="min" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">最小 (Min)</option>
                <option value="last" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">期末 (Last)</option>
              </select>
            </div>
          )}

          {/* Missing Dates Handling */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs">
            <Hash className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">缺失值:</span>
            <select
              value={missingMethod}
              onChange={(e) => setMissingMethod(e.target.value as MissingDataMethod)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="none" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">保留原始</option>
              <option value="forward_fill" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">前向填補 (LOCF)</option>
              <option value="linear_interpolate" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">線性插值 (Linear)</option>
              <option value="zero_fill" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">補零 (Zero)</option>
            </select>
          </div>
        </div>

        {/* Group 2: Transforms & Moving Average */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {/* Transform Mode */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs">
            <Calculator className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">轉換:</span>
            <select
              value={transformMode}
              onChange={(e) => setTransformMode(e.target.value as TransformMode)}
              className="bg-transparent text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="raw" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">原始數值 (Raw)</option>
              <option value="baseline100" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">基準值 100 標準化 (Rebase)</option>
              <option value="mom" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">月增率 (MoM %)</option>
              <option value="yoy" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">年增率 (YoY %)</option>
              <option value="pct_change" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">期別變動率 (PoP %)</option>
            </select>
          </div>

          {/* Base Date selector when in baseline100 mode */}
          {transformMode === 'baseline100' && (
            <div className="flex items-center space-x-1.5 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1.5 rounded-md border border-cyan-200 dark:border-cyan-800/60 text-cyan-900 dark:text-cyan-300">
              <span className="font-medium text-[11px]">基準日:</span>
              <select
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="bg-white dark:bg-zinc-900 text-cyan-800 dark:text-cyan-200 font-mono text-xs rounded px-1.5 py-0.5 border border-cyan-300 dark:border-cyan-700/60 focus:outline-none max-w-[130px] truncate"
              >
                {availableDates.slice(0, 100).map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Moving Average Controls */}
          <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={maConfig.enabled}
                onChange={(e) =>
                  setMaConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 bg-white dark:bg-zinc-800 cursor-pointer"
              />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">均線 (MA)</span>
            </label>

            {maConfig.enabled && (
              <div className="flex items-center space-x-1.5 pl-1.5 border-l border-zinc-200 dark:border-zinc-700">
                <select
                  value={maConfig.type}
                  onChange={(e) =>
                    setMaConfig((prev) => ({
                      ...prev,
                      type: e.target.value as 'sma' | 'ema',
                    }))
                  }
                  className="bg-transparent text-zinc-900 dark:text-zinc-100 font-mono font-medium focus:outline-none cursor-pointer"
                >
                  <option value="sma" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">SMA</option>
                  <option value="ema" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">EMA</option>
                </select>
                <span className="text-zinc-400">-</span>
                <input
                  type="number"
                  min="2"
                  max="200"
                  value={maConfig.window}
                  onChange={(e) =>
                    setMaConfig((prev) => ({
                      ...prev,
                      window: Math.max(2, Math.min(200, parseInt(e.target.value) || 20)),
                    }))
                  }
                  className="w-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1 py-0.5 rounded font-mono text-center focus:outline-none border border-zinc-200 dark:border-zinc-700"
                />
                <span className="text-[10px] text-zinc-400">期</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
