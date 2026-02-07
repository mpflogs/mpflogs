import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, "..", "data", "mpf", "raw");
const JSON_DIR = path.join(__dirname, "..", "data", "mpf", "json");

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

const SKIP_ROWS = 5;
const COL = { trustee: 0, scheme: 1, fund: 2, unitPrice: 3, notes: 4 };

const FILE_PATTERN = /^Consolidated_list_for_(\w+)_(\d+)_Read_Only\.(xls|xlsx)$/i;

/** Parse "Consolidated_list_for_Dec_25_Read_Only.xls(x)" -> { year, month, monthKey } */
const parseRawFilename = (filename) => {
  const match = filename.match(FILE_PATTERN);
  if (!match) return null;
  const [, monthStr, yy] = match;
  const month = MONTH_ORDER[monthStr];
  if (!month) return null;
  const year = 2000 + Number.parseInt(yy, 10);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return { year, month, monthKey };
};

/** All XLS/XLSX paths in RAW_DIR, sorted by (year, month). */
const getAllRawPaths = () => {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".xls") || f.endsWith(".xlsx"));
  const withDate = files
    .map((f) => ({ name: f, parsed: parseRawFilename(f) }))
    .filter((x) => x.parsed);
  withDate.sort((a, b) => {
    const pa = a.parsed;
    const pb = b.parsed;
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.month - pb.month;
  });
  return withDate.map((x) => ({ path: path.join(RAW_DIR, x.name), monthKey: x.parsed.monthKey }));
};

/** Excel "read-only" / structure protection uses standard password (SheetJS #2963). */
const XLS_STANDARD_PASSWORD = "VelvetSweatshop";

/** XLS/XLSX → data array (same logic as xls-to-json.mjs). Tries standard password if protected. */
const rawToData = (rawPath) => {
  let workbook;
  try {
    workbook = XLSX.readFile(rawPath);
  } catch (err) {
    if (err.message && err.message.includes("password-protected")) {
      workbook = XLSX.readFile(rawPath, { password: XLS_STANDARD_PASSWORD });
    } else {
      throw err;
    }
  }
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("Workbook has no sheets");
  const sheet = workbook.Sheets[firstSheetName];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  const rows = aoa.slice(SKIP_ROWS);
  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const v = row[COL.unitPrice];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const next = rows[i + 1];
    const trusteeEn = row[COL.trustee] ?? null;
    const schemeEn = row[COL.scheme] ?? null;
    const trusteeZh = next ? next[COL.trustee] ?? null : null;
    const schemeZh = next ? next[COL.scheme] ?? null : null;
    const fundZh = next ? next[COL.fund] ?? null : null;
    data.push({
      trusteeEn,
      trusteeZh,
      schemeEn,
      schemeZh,
      trustee: trusteeEn,
      scheme: schemeEn,
      fund: row[COL.fund] ?? null,
      fundZh: fundZh && String(fundZh).trim() !== "" ? fundZh : null,
      unitPrice: row[COL.unitPrice],
      notes: row[COL.notes] ?? null,
    });
  }
  return { data, sheetName: firstSheetName };
};

/** Forward-fill trustee/scheme (same as split-trustees-schemes.mjs). */
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

/** Unique (trustee, scheme) pairs as nested { name, en, zh }. */
const uniqueTrusteeSchemePairs = (data) => {
  const seen = new Set();
  const pairs = [];
  for (const row of data) {
    const key = `${row.trusteeEn ?? ""}\t${row.schemeEn ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      trustee: { name: row.trusteeEn ?? null, en: row.trusteeEn ?? null, zh: row.trusteeZh ?? null },
      scheme: { name: row.schemeEn ?? null, en: row.schemeEn ?? null, zh: row.schemeZh ?? null },
    });
  }
  return pairs;
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

const checkNoSchemeWithNullTrustee = (data) => {
  const bad = data.filter((row) => row.trusteeEn == null || row.schemeEn == null);
  if (bad.length > 0) {
    throw new Error(
      `Check failed: ${bad.length} row(s) have null trusteeEn or schemeEn. Sample: ${JSON.stringify(bad[0])}`
    );
  }
};

const run = () => {
  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  }

  const all = getAllRawPaths();
  if (all.length === 0) {
    throw new Error(`No matching XLS/XLSX files in ${RAW_DIR}`);
  }

  let ok = 0;
  const skipped = [];

  const getJsonBaseName = (filePath) => {
    const name = path.basename(filePath);
    if (name.endsWith(".xlsx")) return name.slice(0, -5);
    if (name.endsWith(".xls")) return name.slice(0, -4);
    return name;
  };

  for (const { path: rawPath, monthKey } of all) {
    try {
      const baseName = getJsonBaseName(rawPath);
      const consolidatedPath = path.join(JSON_DIR, `${baseName}.json`);
      const trusteesSchemesPath = path.join(JSON_DIR, `trustees_schemes_${monthKey}.json`);
      const fundPriceSchemePath = path.join(JSON_DIR, `fund_price_scheme_${monthKey}.json`);

      const { data, sheetName } = rawToData(rawPath);
      const filled = forwardFillTrusteeScheme(data);
      checkNoSchemeWithNullTrustee(filled);
      const pairs = uniqueTrusteeSchemePairs(filled);
      const fundPriceByScheme = buildFundPriceByScheme(filled);

      const consolidatedPayload = {
        source: path.basename(rawPath),
        sheet: sheetName,
        exportedAt: new Date().toISOString(),
        rowCount: filled.length,
        data: filled,
      };
      fs.writeFileSync(consolidatedPath, JSON.stringify(consolidatedPayload, null, 2), "utf8");

      const trusteesPayload = {
        source: baseName + ".json",
        monthKey,
        exportedAt: new Date().toISOString(),
        count: pairs.length,
        data: pairs,
      };
      fs.writeFileSync(trusteesSchemesPath, JSON.stringify(trusteesPayload, null, 2), "utf8");

      const fundPricePayload = {
        source: baseName + ".json",
        monthKey,
        exportedAt: new Date().toISOString(),
        count: fundPriceByScheme.length,
        data: fundPriceByScheme,
      };
      fs.writeFileSync(fundPriceSchemePath, JSON.stringify(fundPricePayload, null, 2), "utf8");

      console.log(`${monthKey}: ${filled.length} rows, ${pairs.length} (trustee,scheme), ${fundPriceByScheme.length} schemes → ${path.basename(trusteesSchemesPath)} + ${path.basename(fundPriceSchemePath)}`);
      ok++;
    } catch (err) {
      const msg =
        err.message && err.message.includes("Encryption scheme unsupported")
          ? "XLS 使用 xlsx 不支援的保護/加密；請用 Excel 另存為並取消保護後再試"
          : err.message;
      console.warn(`${monthKey} (${path.basename(rawPath)}): skip — ${msg}`);
      skipped.push(monthKey);
    }
  }

  console.log(`Done. ${ok}/${all.length} month(s) written.${skipped.length ? ` Skipped: ${skipped.join(", ")}` : ""}`);
};

run();
