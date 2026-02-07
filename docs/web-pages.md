# Web 頁面：受託人／計劃與全部基金

## 目的與範圍

- **第一版**：`/trustees/` — 使用者選擇受託人 (Trustee)，列出該受託人下的強積金計劃 (Schemes)。
- **第二版**：`/funds/` — 列出所有強積金基金名稱（去重、排序，先顯示中文下一行英文）；`/funds?detail={基金名稱}` 顯示該基金單位價格圖表與數據。

關鍵字：trustees, schemes, funds, 受託人, 計劃, 基金, TrusteeSchemeSelector, FundDetailView, fund_price_scheme, 示範數據, 大市指數.

## 路徑與資料

| 項目 | 路徑／說明 |
|------|------------|
| 受託人與計劃頁 | `src/pages/trustees.astro` |
| 全部基金頁 | `src/pages/funds.astro` |
| React 組件 | `TrusteeSchemeSelector.tsx`（受託人 + 計劃列表）、`SchemeFundList.tsx`（計劃內基金列表 + 詳情連結）、`FundDetailView.tsx`（基金詳情圖表與數據）、`FundChart.tsx`（首頁基金與大市比較圖） |
| 類型 | `src/types/mpf.ts`（TrusteeInfo, SchemeInfo, FundEntry, FundPriceSchemeEntry, FundPriceSchemeData） |
| 前端資料來源 | `public/data/fund_price_scheme.json`（組件以 `fetch('/data/fund_price_scheme.json')` 載入） |
| 資料來源（pipeline 輸出） | `data/mpf/json/fund_price_scheme.json` |

## 使用方式

1. **本地開發**：`npm run dev`，開啟 http://localhost:4321/trustees/ 與 http://localhost:4321/funds/。
2. **導覽**：Layout 頂部有「受託人與計劃」「全部基金」連結。
3. **GitHub Pages**：以 **GitHub Actions** 部署，不用 Jekyll。Repo **Settings → Pages → Source** 選 **GitHub Actions**。推送 `main` 後會執行 `.github/workflows/deploy.yml`（Astro build + deploy-pages）。網站網址：`https://<owner>.github.io/mpflogs`；`astro.config.mjs` 內 `base: "/mpflogs"`、`site` 需對應 owner。
4. **更新前端資料**：跑完 data pipeline 後，需複製最新 JSON 到 public，否則網頁仍顯示舊資料：
   ```bash
   cp data/mpf/json/fund_price_scheme.json public/data/fund_price_scheme.json
   ```

## 技術備註

- **TrusteeSchemeSelector**：`client:load`，在 mount 時 fetch 上述 JSON，不依賴 Astro 傳入大物件，避免序列化問題。
- **計劃基金頁**：每行顯示基金中英文名（`fund.zh` + `fund.fund`），右側為「詳情」圖示連結至 `/funds?detail={基金名稱}`；不再使用行內展開／收合。資料來自 pipeline 的 `fund_price_scheme.json`（xls-to-json 從 XLS 下一列讀取 `fundZh`，split-fund-price-scheme 輸出為 `zh`）。
- **基金詳情**：`/funds?detail={基金名稱}` 由 `FundDetailView`（client:load）讀取 URL 參數、fetch 同上 JSON，顯示該基金單位價格走勢圖與數據表；無 `detail` 時不渲染。
- **全部基金列表**：`/funds/` 基金一覽以「中文第一行、英文第二行」顯示（有 `zh` 時）；每項可點進 `/funds?detail={名稱}`。資料由 Astro 從 `fund_price_scheme.json` 建 `allFunds`（以 fund 去重、取首次 zh）。
- **示範／假數據標示**：`FundChart`（首頁）當使用 Supabase 以外或無資料時會顯示 DEMO 數據；此時會顯示明顯提示「以下為示範數據，非真實數據。」（琥珀色橫幅）及對應 `aria-label`，錯誤狀態亦註明非真實數據。
- **JSX**：`tsconfig.json` 使用 `"jsx": "react"`（經典轉換），避免 React 19 在 dev 下出現 `jsxDEV is not a function`。
