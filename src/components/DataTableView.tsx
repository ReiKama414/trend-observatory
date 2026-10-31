import { Fragment, useMemo, useState } from 'react'
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ProcessedSeries } from '../types'
import { exportProcessedSeriesToCSV } from '../utils/csvHelper'

interface DataTableViewProps {
  seriesList: ProcessedSeries[]
}

export const DataTableView = ({ seriesList }: DataTableViewProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const validSeries = useMemo(
    () => seriesList.filter((s) => s.points.length > 0),
    [seriesList]
  )

  // Merge dates
  const tableData = useMemo(() => {
    const datesSet = new Set<string>()
    validSeries.forEach((s) => {
      s.points.forEach((p) => datesSet.add(p.date))
    })

    const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a)) // desc

    const seriesLookups = validSeries.map((s) => {
      const ptMap = new Map<string, number | null>()
      s.points.forEach((p) => ptMap.set(p.date, p.value))

      const maMap = new Map<string, number | null>()
      if (s.maPoints) {
        s.maPoints.forEach((p) => maMap.set(p.date, p.value))
      }

      return {
        id: s.datasetId,
        name: s.datasetName,
        color: s.color,
        hasMA: !!s.maPoints,
        ptMap,
        maMap,
      }
    })

    return { sortedDates, seriesLookups }
  }, [validSeries])

  // Filter by search
  const filteredDates = useMemo(() => {
    if (!searchTerm.trim()) return tableData.sortedDates
    const term = searchTerm.toLowerCase()
    return tableData.sortedDates.filter((d) => d.includes(term))
  }, [tableData.sortedDates, searchTerm])

  const totalPages = Math.ceil(filteredDates.length / pageSize) || 1
  const paginatedDates = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDates.slice(start, start + pageSize)
  }, [filteredDates, currentPage])

  const handleDownloadCSV = () => {
    const list = validSeries.map((s) => ({
      name: s.datasetName,
      points: s.points,
      maPoints: s.maPoints,
      includeMA: !!s.maPoints,
    }))
    exportProcessedSeriesToCSV(list, `trend_observatory_table_${Date.now()}.csv`)
  }

  if (validSeries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
        <p className="text-xs">尚無資料，請於左側上傳 CSV 或載入範例資料集</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col h-full space-y-3 transition-colors">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="搜尋日期 (例: 2024-05)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 w-44 sm:w-56"
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            共 {filteredDates.length} 筆
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出本表 CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-[580px]">
        <table className="w-full text-xs text-left border-collapse min-w-[320px]">
          <thead className="bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
            <tr className="text-zinc-700 dark:text-zinc-300">
              <th className="py-2.5 px-3 font-semibold w-32 min-w-[125px] whitespace-nowrap" title="採樣聚合日期 (Date)">
                日期 (Date)
              </th>
              {tableData.seriesLookups.map((s) => (
                <Fragment key={s.id}>
                  <th
                    className="py-2.5 px-3 font-semibold min-w-[170px] max-w-[280px]"
                    title={`資料集名稱: ${s.name}`}
                  >
                    <div className="relative group inline-flex items-center space-x-1.5 cursor-pointer max-w-full">
                      <span
                        className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="truncate max-w-[220px]" title={s.name}>
                        {s.name}
                      </span>
                      {/* Rich Floating Tooltip on Hover */}
                      <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover:flex flex-col z-30 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-zinc-100 bg-zinc-900/95 dark:bg-zinc-800/95 border border-zinc-700/80 rounded-md shadow-xl whitespace-normal min-w-[180px] max-w-xs transition-opacity animate-fadeIn">
                        <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span>{s.name}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          時間序列觀測指標欄位數值
                        </div>
                      </div>
                    </div>
                  </th>
                  {s.hasMA && (
                    <th
                      className="py-2.5 px-3 font-semibold text-zinc-500 dark:text-zinc-400 min-w-[170px] max-w-[280px]"
                      title={`移動平均線: ${s.name} (MA)`}
                    >
                      <div className="relative group inline-flex items-center space-x-1.5 cursor-pointer max-w-full">
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="truncate max-w-[220px]" title={`${s.name} (MA)`}>
                          {s.name} (MA)
                        </span>
                        {/* Rich Floating Tooltip on Hover */}
                        <div className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover:flex flex-col z-30 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-zinc-100 bg-zinc-900/95 dark:bg-zinc-800/95 border border-zinc-700/80 rounded-md shadow-xl whitespace-normal min-w-[180px] max-w-xs transition-opacity animate-fadeIn">
                          <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span>{s.name} (MA)</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            滑動週期均線平滑數值
                          </div>
                        </div>
                      </div>
                    </th>
                  )}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
            {paginatedDates.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                  查無符合搜尋條件的日期
                </td>
              </tr>
            ) : (
              paginatedDates.map((date) => (
                <tr key={date} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="py-2 px-3 font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap min-w-[125px]">
                    {date}
                  </td>
                  {tableData.seriesLookups.map((s) => {
                    const val = s.ptMap.get(date)
                    const maVal = s.maMap.get(date)

                    return (
                      <Fragment key={s.id}>
                        <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {val !== undefined && val !== null ? val.toLocaleString() : '-'}
                        </td>
                        {s.hasMA && (
                          <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                            {maVal !== undefined && maVal !== null ? maVal.toLocaleString() : '-'}
                          </td>
                        )}
                      </Fragment>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            頁次 {currentPage} / {totalPages}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
