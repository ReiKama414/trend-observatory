# Trend Observatory

[English](README.md) · **繁體中文**

> **時間序列研究工作台** — 本機優先、零伺服器傳輸的多維度時間序列分析、趨勢對比與標準化研究平台

<p align="center">
  <a href="https://github.com/ReiKama414/trend-observatory">GitHub</a> ·
  <a href="https://reikama414.vercel.app/">個人網站</a> ·
  <a href="#快速開始">快速開始</a> ·
  <a href="#操作指南">操作指南</a> ·
  <a href="#測試與驗證">測試與驗證</a> ·
  <a href="#license--權限">授權</a>
</p>

---

## 為什麼做

金融、電商與科學領域的時間序列數據往往面臨量級懸殊、採樣頻率不一、日期缺失與季節性雜訊等挑戰。多數現有線上圖表工具不是需要上傳機密數據到雲端伺服器，就是僅具備基礎折線繪製功能，欠缺動態基準日標準化、多軸對齊與事件定位能力

Trend Observatory 以純前端架構為核心，所有資料解析、清洗補全與數學轉換均在瀏覽器本機記憶體完成。資料不離機，不使用虛假即時行情，內建半導體、電商與能源真實形態基準數據，提供專業研究者嚴謹、可重現且無資安顧慮的工作環境

---

## 核心亮點

- **多 CSV 自訂映射** — 支援批次拖曳載入多份檔案，智慧探測日期與數值欄位，自由分配左／右雙 Y 軸
- **基準值 100 標準化** — 可自訂基準日將異質資產重設為 100 點，消除量級落差，精準對比相對回報率與強度
- **重採樣與缺失填補** — 提供原始、日、週、月、季、年六種粒度，支援前向填補 (LOCF)、線性插值與補零
- **增長率與移動平均** — 內建 MoM、YoY、PoP 變動率，以及自訂週期的 SMA 與 EMA 平滑曲線
- **動態區間 CAGR 運算** — 滑動時間軸選取觀察視窗，即時計算區間增長率、年化複合成長率與皮爾森相關矩陣
- **季節性三維檢視** — 提供年度同軸疊加、星期分佈柱狀圖與月度熱力矩陣，迅速洞悉跨年與週期性規律
- **事件標註與定位聚焦** — 支援單點垂直線與區間帶陰影，點選標籤即可將主圖自動縮放至該歷史事件區間
- **全格式成果匯出** — 產出 1x／2x／3x 高清 PNG 圖檔、清洗對齊後的合併 CSV，以及完整工作區 JSON 備份
- **本地持久化儲存** — 整合 IndexedDB，資料集、事件標註與偏好設定自動留存本機，重新整理不遺失
- **零重疊版面規範** — 圖表卡片嚴格劃分 Header、Description、Stats、Canvas 與 Footer 五層結構，通過 200% 縮放防碰撞測試

---

## 技術棧

| 領域 | 技術選型 | 說明 |
| --- | --- | --- |
| 核心框架 | React 19 · TypeScript 6 | 現代單頁應用與嚴格型別系統 |
| 建置工具 | Vite 8 | 極速模組熱重載與生產代碼分割 |
| 圖表繪製 | Apache ECharts 6.1 | Canvas 高效能時間序列渲染與縮放互動 |
| 樣式管理 | Tailwind CSS v4 | 原生深淺雙主題支援與響應式格點 |
| 本地儲存 | IndexedDB (`idb`) | 瀏覽器端非同步結構化資料持久化 |
| 數據解析 | PapaParse | 瀏覽器端純前端 CSV 高效串流解析 |
| 圖示組件 | Lucide Icons | 統一幾何風格圖示 |
| 單元測試 | Vitest | 23 項核心數學與時序演算法測試 |
| 瀏覽器測試 | Playwright | 32 項端到端、雙主題與 9 種尺寸防碰撞檢驗 |

---

## 快速開始

### 環境需求

- Node.js 20.19+ 或 22.12+
- npm 10+
- 支援現代 HTML5 Canvas 的瀏覽器

### 安裝與啟動

```bash
# 1. 複製儲存庫
git clone https://github.com/ReiKama414/trend-observatory.git
cd trend-observatory

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev
```

終端機印出本機網址後，於瀏覽器開啟 `http://localhost:5173`

---

## 操作指南

1. **載入資料**：點選右上角範例按鈕（「科技股」、「電商」或「綠能」），或直接將本機 CSV 拖曳至左側面板
2. **調整欄位與軸別**：展開左側資料卡，自訂時間欄與指標欄，可將第二項指標切換為「右軸 (副)」進行雙軸對比
3. **選擇轉換運算**：使用頂部工具列切換時間粒度（如月粒度），轉換模式選擇「基準值 100」並指定基準日
4. **觀察統計指標**：查看下方指標卡片之「區間成長率」與「CAGR」，拖曳主圖底部時間滑桿可即刻重算
5. **檢視季節週期**：點選頂部「季節性檢視」，在「年度同軸疊加」、「星期分佈」與「月度熱力圖」間切換
6. **標註歷史事件**：切換左側「事件註記」頁籤新增關鍵時點，點擊清單項目主圖將自動縮放聚焦
7. **匯出分析成果**：點擊右上角「匯出成果」，選擇下載高解析度圖檔、清洗後 CSV 或保存工作區 JSON

---

## 專案結構

```text
trend-observatory/
├── e2e/                     # Playwright 端到端、RWD 雙主題與防重疊幾何測試
│   ├── app.spec.ts          # 核心操作工作流程測試
│   ├── rwd-theme.spec.ts    # 9 種 Viewport 雙主題佈局穩定度測試
│   └── zero-overlap.spec.ts # Bounding Box 碰撞與 200% 縮放測試
├── public/                  # 靜態圖示與網站圖標
├── src/
│   ├── __tests__/           # Vitest 單元測試（數學演算法與 CSV 解析）
│   ├── components/          # 專業工作台介面元件
│   │   ├── ControlToolbar.tsx       # 粒度、補值、轉換與均線工具列
│   │   ├── DatasetManager.tsx       # 多 CSV 上傳、欄位映射與樣式設定
│   │   ├── DataTableView.tsx        # 對齊數據總表與分頁搜尋
│   │   ├── EventAnnotationPanel.tsx # 事件標籤 CRUD 與跳轉縮放
│   │   ├── ExportModal.tsx          # PNG、CSV 與 JSON 匯出視窗
│   │   ├── Header.tsx               # 頂部導覽、範例選擇與主題切換
│   │   ├── MainChart.tsx            # 五分層 Document Flow 時序主圖
│   │   ├── MetricsSummaryCard.tsx   # 成長率、統計摘要與皮爾森相關矩陣
│   │   └── SeasonalityView.tsx      # 年度疊加、星期分佈與月度熱力圖
│   ├── context/             # 主題模式 Context (System / Light / Dark)
│   ├── types/               # TypeScript 資料型別定義
│   ├── utils/
│   │   ├── csvHelper.ts     # CSV 解析、型別容錯、欄位探測與匯出
│   │   ├── db.ts            # IndexedDB 持久化存取層
│   │   ├── sampleData.ts    # 真實形態歷史基準資料集
│   │   └── timeSeries.ts    # 重採樣、缺失補全、標準化與統計運算核心
│   ├── App.tsx              # 主工作台容器與響應式抽屜導航
│   └── main.tsx             # 應用程式入口
├── LICENSE                  # 著作權授權條款全文
├── package.json             # 專案依賴與腳本定義
└── vite.config.ts           # Vite 建置配置與代碼分割規則
```

---

## 測試與驗證

本專案具備完整自動化測試覆蓋，通過嚴格的語法檢查與實機視覺檢驗：

```bash
# 執行核心演算法單元測試 (Vitest 23 項測試)
npm test

# 執行 Playwright 全量端到端測試 (32 項測試，涵蓋 9 種尺寸與雙主題)
npm run test:e2e

# 啟動 Playwright 互動式 UI 介面
npx playwright test --ui

# 執行程式碼品質與型別檢查 (Oxlint)
npm run lint

# 正式生產環境建置
npm run build
```

---

## 部署說明

本專案為純靜態單頁應用 (SPA)，輸出目錄為 `dist/`，可一鍵部署至任何靜態託管環境

### Cloudflare Pages 部署步驟

1. 將專案推送到 GitHub 儲存庫
2. 登入 Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages**
3. 連結儲存庫並填寫建置設定：
   - **Framework Preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 點擊 **Save and Deploy** 即可完成全球 CDN 加速部署

亦可使用 Wrangler CLI 直接上傳建置產物：

```bash
npm run build
npx wrangler pages deploy dist --project-name trend-observatory
```

---

## 實際限制

- **大資料量效能邊界** — 純前端 Canvas 渲染在單一序列超過 100,000 點時，建議將時間粒度切換至日或月，避免瀏覽器記憶體過度膨脹
- **日期格式辨識** — 內建解析器支援 ISO 8601、常見斜線格式 (`YYYY/MM/DD`)、八位數字 (`YYYYMMDD`) 與 Unix Timestamp。特殊非標準自訂字串需先整理為通用公曆格式
- **本機隔離與隱私** — 採用 100% Client-Side 架構保護資料安全，未內建遠端多人即時協同編輯功能，跨裝置同步需透過工作區 JSON 匯入／匯出

---

## 相關連結

| 項目 | 連結 |
| --- | --- |
| 原始碼倉庫 | [GitHub 專案](https://github.com/ReiKama414/trend-observatory) |
| 作者個人網站 | [作品集](https://reikama414.vercel.app/) |
| 授權全文 | [LICENSE](./LICENSE) |

---

## License / 權限

Copyright (c) 2026 ReiKama414. All rights reserved.

本專案僅供個人瀏覽與學習。未經著作權人書面同意，不得使用、複製、修改、散布或併入其他專案（含非商業用途）

- [GitHub](https://github.com/ReiKama414/trend-observatory)
- [個人網站](https://reikama414.vercel.app/)
- [授權全文](./LICENSE)

---

<p align="center"><sub>ReiKama414 · Trend Observatory · 2026</sub></p>
