import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import type { Dataset, SeriesMetrics } from '../types'

interface MetricsSummaryCardProps {
  metricsList: SeriesMetrics[]
  correlationData: { datasets: string[]; matrix: number[][] }
  datasets?: Dataset[]
}

export const MetricsSummaryCard = ({
  metricsList,
  correlationData,
}: MetricsSummaryCardProps) => {
  if (metricsList.length === 0) return null

  return (
    <div className="space-y-3 min-w-0">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 min-w-0 items-start">
        {metricsList.map((m) => {
          const isPositive = (m.periodGrowthPct ?? 0) >= 0

          return (
            <div
              key={m.datasetId}
              data-testid="metrics-card"
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between transition-colors min-w-0 h-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: m.color }}
                  />
                  <h4
                    className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 break-words leading-tight"
                    title={m.name}
                  >
                    {m.name}
                  </h4>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  {m.count} 點
                </span>
              </div>

              {/* Main Metric: Period Growth % & CAGR */}
              <div className="my-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 min-w-0">
                <div className="min-w-0">
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">區間成長率</div>
                  <div
                    className={`text-base sm:text-lg font-bold flex items-center space-x-1 ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 inline-block mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 inline-block mr-1 flex-shrink-0" />
                    )}
                    <span className="break-all font-mono">
                      {m.periodGrowthPct !== null
                        ? `${isPositive ? '+' : ''}${m.periodGrowthPct}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {m.cagr !== null && (
                  <div className="text-right min-w-0">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">CAGR (年化)</div>
                    <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 font-mono break-all">
                      {m.cagr > 0 ? '+' : ''}
                      {m.cagr}%
                    </div>
                  </div>
                )}
              </div>

              {/* Value stats (2-column grid that naturally expands height on zoom) */}
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 mb-2 min-w-0">
                <div className="min-w-0">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px]">期初</div>
                  <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {m.startValue !== null ? m.startValue.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px]">期末</div>
                  <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {m.endValue !== null ? m.endValue.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px]">均值</div>
                  <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {m.avgValue !== null ? m.avgValue.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px]">標準差</div>
                  <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {m.stdDev !== null ? m.stdDev.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px]">最低</div>
                  <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {m.minValue !== null ? m.minValue.toLocaleString() : '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px]">最高</div>
                  <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {m.maxValue !== null ? m.maxValue.toLocaleString() : '-'}
                  </div>
                </div>
              </div>

              {/* Date footer */}
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex flex-wrap justify-between items-center pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60 font-mono gap-1 min-w-0">
                <span className="truncate whitespace-nowrap">{m.startDate}</span>
                <span className="text-zinc-400 whitespace-nowrap">~</span>
                <span className="truncate whitespace-nowrap">{m.endDate}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Correlation Matrix Card (if >= 2 visible datasets) */}
      {correlationData.datasets.length >= 2 && (
        <div
          data-testid="correlation-card"
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-colors min-w-0"
        >
          {/* Header in normal document flow */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2.5 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2 min-w-0">
              <Activity className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                皮爾森相關係數矩陣 (Pearson Correlation Matrix)
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              (-1.0 負相關 至 +1.0 正相關)
            </span>
          </div>

          <div className="overflow-x-auto max-w-full rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-[11px] text-left border-collapse min-w-[320px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40">
                  <th className="py-2.5 px-3 font-medium min-w-[100px]">指標名稱</th>
                  {correlationData.datasets.map((name, i) => (
                    <th key={i} className="py-2.5 px-3 text-center font-medium min-w-[90px] max-w-[140px] truncate" title={name}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {correlationData.datasets.map((rowName, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200 max-w-[140px] truncate" title={rowName}>
                      {rowName}
                    </td>
                    {correlationData.matrix[rIdx].map((rVal, cIdx) => {
                      if (rIdx === cIdx) {
                        return (
                          <td key={cIdx} className="py-2 px-3 text-center font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950/30">
                            1.000
                          </td>
                        )
                      }
                      if (isNaN(rVal)) {
                        return (
                          <td key={cIdx} className="py-2 px-3 text-center font-mono text-zinc-400">
                            -
                          </td>
                        )
                      }

                      // Color code correlation
                      let colorClass = 'text-zinc-700 dark:text-zinc-300'
                      let bgClass = 'bg-transparent'
                      if (rVal >= 0.7) {
                        colorClass = 'text-emerald-700 dark:text-emerald-300 font-bold'
                        bgClass = 'bg-emerald-50 dark:bg-emerald-950/40'
                      } else if (rVal >= 0.4) {
                        colorClass = 'text-emerald-600 dark:text-emerald-400'
                      } else if (rVal <= -0.7) {
                        colorClass = 'text-rose-700 dark:text-rose-300 font-bold'
                        bgClass = 'bg-rose-50 dark:bg-rose-950/40'
                      } else if (rVal <= -0.4) {
                        colorClass = 'text-rose-600 dark:text-rose-400'
                      }

                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 text-center font-mono transition-colors ${colorClass} ${bgClass}`}
                        >
                          {rVal > 0 ? `+${rVal.toFixed(3)}` : rVal.toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
