import { describe, it, expect } from 'vitest'
import { parseCSVText, guessColumns } from '../utils/csvHelper'

describe('CSV Parsing & Validation', () => {
  it('throws descriptive error on empty string or whitespace', () => {
    expect(() => parseCSVText('')).toThrow('CSV 檔案為空')
    expect(() => parseCSVText('   \n\r  ')).toThrow('CSV 檔案為空')
  })

  it('throws error when file only contains headers with no rows', () => {
    const headerOnly = 'Date,MetricA,MetricB\n'
    expect(() => parseCSVText(headerOnly)).toThrow('CSV 檔案僅包含標題列')
  })

  it('correctly parses valid CSV with numeric metrics and dates', () => {
    const csv = `Date,Close,Volume
2024-01-01,150.5,12000
2024-01-02,152.0,14500
2024-01-03,149.8,11000`

    const parsed = parseCSVText(csv, 'stocks.csv')
    expect(parsed.fileName).toBe('stocks.csv')
    expect(parsed.headers).toEqual(['Date', 'Close', 'Volume'])
    expect(parsed.rows).toHaveLength(3)
    expect(parsed.guessedDateCol).toBe('Date')
    expect(parsed.guessedMetricCol).toBe('Close')
    expect(parsed.validRows).toBe(3)
  })

  it('handles and strips dirty numbers (e.g. currency signs, commas, percentages)', () => {
    const dirtyCSV = `Timestamp,Revenue,ActiveRatio
2024-01-01,"$1,250.50",85.4%
2024-01-02,"$2,100.00",91.2%`

    const parsed = parseCSVText(dirtyCSV)
    expect(parsed.guessedDateCol).toBe('Timestamp')
    expect(parsed.guessedMetricCol).toBe('Revenue')
  })

  it('guesses date column and metric column based on content heuristics', () => {
    const headers = ['id', 'observed_at', 'sales_amount']
    const sample = [
      { id: '1', observed_at: '2024-01-01', sales_amount: '500' },
      { id: '2', observed_at: '2024-01-02', sales_amount: '750' },
    ]

    const { dateCol, metricCol } = guessColumns(headers, sample)
    expect(dateCol).toBe('observed_at')
    expect(metricCol).toBe('sales_amount')
  })
})
