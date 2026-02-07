# Web 頁面：受託人／計劃與全部基金

## 目的與範圍

- **首頁**：`/` — 顯示「本月表現最佳基金」橫向長條圖（Y 排名+基金名，X 本月較上月百分比）；目前只顯示前 5 名（`SHOW_ONLY_TOP_5`）；基金名稱中文上一行、英文下一行，可點擊連結至 `/funds/detail?fund={基金名稱}`。資料來自 `public/data/top10_funds_this_month.json`（由 `scripts/top10-funds-this-month.mjs` 產出）。
- **第一版**：`/trustees/` — 使用者選擇受託人 (Trustee)，列出該受託人下的強積金計劃 (Schemes)。
- **第二版**：`/funds/` — 列出所有強積金基金名稱（去重、排序，先顯示中文下一行英文）；基金詳情為獨立頁面 `/funds/detail?fund={基金 ID}`，方便 SEO 分辨各基金瀏覽量。
- **我的收藏**：`/favourites/` — 使用者可將基金加入收藏（書籤），收藏存於 localStorage（key: `mpflogs-bookmarks`）；「我的收藏」頁只顯示已收藏基金列表，每項為連結至 `/funds/detail?fund={基金 ID}`，右側有書籤按鈕可移除收藏。全部基金列表、計劃基金頁與基金詳情頁右側亦有書籤按鈕可加入／移除收藏。

關鍵字：trustees, schemes, funds, funds/detail, 受託人, 計劃, 基金, 基金詳情頁, 收藏, 書籤, bookmark, favourites, SEO, TrusteeSchemeSelector, FundDetailView, FundChart, FundListWithBookmarks, FavouritesView, BookmarkButton, 本月表現最佳基金, top10_funds_this_month, 示範數據, 大市指數.

## 路徑與資料

| 項目 | 路徑／說明 |
|------|------------|
| 受託人與計劃頁 | `src/pages/trustees.astro` |
| 全部基金頁 | `src/pages/funds.astro` |
| 基金詳情頁 | `src/pages/funds/detail.astro`（讀取 `?fund={基金 ID}`，由 FundDetailView 顯示圖表與數據） |
| 我的收藏頁 | `src/pages/favourites.astro` |
| React 組件 | `TrusteeSchemeSelector.tsx`、`SchemeFundList.tsx`（計劃基金列表 + 右側書籤 + 詳情連結）、`FundDetailView.tsx`（基金詳情 + 書籤）、`FundChart.tsx`、`FundListWithBookmarks.tsx`（基金列表 + 右側書籤）、`FavouritesView.tsx`（我的收藏：已收藏基金列表連結至詳情 + 右側書籤）、`BookmarkButton.tsx`、`FundDetailBlock.tsx`（單一基金詳情區塊） |
| 收藏儲存 | `src/lib/bookmarks.ts`（localStorage key: `mpflogs-bookmarks`）、`src/lib/useBookmarks.ts`（React hook） |
| 類型 | `src/types/mpf.ts`（TrusteeInfo, SchemeInfo, FundEntry, FundPriceSchemeEntry, FundPriceSchemeData） |
| 前端資料來源 | `public/data/fund_price_scheme.json`、`public/data/top10_funds_this_month.json`（首頁圖表；組件以 `fetch` + `import.meta.env.BASE_URL` 載入） |
| 資料來源（pipeline 輸出） | `data/mpf/json/fund_price_scheme.json`、`data/mpf/json/top10_funds_this_month.json` |

## 使用方式

1. **本地開發**：`npm run dev`，開啟 http://localhost:4321/trustees/ 與 http://localhost:4321/funds/。
2. **導覽**：Layout 頂部有「受託人與計劃」「全部基金」「我的收藏」連結。
3. **GitHub Pages**：以 **GitHub Actions** 部署，不用 Jekyll。Repo **Settings → Pages → Source** 選 **GitHub Actions**。推送 `main` 後會執行 `.github/workflows/deploy.yml`（Astro build + deploy-pages）。網站網址：`https://<owner>.github.io/mpflogs`；`astro.config.mjs` 內 `base: "/mpflogs"`、`site` 需對應 owner。
4. **更新前端資料**：跑完 data pipeline 後，需複製最新 JSON 到 public，否則網頁仍顯示舊資料：
   ```bash
   cp data/mpf/json/fund_price_scheme.json public/data/fund_price_scheme.json
   ```
   首頁「本月表現最佳基金」圖表另需 top10 JSON；腳本會同時寫入 `data/mpf/json/` 與 `public/data/`，或手動執行：`npm run data:top10-funds-this-month`。

## 技術備註

- **TrusteeSchemeSelector**：`client:load`，在 mount 時 fetch 上述 JSON，不依賴 Astro 傳入大物件，避免序列化問題。
- **計劃基金頁**：`/scheme/?trustee=&scheme=` 由 SchemeFundList 列出基金；每行顯示基金名（中文第一行、英文第二行）為可點擊連結至 `/funds/detail?fund={基金名稱}`，右側為書籤按鈕與「詳情」箭頭連結。資料來自 pipeline 的 `fund_price_scheme.json`（xls-to-json 從 XLS 下一列讀取 `fundZh`，split-fund-price-scheme 輸出為 `zh`）。
- **基金詳情**：獨立頁面 `/funds/detail?fund={基金 ID}`（`src/pages/funds/detail.astro`）由 `FundDetailView`（client:load）讀取 `fund` 參數、fetch JSON，顯示該基金單位價格走勢圖與數據表；並設定 `document.title` 為「{基金名} — MPF Logs」以利 SEO。無 `fund` 時在詳情頁顯示「請從網址指定基金或前往全部基金選擇」。單位價格數據表為三欄（月份、單位價格、變動百分比）；變動百分比於 **client 端**計算「本月 vs 上個月」，顯示倒序最新在上；正／負數以綠／紅顯示。
- **全部基金列表**：`/funds/` 基金一覽以「中文第一行、英文第二行」顯示（有 `zh` 時），每行右側有書籤按鈕；每項可點進 `/funds/detail?fund={名稱}`。資料由 Astro 從 `fund_price_scheme.json` 建 `allFunds`（以 fund 去重、取首次 zh）。
- **收藏（書籤）**：書籤存於 localStorage（`mpflogs-bookmarks`），為基金英文名稱陣列。`BookmarkButton` 使用書籤圖示、置於右側；`useBookmarks` 提供 `bookmarks`、`toggleBookmark`、`isBookmarked`，變更時會 dispatch 自訂事件讓各 island 同步。基金詳情頁標題列右側亦有書籤按鈕。
- **我的收藏頁**：`/favourites/` 只顯示已收藏基金列表；每項為連結至詳情頁（`/funds/detail?fund={基金 ID}`），基金名以「中文第一行、英文第二行」顯示（FavouritesView 從 `fund_price_scheme.json` 解析 zh），右側有書籤按鈕可從收藏移除。利於 SEO：頁面為靜態標題與說明 + 連結列表，無行內詳情區塊。
- **首頁本月表現最佳基金**：`FundChart`（`src/components/FundChart.tsx`）讀取 `top10_funds_this_month.json`，以橫向長條圖顯示排名與本月較上月百分比；頭三名 bar 為金銀銅色、bar 尾顯示 🥇🥈🥉；Y 軸為基金名稱（中文上一行、英文下一行），可點擊連結至 `/funds/detail?fund={fund}`。`SHOW_ONLY_TOP_5 = true` 時只顯示前 5 名；`USE_DEMO_DATA = true` 時不載入 JSON、改顯示負到正示範數據。Deploy 時 `.github/workflows/deploy.yml` 會先執行 `node scripts/top10-funds-this-month.mjs` 再 build，確保 public 有最新 top10 JSON。
- **示範／假數據標示**：`FundChart` 當 `USE_DEMO_DATA` 或 fetch 失敗時會顯示示範數據並提示「以下為示範數據…」；錯誤狀態亦註明非真實數據。
- **JSX**：`tsconfig.json` 使用 `"jsx": "react"`（經典轉換），避免 React 19 在 dev 下出現 `jsxDEV is not a function`。
