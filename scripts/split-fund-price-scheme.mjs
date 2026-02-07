import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_DIR = path.join(__dirname, "..", "data", "mpf", "json");
const CONSOLIDATED_PREFIX = "Consolidated_list_for_";
const FUND_PRICE_SCHEME_FILENAME = "fund_price_scheme.json";

const MONTH_ORDER = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/** Parse "Consolidated_list_for_Dec_25_Read_Only.json" -> { year: 2025, month: 12 } */
const parseFilename = (filename) => {
  const match = filename.match(/Consolidated_list_for_(\w+)_(\d+)_Read_Only\.json$/i);
  if (!match) return null;
  const [, monthStr, yy] = match;
  const month = MONTH_ORDER[monthStr];
  if (!month) return null;
  const year = 2000 + Number.parseInt(yy, 10);
  return { year, month };
};

/** Pick the latest Consolidated_list_*.json by (year, month). */
const getLatestConsolidatedPath = () => {
  const files = fs.readdirSync(JSON_DIR).filter((f) => f.startsWith(CONSOLIDATED_PREFIX) && f.endsWith(".json"));
  const withDate = files
    .map((f) => ({ name: f, parsed: parseFilename(f) }))
    .filter((x) => x.parsed);
  if (withDate.length === 0) {
    throw new Error(`No ${CONSOLIDATED_PREFIX}*.json found in ${JSON_DIR}`);
  }
  withDate.sort((a, b) => {
    const pa = a.parsed;
    const pb = b.parsed;
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.month - pb.month;
  });
  const latest = withDate[withDate.length - 1];
  return path.join(JSON_DIR, latest.name);
};

/** Forward-fill trustee/scheme (en + zh): when null, use previous row's value. */
const forwardFillTrusteeScheme = (data) => {
  let last = { trusteeEn: null, trusteeZh: null, schemeEn: null, schemeZh: null };
  return data.map((row) => {
    if (row.trusteeEn != null && row.trusteeEn !== "") last.trusteeEn = row.trusteeEn;
    if (row.trusteeZh != null && row.trusteeZh !== "") last.trusteeZh = row.trusteeZh;
    if (row.schemeEn != null && row.schemeEn !== "") last.schemeEn = row.schemeEn;
    if (row.schemeZh != null && row.schemeZh !== "") last.schemeZh = row.schemeZh;
    return {
      ...row,
      trusteeEn: row.trusteeEn ?? last.trusteeEn,
      trusteeZh: row.trusteeZh ?? last.trusteeZh,
      schemeEn: row.schemeEn ?? last.schemeEn,
      schemeZh: row.schemeZh ?? last.schemeZh,
      trustee: row.trustee ?? last.trusteeEn ?? row.trusteeEn ?? last.trusteeEn,
      scheme: row.scheme ?? last.schemeEn ?? row.schemeEn ?? last.schemeEn,
    };
  });
};

/** Group rows by (trusteeEn, schemeEn) into { trustee, scheme, funds[] }. */
const buildFundPriceByScheme = (data) => {
  const map = new Map();
  for (const row of data) {
    const trusteeEn = row.trusteeEn ?? "";
    const schemeEn = row.schemeEn ?? "";
    const key = `${trusteeEn}\t${schemeEn}`;
    if (!map.has(key)) {
      map.set(key, {
        trustee: {
          name: row.trusteeEn ?? null,
          en: row.trusteeEn ?? null,
          zh: row.trusteeZh ?? null,
        },
        scheme: {
          name: row.schemeEn ?? null,
          en: row.schemeEn ?? null,
          zh: row.schemeZh ?? null,
        },
        funds: [],
      });
    }
    map.get(key).funds.push({
      fund: row.fund ?? null,
      zh: row.fundZh ?? null,
      unitPrice: row.unitPrice,
      notes: row.notes ?? null,
    });
  }
  return Array.from(map.values());
};

const run = () => {
  const consolidatedPath = getLatestConsolidatedPath();
  const payload = JSON.parse(fs.readFileSync(consolidatedPath, "utf8"));

  if (!Array.isArray(payload.data)) {
    throw new Error("Consolidated JSON has no data array");
  }

  const filled = forwardFillTrusteeScheme(payload.data);
  const data = buildFundPriceByScheme(filled);

  const outPath = path.join(JSON_DIR, FUND_PRICE_SCHEME_FILENAME);
  const outPayload = {
    source: path.basename(consolidatedPath),
    exportedAt: new Date().toISOString(),
    count: data.length,
    data,
  };
  fs.writeFileSync(outPath, JSON.stringify(outPayload, null, 2), "utf8");
  const totalFunds = data.reduce((acc, item) => acc + item.funds.length, 0);
  console.log(`Wrote ${data.length} schemes, ${totalFunds} fund prices to ${outPath}`);
};

run();
