import type {
  AggregationMethod,
  DataPoint,
  Dataset,
  MissingDataMethod,
  MovingAverageConfig,
  SeriesMetrics,
  TimeGranularity,
  TransformMode,
} from '../types'

/**
 * Flexible date parser for various standard and non-standard time-series date formats
 */
export function parseToDate(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null

  // If already a Date object
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val
  }

  // If numeric timestamp
  if (typeof val === 'number') {
    // If 10 digits (seconds), convert to ms
    const ms = val > 1e11 ? val : val * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }

  const str = String(val).trim()
  if (!str) return null

  // 8-digit YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    const y = parseInt(str.slice(0, 4), 10)
    const m = parseInt(str.slice(4, 6), 10) - 1
    const d = parseInt(str.slice(6, 8), 10)
    const dt = new Date(y, m, d)
    return isNaN(dt.getTime()) ? null : dt
  }

  // 6-digit YYYYMM
  if (/^\d{6}$/.test(str)) {
    const y = parseInt(str.slice(0, 4), 10)
    const m = parseInt(str.slice(4, 6), 10) - 1
    const dt = new Date(y, m, 1)
    return isNaN(dt.getTime()) ? null : dt
  }

  // Short numeric strings (< 6 digits) are IDs or numbers, not dates
  if (/^\d{1,5}$/.test(str)) {
    return null
  }

  // Replace slashes or dots with dashes for standard ISO parsing: 2023/05/12 -> 2023-05-12
  const cleaned = str.replace(/[./]/g, '-')
  
  // Try direct parse
  let parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) return parsed

  // Try standard Date.parse on original string
  parsed = new Date(str)
  if (!isNaN(parsed.getTime())) return parsed

  return null
}

/**
 * Format a Date object into standard ISO YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Get date bucket key based on time granularity
 */
export function getGranularityBucket(d: Date, granularity: TimeGranularity): { key: string; displayDate: string; timestamp: number } {
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()

  switch (granularity) {
    case 'daily': {
      const displayDate = formatDateISO(d)
      const ts = new Date(y, m, day).getTime()
      return { key: displayDate, displayDate, timestamp: ts }
    }
    case 'weekly': {
      // Find Monday of the current week
      const dayOfWeek = d.getDay() // 0 = Sun, 1 = Mon ...
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const mon = new Date(y, m, day + diffToMon)
      const displayDate = formatDateISO(mon)
      return { key: displayDate, displayDate, timestamp: mon.getTime() }
    }
    case 'monthly': {
      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`
      const ts = new Date(y, m, 1).getTime()
      return { key: monthStr, displayDate: `${monthStr}-01`, timestamp: ts }
    }
    case 'quarterly': {
      const q = Math.floor(m / 3) + 1
      const qStr = `${y}-Q${q}`
      const startMonth = (q - 1) * 3
      const ts = new Date(y, startMonth, 1).getTime()
      const displayDate = `${y}-${String(startMonth + 1).padStart(2, '0')}-01`
      return { key: qStr, displayDate, timestamp: ts }
    }
    case 'yearly': {
      const yStr = `${y}`
      const ts = new Date(y, 0, 1).getTime()
      return { key: yStr, displayDate: `${y}-01-01`, timestamp: ts }
    }
    case 'raw':
    default: {
      const displayDate = formatDateISO(d)
      return { key: String(d.getTime()), displayDate, timestamp: d.getTime() }
    }
  }
}

/**
 * Extract raw points from dataset rows using specified date and metric columns
 */
export function extractDataPoints(dataset: Dataset): DataPoint[] {
  const { rows, dateCol, metricCol } = dataset
  if (!rows || rows.length === 0 || !dateCol || !metricCol) return []

  const points: DataPoint[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rawDate = row[dateCol]
    const d = parseToDate(rawDate)
    if (!d) continue

    const rawVal = row[metricCol]
    let numVal: number | null = null
    if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
      const cleaned = typeof rawVal === 'string' ? rawVal.replace(/[$,% ]/g, '') : rawVal
      const parsed = parseFloat(cleaned)
      if (!isNaN(parsed)) {
        numVal = parsed
      }
    }

    points.push({
      date: formatDateISO(d),
      timestamp: d.getTime(),
      value: numVal,
      rawRow: row,
    })
  }

  // Sort chronologically
  points.sort((a, b) => a.timestamp - b.timestamp)
  return points
}

/**
 * Resample data points by time granularity and aggregation method
 */
export function resampleData(
  points: DataPoint[],
  granularity: TimeGranularity,
  agg: AggregationMethod
): DataPoint[] {
  if (points.length === 0) return []
  if (granularity === 'raw') return points

  // Group by bucket
  const buckets = new Map<string, { displayDate: string; timestamp: number; values: number[]; rawRows: any[] }>()

  for (const pt of points) {
    const d = new Date(pt.timestamp)
    const { key, displayDate, timestamp } = getGranularityBucket(d, granularity)

    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = { displayDate, timestamp, values: [], rawRows: [] }
      buckets.set(key, bucket)
    }

    if (pt.value !== null && !isNaN(pt.value)) {
      bucket.values.push(pt.value)
    }
    if (pt.rawRow) {
      bucket.rawRows.push(pt.rawRow)
    }
  }

  // Aggregate buckets
  const result: DataPoint[] = []
  for (const [, bucket] of buckets.entries()) {
    let aggValue: number | null = null
    const vals = bucket.values

    if (vals.length > 0) {
      switch (agg) {
        case 'sum':
          aggValue = vals.reduce((acc, v) => acc + v, 0)
          break
        case 'max':
          aggValue = Math.max(...vals)
          break
        case 'min':
          aggValue = Math.min(...vals)
          break
        case 'last':
          aggValue = vals[vals.length - 1]
          break
        case 'avg':
        default:
          aggValue = vals.reduce((acc, v) => acc + v, 0) / vals.length
          break
      }
    }

    result.push({
      date: bucket.displayDate,
      timestamp: bucket.timestamp,
      value: aggValue !== null ? Number(aggValue.toFixed(4)) : null,
      rawRow: bucket.rawRows[bucket.rawRows.length - 1],
    })
  }

  result.sort((a, b) => a.timestamp - b.timestamp)
  return result
}

/**
 * Fill missing dates in a time series (LOCF, Linear Interpolation, Zero Fill)
 */
export function fillMissingDates(
  points: DataPoint[],
  method: MissingDataMethod,
  granularity: TimeGranularity
): DataPoint[] {
  if (points.length < 2 || method === 'none') {
    return points
  }

  // We support continuous filling for daily, weekly, and monthly
  if (granularity === 'raw') {
    // For raw, missing data can be filled in-place for null entries
    return fillInPlaceGaps(points, method)
  }

  // Step interval in ms
  const startDate = new Date(points[0].timestamp)
  const endDate = new Date(points[points.length - 1].timestamp)

  const filledMap = new Map<string, DataPoint>()
  for (const pt of points) {
    filledMap.set(pt.date, pt)
  }

  const generatedGrid: DataPoint[] = []
  const curr = new Date(startDate)

  // Step generator according to granularity
  const advance = (d: Date) => {
    switch (granularity) {
      case 'daily':
        d.setDate(d.getDate() + 1)
        break
      case 'weekly':
        d.setDate(d.getDate() + 7)
        break
      case 'monthly':
        d.setMonth(d.getMonth() + 1)
        break
      case 'quarterly':
        d.setMonth(d.getMonth() + 3)
        break
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1)
        break
    }
  }

  while (curr.getTime() <= endDate.getTime()) {
    const dIso = formatDateISO(curr)
    const existing = filledMap.get(dIso)

    if (existing) {
      generatedGrid.push({ ...existing })
    } else {
      generatedGrid.push({
        date: dIso,
        timestamp: curr.getTime(),
        value: null,
      })
    }
    advance(curr)
  }

  return fillInPlaceGaps(generatedGrid, method)
}

function fillInPlaceGaps(points: DataPoint[], method: MissingDataMethod): DataPoint[] {
  const result: DataPoint[] = points.map((p) => ({ ...p }))

  if (method === 'zero_fill') {
    for (let i = 0; i < result.length; i++) {
      if (result[i].value === null || isNaN(result[i].value!)) {
        result[i].value = 0
      }
    }
    return result
  }

  if (method === 'forward_fill') {
    let lastValid: number | null = null
    for (let i = 0; i < result.length; i++) {
      if (result[i].value !== null && !isNaN(result[i].value!)) {
        lastValid = result[i].value
      } else if (lastValid !== null) {
        result[i].value = lastValid
      }
    }
    return result
  }

  if (method === 'linear_interpolate') {
    for (let i = 0; i < result.length; i++) {
      if (result[i].value === null || isNaN(result[i].value!)) {
        // Find previous valid index
        let prevIdx = i - 1
        while (prevIdx >= 0 && (result[prevIdx].value === null || isNaN(result[prevIdx].value!))) {
          prevIdx--
        }

        // Find next valid index
        let nextIdx = i + 1
        while (nextIdx < result.length && (result[nextIdx].value === null || isNaN(result[nextIdx].value!))) {
          nextIdx++
        }

        if (prevIdx >= 0 && nextIdx < result.length) {
          const prevVal = result[prevIdx].value!
          const nextVal = result[nextIdx].value!
          const prevTs = result[prevIdx].timestamp
          const nextTs = result[nextIdx].timestamp
          const currTs = result[i].timestamp

          const factor = (currTs - prevTs) / (nextTs - prevTs)
          result[i].value = Number((prevVal + (nextVal - prevVal) * factor).toFixed(4))
        } else if (prevIdx >= 0) {
          result[i].value = result[prevIdx].value
        } else if (nextIdx < result.length) {
          result[i].value = result[nextIdx].value
        }
      }
    }
    return result
  }

  return result
}

/**
 * Calculate Baseline 100 normalization (Rebase series to 100 at specified base date or first point)
 */
export function calculateBaseline100(points: DataPoint[], baseDate?: string): DataPoint[] {
  if (points.length === 0) return []

  let basePoint: DataPoint | undefined
  if (baseDate) {
    basePoint = points.find((p) => p.date === baseDate && p.value !== null && p.value !== 0)
  }

  if (!basePoint) {
    basePoint = points.find((p) => p.value !== null && p.value !== 0)
  }

  if (!basePoint || basePoint.value === null || basePoint.value === 0) {
    return points
  }

  const baseVal = basePoint.value

  return points.map((p) => {
    if (p.value === null || isNaN(p.value)) {
      return { ...p, value: null }
    }
    const normalized = (p.value / baseVal) * 100
    return {
      ...p,
      value: Number(normalized.toFixed(3)),
    }
  })
}

/**
 * Calculate Growth Rates (MoM, YoY, or Period-to-Period pct change)
 */
export function calculateGrowthRates(
  points: DataPoint[],
  mode: 'mom' | 'yoy' | 'pct_change',
  granularity: TimeGranularity
): DataPoint[] {
  if (points.length === 0) return []

  const result: DataPoint[] = []

  // Create date lookup map for accurate MoM/YoY matching
  const dateMap = new Map<string, number>()
  for (const p of points) {
    if (p.value !== null && !isNaN(p.value)) {
      dateMap.set(p.date, p.value)
    }
  }

  for (let i = 0; i < points.length; i++) {
    const curr = points[i]
    if (curr.value === null || isNaN(curr.value)) {
      result.push({ ...curr, value: null })
      continue
    }

    let prevValue: number | undefined

    if (mode === 'pct_change') {
      // Previous available point
      if (i > 0 && points[i - 1].value !== null) {
        prevValue = points[i - 1].value!
      }
    } else if (mode === 'mom') {
      if (granularity === 'monthly') {
        // 1 month prior
        if (i >= 1 && points[i - 1].value !== null) {
          prevValue = points[i - 1].value!
        }
      } else {
        // Find date approx 1 month (30 days) earlier
        const targetTs = curr.timestamp - 30 * 86400000
        prevValue = findNearestValue(points, targetTs, 7 * 86400000)
      }
    } else if (mode === 'yoy') {
      if (granularity === 'monthly') {
        // 12 months prior
        if (i >= 12 && points[i - 12].value !== null) {
          prevValue = points[i - 12].value!
        }
      } else if (granularity === 'quarterly') {
        // 4 quarters prior
        if (i >= 4 && points[i - 4].value !== null) {
          prevValue = points[i - 4].value!
        }
      } else if (granularity === 'yearly') {
        // 1 year prior
        if (i >= 1 && points[i - 1].value !== null) {
          prevValue = points[i - 1].value!
        }
      } else {
        // Daily: Find date approx 365 days earlier
        const targetTs = curr.timestamp - 365.25 * 86400000
        prevValue = findNearestValue(points, targetTs, 14 * 86400000)
      }
    }

    if (prevValue !== undefined && prevValue !== 0 && !isNaN(prevValue)) {
      const growth = ((curr.value - prevValue) / Math.abs(prevValue)) * 100
      result.push({
        ...curr,
        value: Number(growth.toFixed(3)),
      })
    } else {
      result.push({
        ...curr,
        value: null,
      })
    }
  }

  return result
}

function findNearestValue(points: DataPoint[], targetTs: number, maxToleranceMs: number): number | undefined {
  let bestVal: number | undefined
  let bestDist = Infinity

  for (const p of points) {
    if (p.value === null || isNaN(p.value)) continue
    const dist = Math.abs(p.timestamp - targetTs)
    if (dist <= maxToleranceMs && dist < bestDist) {
      bestDist = dist
      bestVal = p.value
    }
  }

  return bestVal
}

/**
 * Calculate Moving Average (SMA or EMA)
 */
export function calculateMovingAverage(
  points: DataPoint[],
  config: MovingAverageConfig
): DataPoint[] {
  const { window: win, type } = config
  if (points.length === 0 || win <= 1) return points

  const result: DataPoint[] = []

  if (type === 'sma') {
    for (let i = 0; i < points.length; i++) {
      const curr = points[i]
      if (i < win - 1) {
        result.push({ ...curr, value: null })
        continue
      }

      let sum = 0
      let validCount = 0
      for (let j = i - win + 1; j <= i; j++) {
        const val = points[j].value
        if (val !== null && !isNaN(val)) {
          sum += val
          validCount++
        }
      }

      // At least 70% valid points in window
      if (validCount >= Math.ceil(win * 0.7)) {
        result.push({
          ...curr,
          value: Number((sum / validCount).toFixed(4)),
        })
      } else {
        result.push({ ...curr, value: null })
      }
    }
  } else {
    // EMA
    const alpha = 2 / (win + 1)
    let prevEMA: number | null = null

    for (let i = 0; i < points.length; i++) {
      const curr = points[i]
      const val = curr.value

      if (val === null || isNaN(val)) {
        result.push({ ...curr, value: prevEMA !== null ? Number(prevEMA.toFixed(4)) : null })
        continue
      }

      if (prevEMA === null) {
        prevEMA = val
      } else {
        prevEMA = alpha * val + (1 - alpha) * prevEMA
      }

      result.push({
        ...curr,
        value: Number(prevEMA.toFixed(4)),
      })
    }
  }

  return result
}

/**
 * Apply full pipeline transformations: Resample -> Fill Missing -> Transform (Raw/Baseline/MoM/YoY)
 */
export function processSeriesPipeline(
  dataset: Dataset,
  granularity: TimeGranularity,
  agg: AggregationMethod,
  missingMethod: MissingDataMethod,
  transform: TransformMode,
  maConfig: MovingAverageConfig,
  baseDate?: string
): { points: DataPoint[]; maPoints?: DataPoint[] } {
  // 1. Extract raw points
  const rawPoints = extractDataPoints(dataset)
  if (rawPoints.length === 0) return { points: [] }

  // 2. Resample
  const resampled = resampleData(rawPoints, granularity, agg)

  // 3. Fill missing dates
  const filled = fillMissingDates(resampled, missingMethod, granularity)

  // 4. Transform Mode
  let transformed: DataPoint[] = filled
  switch (transform) {
    case 'baseline100':
      transformed = calculateBaseline100(filled, baseDate)
      break
    case 'mom':
      transformed = calculateGrowthRates(filled, 'mom', granularity)
      break
    case 'yoy':
      transformed = calculateGrowthRates(filled, 'yoy', granularity)
      break
    case 'pct_change':
      transformed = calculateGrowthRates(filled, 'pct_change', granularity)
      break
    case 'raw':
    default:
      transformed = filled
      break
  }

  // 5. Moving Average
  let maPoints: DataPoint[] | undefined
  if (maConfig.enabled) {
    maPoints = calculateMovingAverage(transformed, maConfig)
  }

  return { points: transformed, maPoints }
}

/**
 * Calculate Summary Metrics & Period Growth Rate for a series
 */
export function calculateSeriesMetrics(
  dataset: Dataset,
  points: DataPoint[],
  dateRange?: [string, string]
): SeriesMetrics {
  const filtered = dateRange
    ? points.filter((p) => p.date >= dateRange[0] && p.date <= dateRange[1] && p.value !== null)
    : points.filter((p) => p.value !== null)

  const defaultResult: SeriesMetrics = {
    datasetId: dataset.id,
    name: dataset.name,
    color: dataset.color,
    count: filtered.length,
    startDate: filtered.length > 0 ? filtered[0].date : '',
    endDate: filtered.length > 0 ? filtered[filtered.length - 1].date : '',
    startValue: null,
    endValue: null,
    minValue: null,
    maxValue: null,
    avgValue: null,
    stdDev: null,
    periodGrowthPct: null,
    cagr: null,
  }

  if (filtered.length === 0) return defaultResult

  const values = filtered.map((p) => p.value!).filter((v) => !isNaN(v))
  if (values.length === 0) return defaultResult

  const startValue = values[0]
  const endValue = values[values.length - 1]
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const sum = values.reduce((acc, v) => acc + v, 0)
  const avgValue = sum / values.length

  // StdDev
  const variance = values.reduce((acc, v) => acc + Math.pow(v - avgValue, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Period Growth %
  let periodGrowthPct: number | null = null
  if (startValue !== 0 && !isNaN(startValue)) {
    periodGrowthPct = ((endValue - startValue) / Math.abs(startValue)) * 100
  }

  // CAGR
  let cagr: number | null = null
  const startDate = new Date(filtered[0].timestamp)
  const endDate = new Date(filtered[filtered.length - 1].timestamp)
  const diffDays = (endDate.getTime() - startDate.getTime()) / 86400000

  if (diffDays >= 30 && startValue > 0 && endValue > 0) {
    const years = diffDays / 365.25
    cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100
  }

  return {
    datasetId: dataset.id,
    name: dataset.name,
    color: dataset.color,
    count: values.length,
    startDate: filtered[0].date,
    endDate: filtered[filtered.length - 1].date,
    startValue: Number(startValue.toFixed(2)),
    endValue: Number(endValue.toFixed(2)),
    minValue: Number(minValue.toFixed(2)),
    maxValue: Number(maxValue.toFixed(2)),
    avgValue: Number(avgValue.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    periodGrowthPct: periodGrowthPct !== null ? Number(periodGrowthPct.toFixed(2)) : null,
    cagr: cagr !== null ? Number(cagr.toFixed(2)) : null,
  }
}

/**
 * Calculate Pearson correlation matrix between active datasets
 */
export function calculateCorrelationMatrix(
  datasetsWithPoints: { dataset: Dataset; points: DataPoint[] }[]
): { datasets: string[]; matrix: number[][] } {
  const active = datasetsWithPoints.filter((d) => d.dataset.visible && d.points.length > 0)
  const n = active.length
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(1))
  const names = active.map((d) => d.dataset.name)

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ptsA = active[i].points
      const ptsB = active[j].points

      // Find common dates
      const mapB = new Map<string, number>()
      for (const p of ptsB) {
        if (p.value !== null && !isNaN(p.value)) {
          mapB.set(p.date, p.value)
        }
      }

      const pairs: [number, number][] = []
      for (const p of ptsA) {
        if (p.value !== null && !isNaN(p.value) && mapB.has(p.date)) {
          pairs.push([p.value, mapB.get(p.date)!])
        }
      }

      if (pairs.length < 5) {
        matrix[i][j] = NaN
        matrix[j][i] = NaN
        continue
      }

      const meanA = pairs.reduce((acc, p) => acc + p[0], 0) / pairs.length
      const meanB = pairs.reduce((acc, p) => acc + p[1], 0) / pairs.length

      let num = 0
      let denA = 0
      let denB = 0

      for (const [a, b] of pairs) {
        const da = a - meanA
        const db = b - meanB
        num += da * db
        denA += da * da
        denB += db * db
      }

      const r = denA * denB > 0 ? num / Math.sqrt(denA * denB) : 0
      const rounded = Number(r.toFixed(3))
      matrix[i][j] = rounded
      matrix[j][i] = rounded
    }
  }

  return { datasets: names, matrix }
}

/**
 * Seasonality Data Structures
 */
export function extractSeasonalityData(points: DataPoint[]) {
  const valid = points.filter((p) => p.value !== null && !isNaN(p.value!))
  if (valid.length === 0) return null

  // 1. Group by Year (Jan 1 to Dec 31 day of year or MM-DD)
  const yearsMap = new Map<number, { dayOfYear: number; dateStr: string; value: number }[]>()
  
  // 2. Day of Week distribution (0 = Sun .. 6 = Sat)
  const dowValues: number[][] = Array.from({ length: 7 }, () => [])

  // 3. Month of Year (0..11) x Year for Heatmap
  const monthYearMap = new Map<string, number[]>() // key: `${year}-${month}`

  const yearsSet = new Set<number>()

  for (const pt of valid) {
    const d = new Date(pt.timestamp)
    const y = d.getFullYear()
    const m = d.getMonth()
    const dow = d.getDay()
    yearsSet.add(y)

    // Calculate day of year (1-366)
    const startOfYear = new Date(y, 0, 1)
    const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1

    if (!yearsMap.has(y)) {
      yearsMap.set(y, [])
    }
    yearsMap.get(y)!.push({
      dayOfYear,
      dateStr: `${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      value: pt.value!,
    })

    dowValues[dow].push(pt.value!)

    const myKey = `${y}-${m}`
    if (!monthYearMap.has(myKey)) {
      monthYearMap.set(myKey, [])
    }
    monthYearMap.get(myKey)!.push(pt.value!)
  }

  const sortedYears = Array.from(yearsSet).sort()

  // Dow averages
  const dowNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
  const dowStats = dowNames.map((name, idx) => {
    const vals = dowValues[idx]
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const count = vals.length
    return { name, avg: Number(avg.toFixed(2)), count }
  })

  // Heatmap: [monthIndex, yearIndex, averageValue]
  const heatmapData: [number, number, number][] = []
  let heatMin = Infinity
  let heatMax = -Infinity

  sortedYears.forEach((y, yIdx) => {
    for (let m = 0; m < 12; m++) {
      const vals = monthYearMap.get(`${y}-${m}`) || []
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      if (avg !== null) {
        const rounded = Number(avg.toFixed(2))
        heatmapData.push([m, yIdx, rounded])
        if (rounded < heatMin) heatMin = rounded
        if (rounded > heatMax) heatMax = rounded
      }
    }
  })

  return {
    sortedYears,
    yearsMap,
    dowStats,
    heatmapData,
    heatmapYears: sortedYears.map(String),
    heatmapMin: heatMin === Infinity ? 0 : heatMin,
    heatmapMax: heatMax === -Infinity ? 100 : heatMax,
  }
}
