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

const FILE_PATTERN = /^Consolidated_list_for_(\w+)_(\d+)_Read_Only\.(xls|xlsx)$/i;

/** Parse "Consolidated_list_for_Dec_25_Read_Only.xls(x)" -> { year, month } */
const parseFilename = (filename) => {
  const match = filename.match(FILE_PATTERN);
  if (!match) return null;
  const [, monthStr, yy] = match;
  const month = MONTH_ORDER[monthStr];
  if (!month) return null;
  const year = 2000 + Number.parseInt(yy, 10);
  return { year, month };
};

/** All XLS/XLSX paths in RAW_DIR, sorted by (year, month). */
const getAllRawPaths = () => {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".xls") || f.endsWith(".xlsx"));
  const withDate = files
    .map((f) => ({ name: f, parsed: parseFilename(f) }))
    .filter((x) => x.parsed);
  withDate.sort((a, b) => {
    const pa = a.parsed;
    const pb = b.parsed;
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.month - pb.month;
  });
  return withDate.map((x) => path.join(RAW_DIR, x.name));
};

/** Skip first N rows (title + header rows); data starts after. */
const SKIP_ROWS = 5;

/** Column indices in sheet: A=0, B=1, C=2, D=3, E=4. English row then Chinese row alternate. */
const COL = { trustee: 0, scheme: 1, fund: 2, unitPrice: 3, notes: 4 };

/** Excel "read-only" / structure protection uses standard password (SheetJS #2963). */
const XLS_STANDARD_PASSWORD = "VelvetSweatshop";

/** Read workbook; try standard password if protected. */
const readWorkbook = (filePath) => {
  try {
    return XLSX.readFile(filePath);
  } catch (err) {
    if (err.message && err.message.includes("password-protected")) {
      return XLSX.readFile(filePath, { password: XLS_STANDARD_PASSWORD });
    }
    throw err;
  }
};

/** Convert one XLS/XLSX to data array. */
const convertSheetToData = (workbook) => {
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

/** Base name without .xls or .xlsx for JSON output. */
const getJsonBaseName = (filePath) => {
  const name = path.basename(filePath);
  if (name.endsWith(".xlsx")) return name.slice(0, -5);
  if (name.endsWith(".xls")) return name.slice(0, -4);
  return name;
};

const run = () => {
  const allPaths = getAllRawPaths();
  if (allPaths.length === 0) {
    throw new Error(`No matching XLS/XLSX files in ${RAW_DIR}`);
  }

  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR, { recursive: true });
  }

  let ok = 0;
  const skipped = [];

  for (const rawPath of allPaths) {
    const baseName = getJsonBaseName(rawPath);
    const jsonPath = path.join(JSON_DIR, `${baseName}.json`);
    try {
      const workbook = readWorkbook(rawPath);
      const { data, sheetName } = convertSheetToData(workbook);
      const payload = {
        source: path.basename(rawPath),
        sheet: sheetName,
        exportedAt: new Date().toISOString(),
        rowCount: data.length,
        data,
      };
      fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
      console.log(`Wrote ${data.length} rows → ${path.basename(jsonPath)}`);
      ok++;
    } catch (err) {
      const msg =
        err.message && err.message.includes("Encryption scheme unsupported")
          ? "不支援的保護/加密；請用 Excel 另存為並取消保護"
          : err.message;
      console.warn(`Skip ${path.basename(rawPath)}: ${msg}`);
      skipped.push(path.basename(rawPath));
    }
  }

  console.log(`Done. ${ok}/${allPaths.length} file(s) converted.${skipped.length ? ` Skipped: ${skipped.join(", ")}` : ""}`);
};

run();
