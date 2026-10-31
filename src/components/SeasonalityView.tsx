import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { Calendar, BarChart2, Grid, Layers, Database, HelpCircle } from 'lucide-react'
import type { Dataset, ProcessedSeries } from '../types'
import { extractSeasonalityData } from '../utils/timeSeries'
import { useTheme } from '../context/useTheme'

interface SeasonalityViewProps {
  seriesList: ProcessedSeries[]
  datasets?: Dataset[]
}

type SeasonalitySubTab = 'overlay' | 'dow' | 'heatmap'

export const SeasonalityView = ({ seriesList }: SeasonalityViewProps) => {
  const [subTab, setSubTab] = useState<SeasonalitySubTab>('overlay')
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Default to first active series with data
  const validSeries = useMemo(
    () => seriesList.filter((s) => s.points.length > 0),
    [seriesList]
  )
  const effectiveDatasetId = selectedDatasetId || (validSeries.length > 0 ? validSeries[0].datasetId : '')

  const activeSeries = validSeries.find((s) => s.datasetId === effectiveDatasetId) || validSeries[0]
  const seasonality = useMemo(
    () => (activeSeries ? extractSeasonalityData(activeSeries.points) : null),
    [activeSeries]
  )

  // Subtab descriptions and statistics
  const subTabDetails = {
    overlay: {
      name: '年度同軸疊加',
      desc: '將不同年度之數據對齊至 01-01 至 12-31 單一年軸，跨年度峰谷波動一目了然，便於對照各年度旺季與修正節奏。',
      hint: '橫軸為每年各月各日（MM-DD），每條曲線代表一個獨立公曆年度。',
    },
    dow: {
      name: '星期分佈 (Day-of-Week)',
      desc: '分析一週各天（週日至週六）之平均指標水準，識別工作日與週末效應、結算週期或消費者行為特徵。',
      hint: '縱軸數值為各星期日樣本之算術平均值，柱頂數字為平均值標籤。',
    },
    heatmap: {
      name: '月度熱力矩陣 (Heatmap)',
      desc: '2D 年份 x 月份矩陣色塊圖，以色彩深度直觀反映特定月份之表現強度，迅速洞悉跨年度的淡旺季交替。',
      hint: '色塊越深代表數值越高，滑鼠懸停可檢視具體數值細節。',
    },
  }

  // Summary statistics for seasonality
  const statsSummary = useMemo(() => {
    if (!seasonality || !activeSeries) return null

    const years = seasonality.sortedYears
    const yearRange = years.length > 0 ? `${years[0]} ~ ${years[years.length - 1]} 年 (${years.length} 個年度)` : '-'
    const totalDays = activeSeries.points.length

    // Find best DOW
    let maxDow = '-'
    let maxDowVal = -Infinity
    seasonality.dowStats.forEach((d) => {
      if (d.avg > maxDowVal && d.count > 0) {
        maxDowVal = d.avg
        maxDow = `${d.name} (均值 ${d.avg.toFixed(1)})`
      }
    })

    return {
      yearRange,
      totalDays,
      maxDow,
    }
  }, [seasonality, activeSeries])

  // Re-init chart on theme change
  useEffect(() => {
    if (!chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.dispose()
      chartInstance.current = null
    }

    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
    })
    chartInstance.current = chart

    const resizeObserver = new ResizeObserver(() => {
      chart.resize()
    })
    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.dispose()
      chartInstance.current = null
    }
  }, [isDark])

  useEffect(() => {
    const chart = chartInstance.current
    if (!chart || !seasonality || !activeSeries) return

    const bgColor = isDark ? '#070b14' : '#ffffff'
    const textColor = isDark ? '#94a3b8' : '#475569'
    const headingColor = isDark ? '#f8fafc' : '#0f172a'
    const splitLineColor = isDark ? '#1e293b' : '#f1f5f9'
    const axisLineColor = isDark ? '#334155' : '#cbd5e1'
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'
    const tooltipBorder = isDark ? '#334155' : '#cbd5e1'
    const tooltipText = isDark ? '#f8fafc' : '#0f172a'

    if (subTab === 'overlay') {
      // Yearly Overlay Chart
      const yearColors = [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ec4899',
        '#8b5cf6',
        '#06b6d4',
        '#f97316',
      ]

      const echartsSeries: any[] = seasonality.sortedYears.map((year, idx) => {
        const yearPoints = seasonality.yearsMap.get(year) || []
        const data = yearPoints.map((p) => [p.dateStr, p.value])

        return {
          name: `${year} 年`,
          type: 'line',
          data,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 2.2,
            color: yearColors[idx % yearColors.length],
          },
          itemStyle: {
            color: yearColors[idx % yearColors.length],
          },
        }
      })

      const option: echarts.EChartsOption = {
        backgroundColor: bgColor,
        title: {
          show: false, // Title handled in Document Flow HTML Header for zero overlap
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          textStyle: { color: tooltipText, fontSize: 12 },
        },
        legend: {
          type: 'plain',
          top: 8,
          left: 20,
          right: 20,
          itemWidth: 16,
          itemHeight: 12,
          itemGap: 16,
          textStyle: { color: textColor, fontSize: 11, lineHeight: 15 },
        },
        grid: {
          left: '2%',
          right: '2%',
          bottom: 30,
          top: 60,
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          axisLabel: {
            color: textColor,
            fontSize: 11,
            formatter: (val: string) => {
              return val.endsWith('-01') || val.endsWith('-15') ? val : ''
            },
          },
          axisLine: { lineStyle: { color: axisLineColor } },
          splitLine: { show: true, lineStyle: { color: splitLineColor } },
        },
        yAxis: {
          type: 'value',
          scale: true,
          splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
          axisLabel: {
            color: textColor,
            fontSize: 11,
            formatter: (val: number) => {
              if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`
              if (Math.abs(val) >= 10000) return `${(val / 1e3).toFixed(0)}k`
              return val.toLocaleString()
            },
          },
        },
        series: echartsSeries,
      }

      chart.setOption(option, true)
    } else if (subTab === 'dow') {
      // Day of Week Distribution Bar Chart
      const option: echarts.EChartsOption = {
        backgroundColor: bgColor,
        title: {
          show: false,
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          textStyle: { color: tooltipText, fontSize: 12 },
          formatter: (params: any) => {
            const stat = seasonality.dowStats[params.dataIndex]
            return `<div style="padding: 4px 6px;">
              <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">${stat.name}</div>
              <div>平均值: <span style="font-weight:bold;">${stat.avg.toLocaleString()}</span></div>
              <div style="color:${textColor}; font-size:11px;">樣本數: ${stat.count} 日</div>
            </div>`
          },
        },
        grid: {
          left: '2%',
          right: '2%',
          bottom: 25,
          top: 30,
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: seasonality.dowStats.map((d) => d.name),
          axisLabel: { color: headingColor, fontSize: 12, fontWeight: 'bold' },
          axisLine: { lineStyle: { color: axisLineColor } },
        },
        yAxis: {
          type: 'value',
          scale: true,
          splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
          axisLabel: { color: textColor, fontSize: 11 },
        },
        series: [
          {
            type: 'bar',
            data: seasonality.dowStats.map((d) => d.avg),
            barWidth: '40%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#1d4ed8' },
              ]),
            },
            label: {
              show: true,
              position: 'top',
              color: textColor,
              fontSize: 11,
              formatter: (val: any) => Number(val.value).toLocaleString(),
            },
          },
        ],
      }

      chart.setOption(option, true)
    } else if (subTab === 'heatmap') {
      // Month x Year Heatmap
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

      const option: echarts.EChartsOption = {
        backgroundColor: bgColor,
        title: {
          show: false,
        },
        tooltip: {
          position: 'top',
          backgroundColor: tooltipBg,
          borderColor: tooltipBorder,
          textStyle: { color: tooltipText, fontSize: 12 },
          formatter: (params: any) => {
            const monthName = months[params.value[0]]
            const yearName = seasonality.heatmapYears[params.value[1]]
            const val = params.value[2]
            return `<div style="padding: 4px;">
              <span style="color:${textColor}">${yearName} 年 ${monthName}:</span>
              <span style="font-weight:bold; margin-left:6px; color:#3b82f6;">${val.toLocaleString()}</span>
            </div>`
          },
        },
        grid: {
          top: 30,
          bottom: 25,
          left: '5%',
          right: '4%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: months,
          splitArea: { show: true },
          axisLabel: { color: headingColor, fontSize: 11 },
          axisLine: { lineStyle: { color: axisLineColor } },
        },
        yAxis: {
          type: 'category',
          data: seasonality.heatmapYears.map((y) => `${y} 年`),
          splitArea: { show: true },
          axisLabel: { color: headingColor, fontSize: 11 },
          axisLine: { lineStyle: { color: axisLineColor } },
        },
        visualMap: {
          min: seasonality.heatmapMin,
          max: seasonality.heatmapMax,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          inRange: {
            color: isDark
              ? ['#0f172a', '#1e3a8a', '#2563eb', '#60a5fa', '#93c5fd']
              : ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1e40af'],
          },
          textStyle: {
            color: textColor,
            fontSize: 10,
          },
        },
        series: [
          {
            type: 'heatmap',
            data: seasonality.heatmapData,
            label: {
              show: true,
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: 10,
              formatter: (params: any) => {
                const val = params.value[2]
                if (val >= 1e4) return `${(val / 1e3).toFixed(0)}k`
                return `${val}`
              },
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      }

      chart.setOption(option, true)
    }
  }, [subTab, activeSeries, seasonality, isDark])

  if (!activeSeries || !seasonality) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
        <Calendar className="w-8 h-8 mb-2 opacity-50 text-zinc-500" />
        <p className="text-xs">尚無足夠時間序列資料以生成季節性分析</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-5 shadow-xs flex flex-col space-y-3 transition-colors min-w-0">
      {/* 1. Header: Title, Subtabs & Dataset Selector */}
      <div
        data-testid="seasonality-card-header"
        className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <Calendar className="w-4 h-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
          <h2
            data-testid="seasonality-header-title"
            className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate"
          >
            {activeSeries.datasetName} - 季節性分析
          </h2>
        </div>

        {/* Subtabs and indicator dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setSubTab('overlay')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                subTab === 'overlay'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>年度同軸疊加</span>
            </button>
            <button
              onClick={() => setSubTab('dow')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                subTab === 'dow'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>星期分佈</span>
            </button>
            <button
              onClick={() => setSubTab('heatmap')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                subTab === 'heatmap'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>月度熱力圖</span>
            </button>
          </div>

          {validSeries.length > 1 && (
            <div className="flex items-center space-x-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">指標:</span>
              <select
                value={effectiveDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none"
              >
                {validSeries.map((s) => (
                  <option key={s.datasetId} value={s.datasetId} className="bg-white dark:bg-zinc-900">
                    {s.datasetName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Description: Document flow description */}
      <div
        data-testid="seasonality-card-description"
        className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed"
      >
        <p>{subTabDetails[subTab].desc}</p>
      </div>

      {/* 3. Statistics: Summary Bar */}
      {statsSummary && (
        <div
          data-testid="seasonality-card-statistics"
          className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-2.5 bg-zinc-50 dark:bg-zinc-950/70 rounded-lg border border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-700 dark:text-zinc-300"
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">涵蓋年度:</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
              {statsSummary.yearRange}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 min-w-0">
            <Database className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400">樣本總天數:</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
              {statsSummary.totalDays.toLocaleString()} 日
            </span>
          </div>

          <div className="flex items-center space-x-1.5 min-w-0">
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400">週內最高均值:</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {statsSummary.maxDow}
            </span>
          </div>
        </div>
      )}

      {/* 4. Chart: Dedicated Drawing Area */}
      <div
        data-testid="seasonality-card-canvas-container"
        className="relative w-full h-[380px] xs:h-[420px] sm:h-[480px] md:h-[520px] min-w-0 overflow-hidden"
      >
        <div ref={chartRef} className="w-full h-full rounded-md" />
      </div>

      {/* 5. Legend / Footer */}
      <div
        data-testid="seasonality-card-footer"
        className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400"
      >
        <div className="flex items-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <span>{subTabDetails[subTab].hint}</span>
        </div>
        <div className="text-[10px] text-zinc-400">
          資料來源：{activeSeries.datasetName} {activeSeries.metricCol ? `(${activeSeries.metricCol})` : ''}
        </div>
      </div>
    </div>
  )
}
