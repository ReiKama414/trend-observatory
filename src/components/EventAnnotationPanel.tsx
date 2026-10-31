import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  BookmarkPlus,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Plus,
  X,
} from 'lucide-react'
import type { EventAnnotation, EventCategory } from '../types'

interface EventAnnotationPanelProps {
  events: EventAnnotation[]
  onAddEvent: (event: EventAnnotation) => void
  onUpdateEvent: (event: EventAnnotation) => void
  onDeleteEvent: (id: string) => void
  onToggleAll: (visible: boolean) => void
  onSelectEventDate?: (date: string) => void
}

const CATEGORY_MAP: Record<EventCategory, { label: string; color: string }> = {
  milestone: { label: '里程碑', color: '#8b5cf6' },
  policy: { label: '政策/法規', color: '#ef4444' },
  market: { label: '市場營收', color: '#10b981' },
  campaign: { label: '促銷活動', color: '#f59e0b' },
  incident: { label: '異常衝擊', color: '#f43f5e' },
  custom: { label: '自訂標籤', color: '#06b6d4' },
}

export const EventAnnotationPanel = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleAll,
  onSelectEventDate,
}: EventAnnotationPanelProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // New event form state
  const [newLabel, setNewLabel] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState<EventCategory>('milestone')
  const [newColor, setNewColor] = useState('#3b82f6')

  const handleCreate = (e: FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim() || !newDate) return

    const created: EventAnnotation = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: newDate,
      endDate: newEndDate ? newEndDate : undefined,
      label: newLabel.trim(),
      description: newDesc.trim() || undefined,
      color: newColor || CATEGORY_MAP[newCategory].color,
      category: newCategory,
      visible: true,
    }

    onAddEvent(created)
    setIsAdding(false)
    setNewLabel('')
    setNewDate('')
    setNewEndDate('')
    setNewDesc('')
  }

  const filteredEvents = events.filter((evt) => {
    if (filterCategory === 'all') return true
    return evt.category === filterCategory
  })

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col h-full transition-colors">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-2.5">
        <div className="flex items-center space-x-2 min-w-0">
          <BookmarkPlus className="w-4 h-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            事件註記 (Annotations)
          </h3>
          <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
            {events.length}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={() => onToggleAll(events.some((e) => !e.visible))}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded transition-colors text-xs"
            title="全部顯示 / 隱藏"
          >
            {events.every((e) => e.visible) ? (
              <Eye className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-1 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs px-2.5 py-1 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>新增</span>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 no-scrollbar">
        <button
          onClick={() => setFilterCategory('all')}
          className={`text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
            filterCategory === 'all'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          全部 ({events.length})
        </button>
        {Object.entries(CATEGORY_MAP).map(([catKey, catVal]) => {
          const count = events.filter((e) => e.category === catKey).length
          if (count === 0) return null
          return (
            <button
              key={catKey}
              onClick={() => setFilterCategory(catKey)}
              className={`text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                filterCategory === catKey
                  ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-medium'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {catVal.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Add Form (Collapsible) */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="mb-2.5 bg-zinc-50 dark:bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs space-y-2 animate-fadeIn"
        >
          <div className="flex justify-between items-center text-zinc-800 dark:text-zinc-200 font-medium">
            <span>標註新事件時間戳</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">事件名稱 *</label>
            <input
              type="text"
              required
              placeholder="例：降息、促銷節、產品上線..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">開始日期 *</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">結束日期 (選填)</label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">類別</label>
              <select
                value={newCategory}
                onChange={(e) => {
                  const cat = e.target.value as EventCategory
                  setNewCategory(cat)
                  setNewColor(CATEGORY_MAP[cat].color)
                }}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
              >
                {Object.entries(CATEGORY_MAP).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">標籤顏色</label>
              <div className="flex items-center space-x-2 pt-0.5">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[10px]">{newColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">背景說明 / 備註</label>
            <input
              type="text"
              placeholder="說明..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none text-xs"
            />
          </div>

          <div className="flex justify-end space-x-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded font-medium"
            >
              確認新增
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[360px]">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
            無符合條件之事件註記
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const catInfo = CATEGORY_MAP[evt.category] || CATEGORY_MAP.custom

            return (
              <div
                key={evt.id}
                className={`p-2 rounded-lg border transition-colors ${
                  evt.visible
                    ? 'bg-zinc-50 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800'
                    : 'bg-zinc-100/60 dark:bg-zinc-950/30 border-zinc-200 dark:border-zinc-900 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: evt.color || catInfo.color }}
                      />
                      <span
                        onClick={() => onSelectEventDate && onSelectEventDate(evt.date)}
                        className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                        title={evt.label}
                      >
                        {evt.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center space-x-1 font-mono whitespace-nowrap shrink-0">
                        <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="whitespace-nowrap">{evt.date}</span>
                        {evt.endDate && <span className="whitespace-nowrap"> ~ {evt.endDate}</span>}
                      </span>
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-medium"
                        style={{
                          backgroundColor: `${evt.color || catInfo.color}20`,
                          color: evt.color || catInfo.color,
                        }}
                      >
                        {catInfo.label}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-0.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        onUpdateEvent({ ...evt, visible: !evt.visible })
                      }
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded"
                      title={evt.visible ? '隱藏標註' : '顯示標註'}
                    >
                      {evt.visible ? (
                        <Eye className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteEvent(evt.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      title="刪除標註"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
