import type { Dataset, EventAnnotation } from '../types'

/**
 * Deterministic pseudo-random number generator for reproducible realistic time-series
 */
function createSeededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/**
 * Generate Semiconductor & Tech Benchmark (2022-01-03 through 2026-10-23)
 */
function generateSemiTechData(): Record<string, any>[] {
  const rand = createSeededRandom(42)
  const rows: Record<string, any>[] = []

  let sox = 3950
  let nvda = 29.5 // Split-adjusted approx early 2022
  let tsmc = 120.0

  const curr = new Date(2022, 0, 3)
  const endDate = new Date(2026, 9, 23) // Late October 2026

  while (curr <= endDate) {
    const dow = curr.getDay()
    // Skip weekends (trading days only)
    if (dow !== 0 && dow !== 6) {
      const year = curr.getFullYear()
      const month = curr.getMonth() // 0-11
      const is2022 = year === 2022
      const is2023 = year === 2023
      const is2024 = year === 2024
      const is2025 = year === 2025

      // 2022 bear market, 2023 AI boom starts, 2024 acceleration, 2025-2026 mature enterprise AI scaling
      const driftSOX = is2022 ? -0.0012 : is2023 ? 0.0022 : is2024 ? 0.0018 : is2025 ? 0.0011 : 0.0009
      const driftNVDA = is2022 ? -0.0020 : is2023 ? 0.0065 : is2024 ? 0.0048 : is2025 ? 0.0026 : 0.0018
      const driftTSMC = is2022 ? -0.0015 : is2023 ? 0.0025 : is2024 ? 0.0035 : is2025 ? 0.0021 : 0.0016

      // Volatility shock
      const shockSOX = (rand() - 0.49) * 0.038
      const shockNVDA = (rand() - 0.48) * 0.065
      const shockTSMC = (rand() - 0.49) * 0.042

      sox = Math.max(2000, sox * (1 + driftSOX + shockSOX))
      nvda = Math.max(10, nvda * (1 + driftNVDA + shockNVDA))
      tsmc = Math.max(55, tsmc * (1 + driftTSMC + shockTSMC))

      const y = curr.getFullYear()
      const m = String(month + 1).padStart(2, '0')
      const d = String(curr.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`

      rows.push({
        Date: dateStr,
        SOX_Index: Number(sox.toFixed(1)),
        NVDA_Adj_Close: Number(nvda.toFixed(2)),
        TSMC_ADR: Number(tsmc.toFixed(2)),
        Trading_Volume_M: Number((45 + rand() * 80).toFixed(1)),
      })
    }
    curr.setDate(curr.getDate() + 1)
  }

  return rows
}

/**
 * Generate E-Commerce Daily Operations (2023-01-01 through 2026-10-25)
 */
function generateEcommerceData(): Record<string, any>[] {
  const rand = createSeededRandom(108)
  const rows: Record<string, any>[] = []

  const curr = new Date(2023, 0, 1)
  const endDate = new Date(2026, 9, 25) // Late October 2026

  let baseOrders = 12500

  while (curr <= endDate) {
    const dow = curr.getDay() // 0 Sun, 6 Sat
    const month = curr.getMonth() // 0-11
    const day = curr.getDate()

    // Gradual year-over-year organic business growth
    baseOrders += 3.8

    // Day of week seasonality: Tue/Wed peak, Sat lowest
    const dowFactor = [0.88, 1.05, 1.15, 1.18, 1.12, 1.02, 0.82][dow]

    // Seasonal monthly factor: Nov/Dec holiday shopping surge, Feb quiet
    let seasonalFactor = 1.0
    if (month === 1) seasonalFactor = 0.85 // Feb quiet
    if (month === 5 && day >= 12 && day <= 18) seasonalFactor = 1.65 // 618 Shopping festival
    else if (month === 5) seasonalFactor = 1.15
    if (month === 10 && day >= 8 && day <= 14) seasonalFactor = 2.4 // Double 11
    else if (month === 10 && day >= 24 && day <= 29) seasonalFactor = 2.1 // Black Friday
    else if (month === 11) seasonalFactor = 1.45 // December Christmas

    const noise = (rand() - 0.48) * 0.12
    const orders = Math.round(baseOrders * dowFactor * seasonalFactor * (1 + noise))

    // Average Order Value (AOV)
    const baseAOV = 78.5 + (curr.getFullYear() - 2023) * 6.5
    const aov = Number((baseAOV + (rand() - 0.5) * 8.5).toFixed(2))

    // GMV
    const gmv = Math.round(orders * aov)

    // Active Users
    const activeUsers = Math.round(orders * (3.8 + (rand() - 0.5) * 0.6))

    const y = curr.getFullYear()
    const m = String(month + 1).padStart(2, '0')
    const d = String(curr.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    rows.push({
      Date: dateStr,
      Orders: orders,
      GMV_USD: gmv,
      AOV: aov,
      Active_Users: activeUsers,
    })

    curr.setDate(curr.getDate() + 1)
  }

  return rows
}

/**
 * Generate Renewable Energy Output & Demand (2023-01-01 through 2026-10-25)
 */
function generateEnergyData(): Record<string, any>[] {
  const rand = createSeededRandom(777)
  const rows: Record<string, any>[] = []

  const curr = new Date(2023, 0, 1)
  const endDate = new Date(2026, 9, 25) // Late October 2026

  while (curr <= endDate) {
    const month = curr.getMonth() // 0 Jan .. 11 Dec
    const dayOfYear = Math.floor((curr.getTime() - new Date(curr.getFullYear(), 0, 1).getTime()) / 86400000)

    // Progression ratio across 2023-2026 horizon
    const progress = (curr.getTime() - new Date(2023, 0, 1).getTime()) / (365 * 86400000)
    // Capacity expansion: Solar +16% per year, Wind +12% per year, Demand +4% per year
    const solarGrowth = 1 + progress * 0.16
    const windGrowth = 1 + progress * 0.12
    const demandGrowth = 1 + progress * 0.04

    // Solar peak in Summer (June/July ~ month 5,6)
    const solarSeasonal = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI) // Peak at mid-year
    const solarBase = (17500 + solarSeasonal * 8500) * solarGrowth
    const solar = Math.max(4000, Math.round(solarBase + (rand() - 0.5) * 4500))

    // Wind peak in Autumn / Winter (opposite phase)
    const windSeasonal = -Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI)
    const windBase = (13500 + windSeasonal * 7000) * windGrowth
    const wind = Math.max(3000, Math.round(windBase + (rand() - 0.5) * 5500))

    // Total Demand: high in summer (air conditioning) and winter (heating)
    const demandCurve = (42000 + Math.abs(solarSeasonal) * 11000 + (rand() - 0.5) * 3500) * demandGrowth
    const totalDemand = Math.round(demandCurve)

    const y = curr.getFullYear()
    const m = String(month + 1).padStart(2, '0')
    const d = String(curr.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    rows.push({
      Date: dateStr,
      Solar_MWh: solar,
      Wind_MWh: wind,
      Total_Demand_MWh: totalDemand,
      Renewable_Ratio_Pct: Number((((solar + wind) / totalDemand) * 100).toFixed(1)),
    })

    curr.setDate(curr.getDate() + 1)
  }

  return rows
}

/**
 * Built-in Preset Datasets
 */
export function getSampleDatasets(): { datasets: Dataset[]; events: EventAnnotation[] } {
  const semiTechRows = generateSemiTechData()

  const datasets: Dataset[] = [
    {
      id: 'ds-semi-sox',
      name: '費城半導體 (SOX)',
      fileName: 'semi_tech_benchmark_2022_2026.csv',
      fileSize: 76500,
      rows: semiTechRows,
      headers: ['Date', 'SOX_Index', 'NVDA_Adj_Close', 'TSMC_ADR', 'Trading_Volume_M'],
      dateCol: 'Date',
      metricCol: 'SOX_Index',
      color: '#3b82f6', // blue
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 0,
      createdAt: Date.now() - 3000,
    },
    {
      id: 'ds-semi-nvda',
      name: 'NVIDIA 股價 (USD)',
      fileName: 'semi_tech_benchmark_2022_2026.csv',
      fileSize: 76500,
      rows: semiTechRows,
      headers: ['Date', 'SOX_Index', 'NVDA_Adj_Close', 'TSMC_ADR', 'Trading_Volume_M'],
      dateCol: 'Date',
      metricCol: 'NVDA_Adj_Close',
      color: '#10b981', // emerald
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 1, // Secondary axis for high contrast unit differences
      createdAt: Date.now() - 2000,
    },
    {
      id: 'ds-semi-tsmc',
      name: '台積電 ADR (USD)',
      fileName: 'semi_tech_benchmark_2022_2026.csv',
      fileSize: 76500,
      rows: semiTechRows,
      headers: ['Date', 'SOX_Index', 'NVDA_Adj_Close', 'TSMC_ADR', 'Trading_Volume_M'],
      dateCol: 'Date',
      metricCol: 'TSMC_ADR',
      color: '#f59e0b', // amber
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 1,
      createdAt: Date.now() - 1000,
    },
  ]

  const events: EventAnnotation[] = [
    {
      id: 'evt-1',
      date: '2022-11-30',
      label: 'ChatGPT 3.5 正式發布',
      description: '生成式 AI 浪潮爆發，帶動全球高階運算晶片與加速硬體需求暴增。',
      color: '#8b5cf6',
      category: 'milestone',
      visible: true,
    },
    {
      id: 'evt-2',
      date: '2023-05-24',
      label: 'NVIDIA FY24Q1 歷史級財測',
      description: 'NVIDIA 單季營收指引大幅超越華爾街預期 50%，開啟晶片股大牛市。',
      color: '#10b981',
      category: 'market',
      visible: true,
    },
    {
      id: 'evt-3',
      date: '2023-07-26',
      label: '聯準會最後一次升息',
      description: 'Fed 將聯邦基金利率提升至 5.25%-5.50%，結束本輪激進緊縮週期。',
      color: '#ef4444',
      category: 'policy',
      visible: true,
    },
    {
      id: 'evt-4',
      date: '2024-03-18',
      label: 'GTC 2024 發表 Blackwell 架構',
      description: '發表 B200 GPU 與 GB200 超級晶片，能效與訓練推論速度倍增。',
      color: '#06b6d4',
      category: 'milestone',
      visible: true,
    },
    {
      id: 'evt-5',
      date: '2024-09-18',
      label: '美聯準會啟動降息循環 (-50bps)',
      description: 'FOMC 宣布降息 2 碼至 4.75%-5.00%，啟動全球寬鬆週期。',
      color: '#ef4444',
      category: 'policy',
      visible: true,
    },
    {
      id: 'evt-6',
      date: '2025-03-18',
      label: 'GTC 2025 發表 Rubin 次世代架構',
      description: 'NVIDIA 預覽 Rubin 晶片與 3nm 製程，記憶體升級至 HBM4。',
      color: '#8b5cf6',
      category: 'milestone',
      visible: true,
    },
    {
      id: 'evt-7',
      date: '2025-09-25',
      label: '台積電 N2 (2nm) 晶片正式試產',
      description: 'GAA 奈米片架構良率顯著突破，各大晶片巨頭爭相包攬產能。',
      color: '#f59e0b',
      category: 'market',
      visible: true,
    },
    {
      id: 'evt-8',
      date: '2026-06-03',
      label: 'COMPUTEX 2026 次世代 AI 終端爆發',
      description: '百款新世代 AI PC、自主機器人與工業邊緣運算旗艦全面亮相。',
      color: '#06b6d4',
      category: 'milestone',
      visible: true,
    },
  ]

  return { datasets, events }
}

export function getEcommercePreset(): { datasets: Dataset[]; events: EventAnnotation[] } {
  const ecomRows = generateEcommerceData()

  const datasets: Dataset[] = [
    {
      id: 'ds-ecom-orders',
      name: '電商每日訂單 (Orders)',
      fileName: 'ecommerce_daily_2023_2026.csv',
      fileSize: 84200,
      rows: ecomRows,
      headers: ['Date', 'Orders', 'GMV_USD', 'AOV', 'Active_Users'],
      dateCol: 'Date',
      metricCol: 'Orders',
      color: '#6366f1', // indigo
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 0,
      createdAt: Date.now() - 2000,
    },
    {
      id: 'ds-ecom-gmv',
      name: '交易總額 (GMV USD)',
      fileName: 'ecommerce_daily_2023_2026.csv',
      fileSize: 84200,
      rows: ecomRows,
      headers: ['Date', 'Orders', 'GMV_USD', 'AOV', 'Active_Users'],
      dateCol: 'Date',
      metricCol: 'GMV_USD',
      color: '#ec4899', // pink
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 1,
      createdAt: Date.now() - 1000,
    },
  ]

  const events: EventAnnotation[] = [
    {
      id: 'evt-ecom-1',
      date: '2023-06-18',
      label: '2023 618 年中購物節',
      description: '全站免運補貼與滿額折抵，訂單量顯著提升。',
      color: '#f97316',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-2',
      date: '2023-11-11',
      label: '2023 雙 11 狂歡大促',
      description: '年度最大流量峰值，單日訂單量超過常規均值 2.4 倍。',
      color: '#ef4444',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-3',
      date: '2023-11-24',
      label: '2023 黑色星期五 Black Friday',
      description: '歐美跨國買氣激增，客單價 (AOV) 顯著提高。',
      color: '#8b5cf6',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-4',
      date: '2024-06-18',
      label: '2024 618 促銷節',
      description: '平台擴大商家回饋券，直播電商成交額大增。',
      color: '#f97316',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-5',
      date: '2024-11-11',
      label: '2024 雙 11 大促再破紀錄',
      description: '多項熱門品類爆款售罄，單日 GMV 再創新高。',
      color: '#ef4444',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-6',
      date: '2025-06-18',
      label: '2025 618 AI 智慧選品節',
      description: 'AI 智慧助理導購與推薦轉化率飆升，客單價增長 15%。',
      color: '#f97316',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-7',
      date: '2025-11-11',
      label: '2025 雙 11 全球跨境消費高峰',
      description: '全球跨國物流 72 小時達，海外訂單規模佔比突破 35%。',
      color: '#ef4444',
      category: 'campaign',
      visible: true,
    },
    {
      id: 'evt-ecom-8',
      date: '2026-06-18',
      label: '2026 618 年中促銷盛典',
      description: '夏季檔期全面打響，多通路整合交易額刷新歷史。',
      color: '#f97316',
      category: 'campaign',
      visible: true,
    },
  ]

  return { datasets, events }
}

export function getEnergyPreset(): { datasets: Dataset[]; events: EventAnnotation[] } {
  const energyRows = generateEnergyData()

  const datasets: Dataset[] = [
    {
      id: 'ds-energy-solar',
      name: '太陽能光電 (Solar)',
      fileName: 'renewable_energy_2023_2026.csv',
      fileSize: 79800,
      rows: energyRows,
      headers: ['Date', 'Solar_MWh', 'Wind_MWh', 'Total_Demand_MWh', 'Renewable_Ratio_Pct'],
      dateCol: 'Date',
      metricCol: 'Solar_MWh',
      color: '#f59e0b', // amber
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 0,
      createdAt: Date.now() - 3000,
    },
    {
      id: 'ds-energy-wind',
      name: '風力發電 (Wind)',
      fileName: 'renewable_energy_2023_2026.csv',
      fileSize: 79800,
      rows: energyRows,
      headers: ['Date', 'Solar_MWh', 'Wind_MWh', 'Total_Demand_MWh', 'Renewable_Ratio_Pct'],
      dateCol: 'Date',
      metricCol: 'Wind_MWh',
      color: '#06b6d4', // cyan
      lineStyle: 'solid',
      visible: true,
      yAxisIndex: 0,
      createdAt: Date.now() - 2000,
    },
    {
      id: 'ds-energy-demand',
      name: '電網總負載 (Demand)',
      fileName: 'renewable_energy_2023_2026.csv',
      fileSize: 79800,
      rows: energyRows,
      headers: ['Date', 'Solar_MWh', 'Wind_MWh', 'Total_Demand_MWh', 'Renewable_Ratio_Pct'],
      dateCol: 'Date',
      metricCol: 'Total_Demand_MWh',
      color: '#64748b', // slate
      lineStyle: 'dashed',
      visible: true,
      yAxisIndex: 1,
      createdAt: Date.now() - 1000,
    },
  ]

  const events: EventAnnotation[] = [
    {
      id: 'evt-energy-1',
      date: '2023-07-15',
      endDate: '2023-07-25',
      label: '2023 夏季極端熱浪',
      description: '全台與周邊地區連續高溫，冷氣空調負載飆上年度峰值。',
      color: '#ef4444',
      category: 'incident',
      visible: true,
    },
    {
      id: 'evt-energy-2',
      date: '2023-10-05',
      label: '強烈東北季風首波報到',
      description: '沿海風場滿載發電，風電單日發電佔比突破 25%。',
      color: '#06b6d4',
      category: 'market',
      visible: true,
    },
    {
      id: 'evt-energy-3',
      date: '2024-07-20',
      endDate: '2024-07-30',
      label: '2024 夏季高溫負載',
      description: '空調電力消耗打破歷年夏季紀錄，太陽能光電扮演日間尖峰供電要角。',
      color: '#ef4444',
      category: 'incident',
      visible: true,
    },
    {
      id: 'evt-energy-4',
      date: '2024-10-22',
      label: '大型離岸風場二期併網',
      description: '新增 500MW 離岸風力併網，冬季綠能發電基載顯著擴大。',
      color: '#10b981',
      category: 'milestone',
      visible: true,
    },
    {
      id: 'evt-energy-5',
      date: '2025-07-12',
      endDate: '2025-07-22',
      label: '2025 極端熱浪負載',
      description: '極端氣候持續推升盛夏用電，儲能輔助服務發揮即時調頻效益。',
      color: '#ef4444',
      category: 'incident',
      visible: true,
    },
    {
      id: 'evt-energy-6',
      date: '2026-04-22',
      label: '2026 地球日綠能滲透 36%',
      description: '春季風光雙發瞬時出力創下單日新紀錄，佔總供電超過三分之一。',
      color: '#10b981',
      category: 'milestone',
      visible: true,
    },
    {
      id: 'evt-energy-7',
      date: '2026-07-18',
      endDate: '2026-07-28',
      label: '2026 盛夏高溫新高',
      description: '全區高溫警報連發，智慧電網調度與分散式光電發揮關鍵支撐。',
      color: '#ef4444',
      category: 'incident',
      visible: true,
    },
  ]

  return { datasets, events }
}
