import { describe, it, expect } from 'vitest'
import {
  parseToDate,
  formatDateISO,
  resampleData,
  fillMissingDates,
  calculateBaseline100,
  calculateGrowthRates,
  calculateMovingAverage,
  calculateSeriesMetrics,
  calculateCorrelationMatrix,
  extractSeasonalityData,
} from '../utils/timeSeries'
import type { DataPoint, Dataset } from '../types'

describe('Time Series Core Calculations', () => {
  describe('parseToDate', () => {
    it('parses standard ISO date string', () => {
      const d = parseToDate('2024-05-18')
      expect(d).not.toBeNull()
      expect(d?.getFullYear()).toBe(2024)
      expect(d?.getMonth()).toBe(4) // 0-indexed May
      expect(d?.getDate()).toBe(18)
      expect(formatDateISO(d!)).toBe('2024-05-18')
    })

    it('parses slash date string YYYY/MM/DD', () => {
      const d = parseToDate('2023/12/25')
      expect(d).not.toBeNull()
      expect(d?.getFullYear()).toBe(2023)
      expect(d?.getMonth()).toBe(11) // December
      expect(d?.getDate()).toBe(25)
    })

    it('parses 8-digit number string YYYYMMDD', () => {
      const d = parseToDate('20240315')
      expect(d).not.toBeNull()
      expect(d?.getFullYear()).toBe(2024)
      expect(d?.getMonth()).toBe(2)
      expect(d?.getDate()).toBe(15)
    })

    it('parses unix timestamp (seconds and milliseconds)', () => {
      const ms = 1704067200000 // 2024-01-01 00:00:00 UTC
      const dMs = parseToDate(ms)
      expect(dMs).not.toBeNull()

      const s = 1704067200 // in seconds
      const dS = parseToDate(s)
      expect(dS).not.toBeNull()
    })

    it('returns null for invalid or empty inputs', () => {
      expect(parseToDate('')).toBeNull()
      expect(parseToDate(null)).toBeNull()
      expect(parseToDate(undefined)).toBeNull()
      expect(parseToDate('not-a-date')).toBeNull()
    })
  })

  describe('resampleData', () => {
    const rawDailyPoints: DataPoint[] = [
      { date: '2024-01-01', timestamp: new Date(2024, 0, 1).getTime(), value: 10 },
      { date: '2024-01-02', timestamp: new Date(2024, 0, 2).getTime(), value: 20 },
      { date: '2024-01-03', timestamp: new Date(2024, 0, 3).getTime(), value: 30 },
      { date: '2024-02-01', timestamp: new Date(2024, 1, 1).getTime(), value: 50 },
      { date: '2024-02-02', timestamp: new Date(2024, 1, 2).getTime(), value: 70 },
    ]

    it('resamples daily points to monthly average', () => {
      const monthly = resampleData(rawDailyPoints, 'monthly', 'avg')
      expect(monthly).toHaveLength(2)
      expect(monthly[0].date).toBe('2024-01-01')
      expect(monthly[0].value).toBe(20) // (10+20+30)/3
      expect(monthly[1].date).toBe('2024-02-01')
      expect(monthly[1].value).toBe(60) // (50+70)/2
    })

    it('resamples daily points to monthly sum', () => {
      const monthly = resampleData(rawDailyPoints, 'monthly', 'sum')
      expect(monthly).toHaveLength(2)
      expect(monthly[0].value).toBe(60)
      expect(monthly[1].value).toBe(120)
    })

    it('resamples daily points to monthly max and min', () => {
      const maxMonthly = resampleData(rawDailyPoints, 'monthly', 'max')
      expect(maxMonthly[0].value).toBe(30)
      const minMonthly = resampleData(rawDailyPoints, 'monthly', 'min')
      expect(minMonthly[0].value).toBe(10)
    })
  })

  describe('fillMissingDates', () => {
    const gappedPoints: DataPoint[] = [
      { date: '2024-01-01', timestamp: new Date(2024, 0, 1).getTime(), value: 100 },
      // 2024-01-02, 2024-01-03 missing
      { date: '2024-01-04', timestamp: new Date(2024, 0, 4).getTime(), value: 400 },
    ]

    it('leaves gaps untouched when method is none', () => {
      const res = fillMissingDates(gappedPoints, 'none', 'daily')
      expect(res).toHaveLength(2)
    })

    it('forward fills (LOCF) missing calendar days', () => {
      const res = fillMissingDates(gappedPoints, 'forward_fill', 'daily')
      expect(res).toHaveLength(4)
      expect(res[0].value).toBe(100)
      expect(res[1].date).toBe('2024-01-02')
      expect(res[1].value).toBe(100)
      expect(res[2].date).toBe('2024-01-03')
      expect(res[2].value).toBe(100)
      expect(res[3].date).toBe('2024-01-04')
      expect(res[3].value).toBe(400)
    })

    it('linearly interpolates missing calendar days', () => {
      const res = fillMissingDates(gappedPoints, 'linear_interpolate', 'daily')
      expect(res).toHaveLength(4)
      expect(res[0].value).toBe(100)
      expect(res[1].value).toBe(200) // (400-100)/3 * 1 + 100
      expect(res[2].value).toBe(300) // (400-100)/3 * 2 + 100
      expect(res[3].value).toBe(400)
    })

    it('zero fills missing calendar days', () => {
      const res = fillMissingDates(gappedPoints, 'zero_fill', 'daily')
      expect(res).toHaveLength(4)
      expect(res[1].value).toBe(0)
      expect(res[2].value).toBe(0)
    })
  })

  describe('calculateBaseline100', () => {
    it('normalizes points so base date value equals 100', () => {
      const points: DataPoint[] = [
        { date: '2024-01-01', timestamp: 1, value: 50 },
        { date: '2024-01-02', timestamp: 2, value: 75 },
        { date: '2024-01-03', timestamp: 3, value: 100 },
      ]
      const rebased = calculateBaseline100(points)
      expect(rebased[0].value).toBe(100)
      expect(rebased[1].value).toBe(150)
      expect(rebased[2].value).toBe(200)
    })
  })

  describe('calculateMovingAverage', () => {
    const points: DataPoint[] = [
      { date: '2024-01-01', timestamp: 1, value: 10 },
      { date: '2024-01-02', timestamp: 2, value: 20 },
      { date: '2024-01-03', timestamp: 3, value: 30 },
      { date: '2024-01-04', timestamp: 4, value: 40 },
    ]

    it('calculates SMA with window 3', () => {
      const sma = calculateMovingAverage(points, {
        enabled: true,
        type: 'sma',
        window: 3,
        overlay: true,
      })
      expect(sma[0].value).toBeNull()
      expect(sma[1].value).toBeNull()
      expect(sma[2].value).toBe(20) // (10+20+30)/3
      expect(sma[3].value).toBe(30) // (20+30+40)/3
    })
  })

  describe('calculateGrowthRates', () => {
    it('calculates period-to-period pct change', () => {
      const points: DataPoint[] = [
        { date: '2024-01-01', timestamp: 1, value: 100 },
        { date: '2024-01-02', timestamp: 2, value: 120 },
        { date: '2024-01-03', timestamp: 3, value: 90 },
      ]
      const pct = calculateGrowthRates(points, 'pct_change', 'daily')
      expect(pct[0].value).toBeNull()
      expect(pct[1].value).toBe(20) // (120-100)/100 * 100
      expect(pct[2].value).toBe(-25) // (90-120)/120 * 100
    })
  })

  describe('calculateSeriesMetrics', () => {
    const mockDataset: Dataset = {
      id: 'd1',
      name: 'Test',
      fileName: 'test.csv',
      fileSize: 100,
      rows: [],
      headers: ['date', 'val'],
      dateCol: 'date',
      metricCol: 'val',
      color: '#3b82f6',
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 0,
      createdAt: 1000,
    }

    it('correctly calculates period growth and basic statistics', () => {
      const points: DataPoint[] = [
        { date: '2024-01-01', timestamp: new Date(2024, 0, 1).getTime(), value: 100 },
        { date: '2024-06-01', timestamp: new Date(2024, 5, 1).getTime(), value: 200 },
        { date: '2024-12-31', timestamp: new Date(2024, 11, 31).getTime(), value: 150 },
      ]

      const metrics = calculateSeriesMetrics(mockDataset, points)
      expect(metrics.count).toBe(3)
      expect(metrics.startValue).toBe(100)
      expect(metrics.endValue).toBe(150)
      expect(metrics.periodGrowthPct).toBe(50) // (150-100)/100 * 100
      expect(metrics.minValue).toBe(100)
      expect(metrics.maxValue).toBe(200)
      expect(metrics.avgValue).toBe(150)
      expect(metrics.cagr).not.toBeNull()
    })
  })

  describe('calculateCorrelationMatrix', () => {
    const mockDatasetA: Dataset = {
      id: 'a',
      name: 'Series A',
      fileName: 'a.csv',
      fileSize: 100,
      rows: [],
      headers: ['date', 'v'],
      dateCol: 'date',
      metricCol: 'v',
      color: '#3b82f6',
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 0,
      createdAt: 1000,
    }
    const mockDatasetB: Dataset = {
      ...mockDatasetA,
      id: 'b',
      name: 'Series B',
    }

    it('computes 1.0 for identical series and negative correlation for inverted series', () => {
      const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06']
      const ptsA = dates.map((d, i) => ({ date: d, timestamp: i, value: (i + 1) * 10 }))
      const ptsB = dates.map((d, i) => ({ date: d, timestamp: i, value: -(i + 1) * 10 }))

      const result = calculateCorrelationMatrix([
        { dataset: mockDatasetA, points: ptsA },
        { dataset: mockDatasetB, points: ptsB },
      ])

      expect(result.matrix[0][0]).toBe(1)
      expect(result.matrix[1][1]).toBe(1)
      expect(result.matrix[0][1]).toBe(-1)
      expect(result.matrix[1][0]).toBe(-1)
    })
  })

  describe('extractSeasonalityData', () => {
    it('creates yearly overlay map and 7 day-of-week entries', () => {
      const points: DataPoint[] = [
        { date: '2023-01-01', timestamp: new Date(2023, 0, 1).getTime(), value: 50 },
        { date: '2023-06-01', timestamp: new Date(2023, 5, 1).getTime(), value: 80 },
        { date: '2024-01-01', timestamp: new Date(2024, 0, 1).getTime(), value: 65 },
        { date: '2024-06-01', timestamp: new Date(2024, 5, 1).getTime(), value: 95 },
      ]

      const seasonality = extractSeasonalityData(points)
      expect(seasonality).not.toBeNull()
      expect(seasonality?.sortedYears).toEqual([2023, 2024])
      expect(seasonality?.dowStats).toHaveLength(7) // Sun to Sat
    })
  })
})
