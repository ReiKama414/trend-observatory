export type MissingDataMethod =
  | 'none'
  | 'forward_fill'
  | 'linear_interpolate'
  | 'zero_fill'

export type TimeGranularity =
  | 'raw'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'

export type AggregationMethod = 'avg' | 'sum' | 'max' | 'min' | 'last'

export type TransformMode =
  | 'raw'
  | 'baseline100'
  | 'mom'
  | 'yoy'
  | 'pct_change'

export type MovingAverageType = 'sma' | 'ema'

export interface MovingAverageConfig {
  enabled: boolean
  type: MovingAverageType
  window: number
  overlay: boolean // whether to show alongside raw series or replace it
}

export interface DataPoint {
  date: string // ISO string or standardized YYYY-MM-DD
  timestamp: number // unix epoch ms for sorting and distance calculations
  value: number | null
  rawRow?: Record<string, any>
}

export interface Dataset {
  id: string
  name: string
  fileName: string
  fileSize: number
  rows: Record<string, any>[]
  headers: string[]
  dateCol: string
  metricCol: string
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  visible: boolean
  yAxisIndex: 0 | 1 // 0 = Primary Left, 1 = Secondary Right
  createdAt: number
}

export interface ProcessedSeries {
  datasetId: string
  datasetName: string
  metricCol?: string
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  yAxisIndex: 0 | 1
  points: DataPoint[]
  maPoints?: DataPoint[]
  baselineDate?: string
}

export type EventCategory =
  | 'milestone'
  | 'policy'
  | 'market'
  | 'campaign'
  | 'incident'
  | 'custom'

export interface EventAnnotation {
  id: string
  date: string // YYYY-MM-DD
  endDate?: string // optional range end YYYY-MM-DD
  label: string
  description?: string
  color: string
  category: EventCategory
  visible: boolean
}

export interface SeriesMetrics {
  datasetId: string
  name: string
  color: string
  count: number
  startDate: string
  endDate: string
  startValue: number | null
  endValue: number | null
  minValue: number | null
  maxValue: number | null
  avgValue: number | null
  stdDev: number | null
  periodGrowthPct: number | null // ((End - Start) / Start) * 100
  cagr: number | null // Compound Annual Growth Rate (%)
}

export type ActiveTab = 'timeline' | 'seasonality' | 'correlation' | 'table'
