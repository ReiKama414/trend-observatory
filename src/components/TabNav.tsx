import { LineChart, Calendar, Table } from 'lucide-react'
import type { ActiveTab } from '../types'

interface TabNavProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  datasetCount: number
  eventCount: number
}

export const TabNav = ({
  activeTab,
  onTabChange,
  datasetCount,
  eventCount,
}: TabNavProps) => {
  const tabs = [
    {
      id: 'timeline' as ActiveTab,
      label: '趨勢與多軸比較',
      icon: LineChart,
      desc: '多指標時間序列對齊、多 Y 軸與基準正規化',
      badge: datasetCount > 0 ? `${datasetCount} 組` : undefined,
    },
    {
      id: 'seasonality' as ActiveTab,
      label: '季節性檢視',
      icon: Calendar,
      desc: 'MM-DD 逐年疊圖、星期分布與全年月度熱力圖',
    },
    {
      id: 'table' as ActiveTab,
      label: '數據總表',
      icon: Table,
      desc: '逐期採樣明細、數值篩選檢索與 CSV 匯出',
      badge: eventCount > 0 ? `${eventCount} 事件` : undefined,
    },
  ]

  return (
    <nav
      aria-label="工作台視圖導覽"
      className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none shadow-xs transition-colors"
    >
      <div className="max-w-[1720px] mx-auto px-2 sm:px-4 flex items-center overflow-x-auto no-scrollbar gap-1 min-w-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.desc}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2.5 sm:px-3.5 border-b-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold bg-zinc-100/70 dark:bg-zinc-800/60'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold rounded-full border border-zinc-200 dark:border-zinc-700">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
