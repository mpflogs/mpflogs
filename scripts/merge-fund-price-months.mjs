import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_DIR = path.join(__dirname, "..", "data", "mpf", "json");
const MONTHLY_PREFIX = "fund_price_scheme_";
const MONTHLY_SUFFIX = ".json";
const OUTPUT_FILENAME = "fund_price_scheme.json";

/** Parse "fund_price_scheme_2025-12.json" -> { year: 2025, month: 12, monthKey: "2025-12" } */
const parseMonthlyFilename = (filename) => {
  if (!filename.startsWith(MONTHLY_PREFIX) || !filename.endsWith(MONTHLY_SUFFIX)) return null;
  const key = filename.slice(MONTHLY_PREFIX.length, -MONTHLY_SUFFIX.length);
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  return { year, month, monthKey: key };
};

/** List all fund_price_scheme_YYYY-MM.json, sorted by (year, month) ascending. */
const getAllMonthKeys = () => {
  const files = fs.readdirSync(JSON_DIR).filter((f) => f.startsWith(MONTHLY_PREFIX) && f.endsWith(MONTHLY_SUFFIX));
  const withDate = files
    .map((f) => ({ name: f, parsed: parseMonthlyFilename(f) }))
    .filter((x) => x.parsed);
  withDate.sort((a, b) => {
    const pa = a.parsed;
    const pb = b.parsed;
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.month - pb.month;
  });
  return withDate.map((x) => ({ monthKey: x.parsed.monthKey, path: path.join(JSON_DIR, x.name) }));
};

/** Build map: key (trusteeName\tschemeName\tfundName) -> price */
const buildPriceMap = (data) => {
  const map = new Map();
  for (const entry of data) {
    const t = (entry.trustee?.name ?? "").trim();
    const s = (entry.scheme?.name ?? "").trim();
    for (const fund of entry.funds ?? []) {
      const f = (fund.fund ?? "").trim();
      const key = `${t}\t${s}\t${f}`;
      const price = fund.unitPrice;
      map.set(key, typeof price === "number" ? price : null);
    }
  }
  return map;
};

const key = (entry, fund) =>
  `${(entry.trustee?.name ?? "").trim()}\t${(entry.scheme?.name ?? "").trim()}\t${(fund.fund ?? "").trim()}`;

const run = () => {
  const allMonths = getAllMonthKeys();
  if (allMonths.length === 0) {
    throw new Error(`No ${MONTHLY_PREFIX}*${MONTHLY_SUFFIX} files in ${JSON_DIR}`);
  }

  const currentPath = path.join(JSON_DIR, OUTPUT_FILENAME);
  if (!fs.existsSync(currentPath)) {
    throw new Error(`Expected ${OUTPUT_FILENAME} (from split-fund-price-scheme) at ${currentPath}`);
  }

  const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
  const baseData = current.data ?? [];

  const monthPrices = [];
  for (const { monthKey, path: filePath } of allMonths) {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    monthPrices.push({ monthKey, map: buildPriceMap(payload.data ?? []) });
  }

  const mergedData = baseData.map((entry) => ({
    trustee: entry.trustee,
    scheme: entry.scheme,
    funds: (entry.funds ?? []).map((fund) => {
      const unitPriceList = monthPrices.map(({ monthKey, map }) => {
        const p = map.get(key(entry, fund));
        return { month: monthKey, price: p };
      });
      return {
        fund: fund.fund,
        zh: fund.zh ?? null,
        unitPrice: unitPriceList,
        notes: fund.notes ?? null,
      };
    }),
  }));

  const outPayload = {
    source: current.source,
    exportedAt: new Date().toISOString(),
    months: allMonths.map((x) => x.monthKey),
    count: mergedData.length,
    data: mergedData,
  };

  fs.writeFileSync(currentPath, JSON.stringify(outPayload, null, 2), "utf8");
  console.log(`Merged ${allMonths.length} month(s): ${allMonths.map((x) => x.monthKey).join(", ")} into ${OUTPUT_FILENAME} (unitPrice as list)`);
};

run();
