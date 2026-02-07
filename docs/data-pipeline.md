# MPF Data Pipeline — Spec & 說明

本專案將積金局每月 Consolidated List（XLS）轉成結構化 JSON，並拆出受託人／計劃維度表，供前端或 Supabase 使用。

---

## 流程概覽

```
data/mpf/raw/*.xls  →  scripts/xls-to-json.mjs  →  data/mpf/json/Consolidated_list_for_*_Read_Only.json
                                                              ↓
                                    scripts/split-trustees-schemes.mjs  →  data/mpf/json/trustees_schemes.json
                                    scripts/split-fund-price-scheme.mjs  →  data/mpf/json/fund_price_scheme.json（單月）
                                    scripts/merge-fund-price-months.mjs    →  覆寫 fund_price_scheme.json（unitPrice 為過去 3 個月列表）
                                    (並回寫 Consolidated JSON 的 forward-fill)
```

1. **xls-to-json.mjs**：讀取最新月份 XLS，跳過標題列，英/中列配對，輸出 consolidated JSON。
2. **split-trustees-schemes.mjs**：讀取最新 consolidated JSON，forward-fill trustee/scheme，產出唯一 (trustee, scheme) 表並寫回 consolidated。
3. **split-fund-price-scheme.mjs**：讀取最新 consolidated JSON，依 (trustee, scheme) 分組，產出 **fund_price_scheme.json**（每 scheme 一筆，含 `funds[]` 的 fund / unitPrice / notes）。
4. **merge-fund-price-months.mjs**：讀取現有 fund_price_scheme.json 及最近 3 個月的 fund_price_scheme_YYYY-MM.json，將 unitPrice 改為 `[{ month, price }, ...]` 並覆寫 fund_price_scheme.json。
5. **generate-all-trustees-schemes.mjs**：遍歷所有月份 XLS，產出每月 consolidated + `trustees_schemes_YYYY-MM.json` + `fund_price_scheme_YYYY-MM.json`。

---

## 輸入

- **路徑**：`data/mpf/raw/`
- **檔名**：`Consolidated_list_for_MMM_YY_Read_Only.xls`（例如 `Consolidated_list_for_Dec_25_Read_Only.xls`）
- **來源**：積金局每月單位價格 Consolidated List（可從官網下載）
- **結構**：首 5 行為標題／欄名（中英等），之後為資料列；**英文列與中文列交替**（一筆基金：英列有 unit price，下一列為中文對照）。

---

## Script 1：xls-to-json.mjs（Node + xlsx）

### 用途

- 在 `data/mpf/raw/` 中依檔名 `MMM_YY` 選出**最新月份**的 XLS。
- 跳過前 5 行，只保留「單位價格為數字」的列。
- 每筆資料：英列 + 下一列（中文）配對，產出 trustee/scheme/fund 的英中文欄位。

### 執行

```bash
npm run data:xls-to-json
# 或：node scripts/xls-to-json.mjs
```

### 輸出

- **路徑**：`data/mpf/json/Consolidated_list_for_<MMM>_<YY>_Read_Only.json`
- **結構**：

```json
{
  "source": "Consolidated_list_for_Dec_25_Read_Only.xls",
  "sheet": "Sheet1",
  "exportedAt": "2026-02-07T...",
  "rowCount": 445,
  "data": [
    {
      "trusteeEn": "AIA Company (Trustee) Limited",
      "trusteeZh": "友邦 (信託) 有限公司",
      "schemeEn": "AIA MPF - Prime Value Choice",
      "schemeZh": "友邦強積金優選計劃",
      "trustee": "AIA Company (Trustee) Limited",
      "scheme": "AIA MPF - Prime Value Choice",
      "fund": "Age 65 Plus Fund",
      "fundZh": "65歲後基金",
      "unitPrice": 1.2122,
      "notes": "3a"
    }
  ]
}
```

- **欄位**：`trusteeEn` / `trusteeZh`、`schemeEn` / `schemeZh`、`trustee` / `scheme`（= 英文）、`fund`、`fundZh`（下一列中文基金名）、`unitPrice`、`notes`。
- 因 XLS 合併儲存格，部分列 `trustee`/`scheme` 會為 null，留給 **split-trustees-schemes** 做 forward-fill。

---

## Script 2：split-trustees-schemes.mjs（Node）

### 用途

- 讀取 `data/mpf/json/` 中**最新**的 `Consolidated_list_for_*_Read_Only.json`。
- 對 `trusteeEn` / `trusteeZh` / `schemeEn` / `schemeZh` 做 **forward-fill**（null 用上一列補齊）。
- 依 (trusteeEn, schemeEn) 去重，產出 **trustees_schemes.json**（巢狀格式）。
- 將 forward-fill 後的資料**寫回**同一 consolidated JSON。
- **檢查**：任一行不得有 `trusteeEn` 或 `schemeEn` 為 null（即「不能有 scheme 的 trustee 是 null」）。

### 執行

```bash
npm run data:split-trustees-schemes
# 或：node scripts/split-trustees-schemes.mjs
```

**建議順序**：先跑 `data:xls-to-json`，再跑 `data:split-trustees-schemes`。

## Script 3：split-fund-price-scheme.mjs（Node）

### 用途

- 讀取 `data/mpf/json/` 中**最新**的 `Consolidated_list_for_*_Read_Only.json`。
- 對 trustee/scheme 做 **forward-fill**，再依 (trusteeEn, schemeEn) **分組**。
- 產出 **fund_price_scheme.json**：每筆為一 scheme，含 `trustee` / `scheme`（巢狀 name、en、zh）及 `funds[]`（fund、unitPrice、notes）。

### 執行

```bash
npm run data:split-fund-price-scheme
# 或：node scripts/split-fund-price-scheme.mjs
```

### 輸出

- **路徑**：`data/mpf/json/fund_price_scheme.json`
- **結構**：

```json
{
  "source": "Consolidated_list_for_Dec_25_Read_Only.json",
  "exportedAt": "2026-02-07T...",
  "count": 24,
  "data": [
    {
      "trustee": { "name": "...", "en": "...", "zh": "..." },
      "scheme": { "name": "...", "en": "...", "zh": "..." },
      "funds": [
        { "fund": "Age 65 Plus Fund", "unitPrice": 1.2122, "notes": "3a" }
      ]
    }
  ]
}
```

- **funds[]**：每筆含 `fund`（英文名）、`zh`（中文名，來自 XLS 下一列）、`unitPrice`（單一數字）、`notes`。此輸出會被 **merge-fund-price-months** 覆寫為 `unitPrice` 列表格式。
- **用途**：依 scheme 查詢該計劃下所有基金與單位價格，前端可依 trustee/scheme 篩選後顯示 `funds[]`。

## Script 4：merge-fund-price-months.mjs（Node）

### 用途

- 讀取 `data/mpf/json/` 中現有 **fund_price_scheme.json**（來自 split-fund-price-scheme，含 zh）及**所有** **fund_price_scheme_YYYY-MM.json**（依月份排序）。
- 將每隻基金的 `unitPrice` 改為列表：`[{ "month": "2025-01", "price": 1.2 }, ...]`（由舊到新，**列出所有月份**）。
- 覆寫 **fund_price_scheme.json**，並寫入頂層 `months` 欄位（例如 `["2025-01", "2025-02", …, "2025-12"]`）。

### 執行

```bash
npm run data:merge-fund-price-months
# 或：node scripts/merge-fund-price-months.mjs
```

**建議順序**：先跑 `data:split-fund-price-scheme`，再跑 `data:merge-fund-price-months`。更新前端資料後記得：`cp data/mpf/json/fund_price_scheme.json public/data/`。

### 輸出結構（fund_price_scheme.json 合併後）

```json
{
  "source": "...",
  "exportedAt": "...",
  "months": ["2025-01", "2025-02", "…", "2025-12"],
  "count": 24,
  "data": [
    {
      "trustee": { "name": "...", "en": "...", "zh": "..." },
      "scheme": { "name": "...", "en": "...", "zh": "..." },
      "funds": [
        {
          "fund": "Age 65 Plus Fund",
          "zh": "65歲後基金",
          "unitPrice": [
            { "month": "2025-09", "price": 1.2005 },
            { "month": "2025-11", "price": 1.2144 },
            { "month": "2025-12", "price": 1.2122 }
          ],
          "notes": "3a"
        }
      ]
    }
  ]
}
```

## Script 5：generate-all-trustees-schemes.mjs（Node + xlsx）

### 用途

- 遍歷 `data/mpf/raw/` 內所有 `Consolidated_list_for_*_Read_Only.xls` 或 `.xlsx`。
- 每月產出：`Consolidated_list_for_*_Read_Only.json`、`trustees_schemes_YYYY-MM.json`、`fund_price_scheme_YYYY-MM.json`。
- 某月 XLS 無法讀取（保護/加密）時跳過該月並在 console 提示。

### 執行

```bash
npm run data:generate-all-trustees-schemes
# 或：node scripts/generate-all-trustees-schemes.mjs
```

### 輸出 1：trustees_schemes.json

- **路徑**：`data/mpf/json/trustees_schemes.json`
- **結構**：

```json
{
  "source": "Consolidated_list_for_Dec_25_Read_Only.json",
  "exportedAt": "2026-02-07T...",
  "count": 24,
  "data": [
    {
      "trustee": {
        "name": "AIA Company (Trustee) Limited",
        "en": "AIA Company (Trustee) Limited",
        "zh": "友邦 (信託) 有限公司"
      },
      "scheme": {
        "name": "AIA MPF - Prime Value Choice",
        "en": "AIA MPF - Prime Value Choice",
        "zh": "友邦強積金優選計劃"
      }
    }
  ]
}
```

- **用途**：維度表；前端可用 `item.trustee.name` 或 `item.trustee[locale]`（`locale` 為 `"en"` / `"zh"`）做顯示與篩選。

### 輸出 2：fund_price_scheme_YYYY-MM.json

- **路徑**：`data/mpf/json/fund_price_scheme_YYYY-MM.json`（每月一份）。
- **結構**：與 Script 3 的 fund_price_scheme.json 相同，多 `monthKey` 欄位；每筆為一 scheme，含 `trustee` / `scheme` / `funds[]`。
- **用途**：依月份查詢各計劃下基金與單位價格。

### 輸出 3：Consolidated JSON

- 同一 consolidated 檔的 `data[]` 會被替換為 **forward-fill 後**的列（每筆都有 `trusteeEn` / `trusteeZh` / `schemeEn` / `schemeZh` 及 `trustee` / `scheme`）。
- 之後若要做 Supabase 或圖表，可直接用此 JSON 或再轉成 DB 格式。

---

## 依賴

- **Node.js** + **xlsx**（SheetJS）：讀取 .xls。見 `package.json` devDependencies。
- 安裝：`npm install`

---

## Script 6：top10-funds-this-month.mjs（Node）

### 用途

- 讀取 **fund_price_scheme.json**（`data/mpf/json/` 或 `public/data/`），以資料中最後一個月份為「本月」、倒數第二個月份為「上個月」。
- 計算每檔基金的月變動百分比 `(本月價格 - 上月價格) / 上月價格 * 100`，依百分比由高到低排序，取前 10 名。
- 輸出 **top10_funds_this_month.json** 至 `data/mpf/json/` 與 **public/data/**（首頁圖表用）。

### 執行

```bash
npm run data:top10-funds-this-month
# 或：node scripts/top10-funds-this-month.mjs
```

**建議順序**：先跑 `data:merge-fund-price-months` 並 `cp fund_price_scheme.json public/data/`，再跑本腳本。Deploy 時 `.github/workflows/deploy.yml` 會先執行本腳本再 build，無需手動複製。

### 輸出結構（top10_funds_this_month.json）

```json
{
  "generatedAt": "ISO 時間",
  "thisMonth": "2025-12",
  "lastMonth": "2025-11",
  "top10": [
    {
      "rank": 1,
      "fund": "BEA Asian Equity Fund",
      "fundZh": "東亞亞洲股票基金",
      "trustee": "...",
      "scheme": "...",
      "priceThisMonth": 20.32,
      "priceLastMonth": 19.31,
      "changePercent": 5.23
    }
  ]
}
```

---

## 已知問題：部分 XLS 無法讀取

若某月 XLS 出現 **File is password-protected** 或 **Encryption scheme unsupported**：

- **原因**：該檔在 Excel 存檔時設了「結構保護」或使用較新加密，OLE metadata 為 `Security: 1`。腳本已對「唯讀」標準密碼 `VelvetSweatshop` 做重試；若仍報 **Encryption scheme unsupported**，表示 xlsx 開源版不支援該加密方式（見 [SheetJS #2963](https://git.sheetjs.com/sheetjs/sheetjs/issues/2963)）。
- **做法**：用 Excel 開啟該 XLS → 另存新檔 → 存檔時不要勾選「保護活頁簿」/「密碼」，再放回 `data/mpf/raw/` 重新執行腳本。

---

## 搜尋關鍵字（供 Agent / 文件搜尋）

- MPF data pipeline、xls-to-json、split-trustees-schemes、split-fund-price-scheme、generate-all-trustees-schemes、top10-funds-this-month、xlsx
- Consolidated list、trustee、scheme、unit price、fund price scheme、本月表現最佳基金、top10
- data/mpf/raw、data/mpf/json、trustees_schemes.json、fund_price_scheme.json、fund_price_scheme_YYYY-MM.json、top10_funds_this_month.json
- forward-fill、en/zh、name en zh
