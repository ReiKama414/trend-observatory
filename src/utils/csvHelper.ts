import Papa from 'papaparse'
import type { DataPoint, Dataset, EventAnnotation } from '../types'
import { parseToDate } from './timeSeries'

export interface ParsedCSVResult {
  fileName: string
  fileSize: number
  headers: string[]
  rows: Record<string, any>[]
  guessedDateCol: string
  guessedMetricCol: string
  totalRows: number
  validRows: number
  warning?: string
}

/**
 * Core parser from raw CSV text content (works in browser & node/tests)
 */
export function parseCSVText(text: string, fileName = 'uploaded.csv', fileSize = 0): ParsedCSVResult {
  if (!text || text.trim() === '') {
    throw new Error('CSV 檔案為空 (0 位元組或全空白)')
  }

  const results = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  })

  if (results.errors && results.errors.length > 0) {
    // Only throw if fatal / no data was retrieved
    if (!results.data || results.data.length === 0) {
      throw new Error(`CSV 解析格式錯誤: ${results.errors[0].message} (第 ${results.errors[0].row} 列)`)
    }
  }

  const rawRows = results.data as Record<string, any>[]
  const headers = (results.meta.fields || []).map((h) => h.trim()).filter(Boolean)

  if (headers.length === 0) {
    throw new Error('CSV 檔案未包含可辨識的標題列 (Header)')
  }

  // Filter out empty rows
  const validRows = rawRows.filter((r) =>
    Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== '')
  )

  if (validRows.length === 0) {
    throw new Error('CSV 檔案僅包含標題列，無任何有效資料數據列')
  }

  let warning: string | undefined
  if (validRows.length > 50000) {
    warning = `資料量較大 (${validRows.length.toLocaleString()} 列)，渲染主圖時建議切換時間粒度（例如日、週或月）以維持流暢度。`
  }

  const { dateCol, metricCol } = guessColumns(headers, validRows)

  return {
    fileName,
    fileSize: fileSize || new Blob([text]).size,
    headers,
    rows: validRows,
    guessedDateCol: dateCol,
    guessedMetricCol: metricCol,
    totalRows: rawRows.length,
    validRows: validRows.length,
    warning,
  }
}

/**
 * Parse an uploaded File object via PapaParse
 */
export function parseCSVFile(file: File): Promise<ParsedCSVResult> {
  return new Promise((resolve, reject) => {
    if (!file || file.size === 0) {
      return reject(new Error(`檔案 "${file?.name || '未知'}" 為空檔案 (0 Bytes)`))
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = parseCSVText(text, file.name, file.size)
        resolve(parsed)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => {
      reject(new Error(`讀取檔案 "${file.name}" 失敗`))
    }
    reader.readAsText(file)
  })
}

/**
 * Intelligent heuristics to guess the Date column and primary numeric Metric column
 */
export function guessColumns(headers: string[], rows: Record<string, any>[]): { dateCol: string; metricCol: string } {
  const sample = rows.slice(0, Math.min(rows.length, 50))
  let dateCol = ''
  let metricCol = ''

  // Common keywords for date
  const dateKeywords = ['date', 'time', 'day', 'timestamp', 'dt', 'period', '日期', '時間', '年月', '年度']

  // 1. Check by column name match
  for (const h of headers) {
    const lower = h.toLowerCase()
    if (dateKeywords.some((kw) => lower.includes(kw))) {
      dateCol = h
      break
    }
  }

  // 2. If no name match, test data validity
  if (!dateCol) {
    for (const h of headers) {
      let validDateCount = 0
      for (const row of sample) {
        if (parseToDate(row[h]) !== null) {
          validDateCount++
        }
      }
      if (sample.length > 0 && validDateCount / sample.length >= 0.7) {
        dateCol = h
        break
      }
    }
  }

  // Fallback date to first header
  if (!dateCol && headers.length > 0) {
    dateCol = headers[0]
  }

  // Common ID keywords to avoid picking as primary metric
  const idKeywords = ['id', '_id', 'uuid', 'index', 'idx', 'row', 'no', 'code', '編號', '序號', '項次']
  // Metric priority keywords
  const metricKeywords = ['val', 'metric', 'amount', 'sales', 'price', 'revenue', 'count', 'total', 'rate', 'close', 'open', 'high', 'low', 'volume', '數值', '金額', '營收', '總計', '數量']

  // Find candidate numeric columns
  const candidateMetrics: string[] = []
  for (const h of headers) {
    if (h === dateCol) continue
    let numericCount = 0
    for (const row of sample) {
      const val = row[h]
      if (val !== null && val !== undefined && val !== '') {
        const cleaned = typeof val === 'string' ? val.replace(/[$,% ]/g, '') : val
        if (!isNaN(parseFloat(cleaned))) {
          numericCount++
        }
      }
    }
    if (sample.length > 0 && numericCount / sample.length >= 0.7) {
      candidateMetrics.push(h)
    }
  }

  // 1. Try candidates that match metric keywords and are NOT ids
  for (const h of candidateMetrics) {
    const lower = h.toLowerCase()
    const isId = idKeywords.some((kw) => lower === kw || lower.endsWith(`_${kw}`) || lower.endsWith(kw))
    if (!isId && metricKeywords.some((kw) => lower.includes(kw))) {
      metricCol = h
      break
    }
  }

  // 2. Try candidates that are not IDs
  if (!metricCol) {
    for (const h of candidateMetrics) {
      const lower = h.toLowerCase()
      const isId = idKeywords.some((kw) => lower === kw || lower.endsWith(`_${kw}`) || lower.endsWith(kw))
      if (!isId) {
        metricCol = h
        break
      }
    }
  }

  // 3. Fallback to first numeric candidate or any non-date column
  if (!metricCol && candidateMetrics.length > 0) {
    metricCol = candidateMetrics[0]
  }

  if (!metricCol) {
    const nonDate = headers.find((h) => h !== dateCol)
    metricCol = nonDate || headers[0]
  }

  return { dateCol, metricCol }
}

/**
 * Export aligned multi-series processed time series to CSV
 */
export function exportProcessedSeriesToCSV(
  seriesList: {
    name: string
    points: DataPoint[]
    maPoints?: DataPoint[]
    includeMA: boolean
  }[],
  filename = 'trend_observatory_export.csv'
) {
  // Collect all unique dates sorted
  const allDatesSet = new Set<string>()
  seriesList.forEach((s) => {
    s.points.forEach((p) => allDatesSet.add(p.date))
    if (s.includeMA && s.maPoints) {
      s.maPoints.forEach((p) => allDatesSet.add(p.date))
    }
  })

  const sortedDates = Array.from(allDatesSet).sort()

  // Build column maps
  const headers = ['Date']
  seriesList.forEach((s) => {
    headers.push(s.name)
    if (s.includeMA && s.maPoints) {
      headers.push(`${s.name} (MA)`)
    }
  })

  const rows: (string | number)[][] = []

  // Pre-index points by date
  const lookupMaps = seriesList.map((s) => {
    const ptMap = new Map<string, number | null>()
    s.points.forEach((p) => ptMap.set(p.date, p.value))

    const maMap = new Map<string, number | null>()
    if (s.includeMA && s.maPoints) {
      s.maPoints.forEach((p) => maMap.set(p.date, p.value))
    }

    return { ptMap, maMap, includeMA: s.includeMA && !!s.maPoints }
  })

  for (const date of sortedDates) {
    const row: (string | number)[] = [date]
    for (const lookup of lookupMaps) {
      const v = lookup.ptMap.get(date)
      row.push(v !== undefined && v !== null ? v : '')

      if (lookup.includeMA) {
        const maVal = lookup.maMap.get(date)
        row.push(maVal !== undefined && maVal !== null ? maVal : '')
      }
    }
    rows.push(row)
  }

  const csvContent = Papa.unparse({
    fields: headers,
    data: rows,
  })

  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export complete workspace project as JSON
 */
export function exportWorkspaceJSON(
  datasets: Dataset[],
  events: EventAnnotation[],
  settings: Record<string, any>,
  filename = 'trend_observatory_workspace.json'
) {
  const payload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    datasets,
    events,
    settings,
  }

  const jsonStr = JSON.stringify(payload, null, 2)
  downloadBlob(jsonStr, filename, 'application/json;charset=utf-8;')
}

/**
 * Trigger client-side file download
 */
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
