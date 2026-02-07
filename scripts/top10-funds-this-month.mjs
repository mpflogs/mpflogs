/**
 * 選出 10 隻本月表現最好基金：用本月價格與上個月比較百分比，輸出 JSON。
 * 讀取 fund_price_scheme.json（unitPrice 為 [{ month, price }, ...]），
 * 以資料中最後一個月份為「本月」、倒數第二個月份為「上個月」，計算每檔基金的月變動百分比，
 * 依百分比由高到低排序，取前 10 名，寫入 top10_funds_this_month.json。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_DIR = path.join(__dirname, "..", "data", "mpf", "json");
const PUBLIC_DATA = path.join(__dirname, "..", "public", "data");
const INPUT_FILENAME = "fund_price_scheme.json";
const OUTPUT_FILENAME = "top10_funds_this_month.json";
const TOP_N = 10;

/** 取得 fund_price_scheme.json 路徑（優先 data/mpf/json，其次 public/data） */
const getInputPath = () => {
  const inJson = path.join(JSON_DIR, INPUT_FILENAME);
  if (fs.existsSync(inJson)) return inJson;
  const inPublic = path.join(PUBLIC_DATA, INPUT_FILENAME);
  if (fs.existsSync(inPublic)) return inPublic;
  throw new Error(`Not found: ${INPUT_FILENAME} in ${JSON_DIR} or ${PUBLIC_DATA}`);
};

/** 從 unitPrice 陣列取出指定月份的價格 */
const getPriceForMonth = (unitPriceList, monthKey) => {
  if (!Array.isArray(unitPriceList)) return null;
  const entry = unitPriceList.find((e) => e && e.month === monthKey);
  if (!entry || typeof entry.price !== "number") return null;
  return entry.price;
};

const run = () => {
  const inputPath = getInputPath();
  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const months = payload.months ?? [];
  const data = payload.data ?? [];

  if (months.length < 2) {
    throw new Error(`Need at least 2 months in fund_price_scheme.json, got: ${months.length}`);
  }

  const thisMonthKey = months[months.length - 1];
  const lastMonthKey = months[months.length - 2];

  const allFunds = [];
  for (const entry of data) {
    const trusteeName = entry.trustee?.name ?? entry.trustee?.en ?? "";
    const schemeName = entry.scheme?.name ?? entry.scheme?.en ?? "";
    for (const fund of entry.funds ?? []) {
      const unitPriceList = fund.unitPrice;
      const priceThisMonth = getPriceForMonth(unitPriceList, thisMonthKey);
      const priceLastMonth = getPriceForMonth(unitPriceList, lastMonthKey);
      if (priceThisMonth == null || priceLastMonth == null || priceLastMonth === 0) continue;
      const changePercent = ((priceThisMonth - priceLastMonth) / priceLastMonth) * 100;
      allFunds.push({
        fund: fund.fund ?? "",
        fundZh: fund.zh ?? null,
        trustee: trusteeName,
        scheme: schemeName,
        priceThisMonth,
        priceLastMonth,
        changePercent,
      });
    }
  }

  allFunds.sort((a, b) => b.changePercent - a.changePercent);
  const top10 = allFunds.slice(0, TOP_N).map((item, index) => ({
    rank: index + 1,
    ...item,
  }));

  const outPayload = {
    generatedAt: new Date().toISOString(),
    thisMonth: thisMonthKey,
    lastMonth: lastMonthKey,
    top10,
  };

  const jsonStr = JSON.stringify(outPayload, null, 2);

  const outPath = path.join(JSON_DIR, OUTPUT_FILENAME);
  fs.mkdirSync(JSON_DIR, { recursive: true });
  fs.writeFileSync(outPath, jsonStr, "utf8");

  fs.mkdirSync(PUBLIC_DATA, { recursive: true });
  const publicPath = path.join(PUBLIC_DATA, OUTPUT_FILENAME);
  fs.writeFileSync(publicPath, jsonStr, "utf8");

  console.log(jsonStr);
  console.error(`Wrote top ${TOP_N} funds (${thisMonthKey} vs ${lastMonthKey}) to ${outPath} and ${publicPath}`);
};

run();
