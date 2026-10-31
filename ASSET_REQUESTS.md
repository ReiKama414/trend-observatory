# Trend Observatory - Asset Requests & Specifications

本檔案記錄本專案可能需求之視覺資產規格與 ComfyUI Prompt 指引。專案已先採用乾淨的 SVG / CSS 占位元件與圖示（Lucide Icons），所有功能均不依賴外部美術素材，隨時可無縫替換。

---

## 1. 專案社群預覽卡 (Social OpenGraph Preview Card)
- **用途**: Twitter / Discord / LinkedIn 網站分享縮圖
- **規格尺寸**: `1200 x 630 px` (PNG 格式, < 500KB)
- **視覺風格**: 嚴謹金融與科學研究工作台風格，暗色調背景，多條對齊之時間序列折線（含移動平均與事件標記線），右下方為統計數據卡（CAGR、相關性矩陣）。
- **ComfyUI Prompt 建議**:
  ```text
  modern financial data observatory workstation dashboard, multiple precise glowing time series trend lines, moving average ribbon, candlestick and line overlays, clean dark UI, minimal dark blue and slate background, high precision analytics screen, Bloomberg terminal meets Grafana aesthetics, crisp typography, 8k resolution, vector crisp render, no clutter, professional telemetry UI
  ```
- **Negative Prompt**:
  ```text
  blurry, oversaturated, cartoon, 3d characters, messy text, stock photo watermark, generic web template
  ```

---

## 2. 應用程式圖示 (App Icon / Favicon)
- **用途**: 瀏覽器標籤頁圖示與 PWA Icon
- **規格尺寸**: `512 x 512 px` (PNG / SVG)
- **現行實作**: 已包含向量 SVG 圖示 (`public/favicon.svg`)，描繪對齊座標軸與上升趨勢折線。
- **ComfyUI Prompt 建議**:
  ```text
  minimalist app icon for a scientific time-series trend observatory, clean geometric line chart with two intersecting trend waves and a golden milestone pin point, dark slate background, rounded square container, sleek modern tech logo, Figma vector style
  ```
