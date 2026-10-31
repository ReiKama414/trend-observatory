import { useRef, useState } from 'react'
import {
  Activity,
  Download,
  FolderOpen,
  Database,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Menu,
  Shield,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '../context/useTheme'

interface HeaderProps {
  onLoadPreset: (presetKey: 'semi' | 'ecom' | 'energy') => void
  onOpenExport: () => void
  onImportWorkspace: (file: File) => void
  onReset: () => void
  dbSavedCount: number
  onToggleMobileDrawer: () => void
  datasetCount: number
  eventCount: number
}

export const Header = ({
  onLoadPreset,
  onOpenExport,
  onImportWorkspace,
  onReset,
  dbSavedCount,
  onToggleMobileDrawer,
  datasetCount,
  eventCount,
}: HeaderProps) => {
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false)

  const CurrentThemeIcon =
    theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun

  return (
    <header className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 select-none transition-colors">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Drawer Trigger (visible on < lg) */}
          <button
            onClick={onToggleMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 relative focus:outline-none shrink-0"
            aria-label="開啟資料與事件抽屜"
            title="開啟資料集與事件面板"
          >
            <Menu className="w-4 h-4" />
            {(datasetCount > 0 || eventCount > 0) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {datasetCount}
              </span>
            )}
          </button>

          {/* Logo icon box */}
          <div className="p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 dark:text-blue-600" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1
                data-testid="header-title"
                className="font-bold text-sm sm:text-base tracking-tight font-mono truncate"
              >
                Trend Observatory
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded shrink-0 inline-block">
                v1.0
              </span>
            </div>
            <p
              data-testid="header-subtitle"
              className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:block truncate"
            >
              時間序列研究平台 · 多指標對比與基準分析
            </p>
          </div>

          {/* Current Dataset Badge */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
            <span className="text-zinc-500 dark:text-zinc-400 text-xs shrink-0">活躍序列:</span>
            <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 max-w-[160px] truncate">
              {datasetCount} 組資料集 ({dbSavedCount} 筆持久化)
            </span>
          </div>

          {/* Presets on Desktop */}
          <div className="hidden xl:flex items-center gap-1.5 ml-1 pl-3 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
            <Database className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-500 dark:text-zinc-400 text-xs shrink-0">範例:</span>
            <button
              onClick={() => onLoadPreset('semi')}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium px-1 py-0.5"
            >
              科技股
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              onClick={() => onLoadPreset('ecom')}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium px-1 py-0.5"
            >
              電商
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              onClick={() => onLoadPreset('energy')}
              className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium px-1 py-0.5"
            >
              綠能
            </button>
          </div>
        </div>

        {/* Right Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Privacy Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>沙盒隱私保護中</span>
          </div>

          {/* Preset Dropdown on Mobile / Tablet */}
          <div className="relative xl:hidden">
            <button
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center space-x-1 text-xs"
              title="選擇範例資料"
            >
              <Database className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span className="hidden sm:inline">範例</span>
            </button>
            {isPresetMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsPresetMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      onLoadPreset('semi')
                      setIsPresetMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  >
                    科技與半導體
                  </button>
                  <button
                    onClick={() => {
                      onLoadPreset('ecom')
                      setIsPresetMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-600 dark:text-emerald-400"
                  >
                    電商營運週期
                  </button>
                  <button
                    onClick={() => {
                      onLoadPreset('energy')
                      setIsPresetMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-cyan-600 dark:text-cyan-400"
                  >
                    綠能與負載
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Import JSON Workspace */}
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onImportWorkspace(e.target.files[0])
                e.target.value = ''
              }
            }}
          />
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded transition-all"
            title="載入已匯出之專案 JSON 檔"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden xl:inline">載入專案</span>
          </button>

          {/* Reset Workspace */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded transition-all"
            title="清空並重設本機儲存之資料"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重設</span>
          </button>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded transition-all"
              aria-label="切換主題 (System, Light, Dark)"
              title={`目前主題: ${
                theme === 'system'
                  ? `系統預設 (${resolvedTheme === 'dark' ? '深色' : '淺色'})`
                  : theme === 'dark'
                  ? '深色模式'
                  : '淺色模式'
              }`}
            >
              <CurrentThemeIcon className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 opacity-60 hidden sm:inline" />
            </button>

            {isThemeMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsThemeMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      setTheme('system')
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      theme === 'system'
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>系統預設</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('light')
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      theme === 'light'
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>淺色模式</span>
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark')
                      setIsThemeMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      theme === 'dark'
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>深色模式</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export CTA Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded shadow-xs transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">匯出成果</span>
            <span className="sm:hidden">匯出</span>
          </button>
        </div>
      </div>
    </header>
  )
}
