import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_DIR = path.join(__dirname, "..", "data", "mpf", "json");
const CONSOLIDATED_PREFIX = "Consolidated_list_for_";
const TRUSTEES_SCHEMES_FILENAME = "trustees_schemes.json";

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

/** Build unique (trustee, scheme) pairs as nested { name, en, zh }. */
const uniqueTrusteeSchemePairs = (data) => {
  const seen = new Set();
  const pairs = [];
  for (const row of data) {
    const key = `${row.trusteeEn ?? ""}\t${row.schemeEn ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const trusteeEn = row.trusteeEn ?? null;
    const trusteeZh = row.trusteeZh ?? null;
    const schemeEn = row.schemeEn ?? null;
    const schemeZh = row.schemeZh ?? null;
    pairs.push({
      trustee: {
        name: trusteeEn,
        en: trusteeEn,
        zh: trusteeZh,
      },
      scheme: {
        name: schemeEn,
        en: schemeEn,
        zh: schemeZh,
      },
    });
  }
  return pairs;
};

/** Check: no row may have null trusteeEn or schemeEn (no scheme with null trustee). */
const checkNoSchemeWithNullTrustee = (data) => {
  const bad = data.filter((row) => row.trusteeEn == null || row.schemeEn == null);
  if (bad.length > 0) {
    const sample = bad.slice(0, 3).map((r) => ({ trusteeEn: r.trusteeEn, schemeEn: r.schemeEn, fund: r.fund }));
    throw new Error(
      `Check failed: ${bad.length} row(s) have null trusteeEn or schemeEn. Sample: ${JSON.stringify(sample)}`
    );
  }
};

const run = () => {
  const consolidatedPath = getLatestConsolidatedPath();
  const payload = JSON.parse(fs.readFileSync(consolidatedPath, "utf8"));

  if (!Array.isArray(payload.data)) {
    throw new Error("Consolidated JSON has no data array");
  }

  const filled = forwardFillTrusteeScheme(payload.data);
  checkNoSchemeWithNullTrustee(filled);

  const pairs = uniqueTrusteeSchemePairs(filled);
  const trusteesSchemesPath = path.join(JSON_DIR, TRUSTEES_SCHEMES_FILENAME);
  const trusteesPayload = {
    source: path.basename(consolidatedPath),
    exportedAt: new Date().toISOString(),
    count: pairs.length,
    data: pairs,
  };
  fs.writeFileSync(trusteesSchemesPath, JSON.stringify(trusteesPayload, null, 2), "utf8");
  console.log(`Wrote ${pairs.length} unique (trustee, scheme) to ${trusteesSchemesPath}`);

  payload.data = filled;
  payload.exportedAt = new Date().toISOString();
  fs.writeFileSync(consolidatedPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Updated ${consolidatedPath} with forward-filled trustee/scheme`);

  console.log("Check passed: no scheme has null trustee.");
};

run();
