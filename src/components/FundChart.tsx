import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "../lib/supabase";

export interface DataPoint {
  date: string;
  fundReturn?: number;
  indexReturn?: number;
}

/** Demo data when Supabase has no data yet. */
const DEMO_DATA: DataPoint[] = [
  { date: "2025-01", fundReturn: 0, indexReturn: 0 },
  { date: "2025-02", fundReturn: 1.2, indexReturn: 0.8 },
  { date: "2025-03", fundReturn: 2.1, indexReturn: 1.5 },
  { date: "2025-04", fundReturn: 1.8, indexReturn: 2.0 },
  { date: "2025-05", fundReturn: 3.2, indexReturn: 2.5 },
  { date: "2025-06", fundReturn: 2.5, indexReturn: 3.0 },
];

const FundChart = () => {
  const [data, setData] = useState<DataPoint[]>(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setIsDemoData(true);
        setLoading(false);
        return;
      }

      try {
        const { data: rows, error: err } = await supabase
          .from("fund_snapshots")
          .select("date, fund_return, index_return")
          .order("date", { ascending: true });

        if (err) {
          setError(err.message);
          setIsDemoData(true);
          setLoading(false);
          return;
        }

        if (rows && rows.length > 0) {
          setData(
            rows.map((r: { date: string; fund_return?: number; index_return?: number }) => ({
              date: r.date,
              fundReturn: r.fund_return,
              indexReturn: r.index_return,
            }))
          );
          setIsDemoData(false);
        } else {
          setIsDemoData(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setIsDemoData(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  if (loading) {
    return (
      <div
        className="flex h-80 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
        role="status"
        aria-label="載入圖表中"
      >
        載入圖表…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"
        role="alert"
      >
        <p className="font-medium">無法載入數據</p>
        <p className="text-sm">{error}</p>
        <p className="mt-2 text-sm font-medium">以下為示範數據，非真實數據。</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isDemoData && (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
          role="status"
          aria-live="polite"
        >
          以下為示範數據，非真實數據。
        </p>
      )}
      <div
        className="h-80 w-full"
        role="img"
        aria-label={isDemoData ? "基金與大市指數回報走勢圖（示範數據，非真實）" : "基金與大市指數回報走勢圖"}
      >
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, ""]}
            labelFormatter={(label) => `日期: ${label}`}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="fundReturn"
            name="基金回報"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="indexReturn"
            name="大市指數"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FundChart;
