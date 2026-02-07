import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

interface Top10Fund {
  rank: number;
  fund: string;
  fundZh: string | null;
  trustee: string;
  scheme: string;
  priceThisMonth: number;
  priceLastMonth: number;
  changePercent: number;
}

interface Top10Payload {
  thisMonth: string;
  lastMonth: string;
  top10: Top10Fund[];
}

/** 冠亞季 emoji */
const MEDALS = ["🥇", "🥈", "🥉"] as const;

/** 暫時改為 true 時只顯示示範數據，不載入真實 JSON */
const USE_DEMO_DATA = false;

/** 暫時改為 true 時只顯示排名 1–5，6–10 隱藏 */
const SHOW_ONLY_TOP_5 = true;

/** 示範數據：當月前 10 增長由負數至正數，用於測試圖表有無走位 */
const DEMO_TOP10_PAYLOAD: Top10Payload = {
  thisMonth: "2025-12",
  lastMonth: "2025-11",
  top10: [
    { rank: 1, fund: "Demo Fund A", fundZh: "示範基金 A", trustee: "Demo", scheme: "Demo", priceThisMonth: 105, priceLastMonth: 100, changePercent: 5 },
    { rank: 2, fund: "Demo Fund B", fundZh: "示範基金 B", trustee: "Demo", scheme: "Demo", priceThisMonth: 104, priceLastMonth: 100, changePercent: 4 },
    { rank: 3, fund: "Demo Fund C", fundZh: "示範基金 C", trustee: "Demo", scheme: "Demo", priceThisMonth: 103, priceLastMonth: 100, changePercent: 3 },
    { rank: 4, fund: "Demo Fund D", fundZh: "示範基金 D", trustee: "Demo", scheme: "Demo", priceThisMonth: 102, priceLastMonth: 100, changePercent: 2 },
    { rank: 5, fund: "Demo Fund E", fundZh: "示範基金 E", trustee: "Demo", scheme: "Demo", priceThisMonth: 101, priceLastMonth: 100, changePercent: 1 },
    { rank: 6, fund: "Demo Fund F", fundZh: "示範基金 F", trustee: "Demo", scheme: "Demo", priceThisMonth: 100, priceLastMonth: 100, changePercent: 0 },
    { rank: 7, fund: "Demo Fund G", fundZh: "示範基金 G", trustee: "Demo", scheme: "Demo", priceThisMonth: 99, priceLastMonth: 100, changePercent: -1 },
    { rank: 8, fund: "Demo Fund H", fundZh: "示範基金 H", trustee: "Demo", scheme: "Demo", priceThisMonth: 97, priceLastMonth: 100, changePercent: -3 },
    { rank: 9, fund: "Demo Fund I", fundZh: "示範基金 I", trustee: "Demo", scheme: "Demo", priceThisMonth: 95, priceLastMonth: 100, changePercent: -5 },
    { rank: 10, fund: "Demo Fund J", fundZh: "示範基金 J", trustee: "Demo", scheme: "Demo", priceThisMonth: 93, priceLastMonth: 100, changePercent: -7 },
  ],
};

/** 頭三名用金銀銅色，其餘用較淡灰 */
const BAR_COLORS = [
  "#ca8a04", /* 1 金 */
  "#94a3b8", /* 2 銀 */
  "#b45309", /* 3 銅 */
  "#cbd5e1",
  "#cbd5e1",
  "#cbd5e1",
  "#cbd5e1",
  "#cbd5e1",
  "#cbd5e1",
  "#cbd5e1",
];

const FundChart = () => {
  const [top10Payload, setTop10Payload] = useState<Top10Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_DEMO_DATA) {
      setTop10Payload(DEMO_TOP10_PAYLOAD);
      setError("demo");
      setLoading(false);
      return;
    }

    const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

    const fetchTop10 = async () => {
      try {
        const res = await fetch(`${base}/data/top10_funds_this_month.json`);
        if (!res.ok) throw new Error("top10_funds_this_month.json not found");
        const json = (await res.json()) as Top10Payload;
        setTop10Payload(json);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load top10");
        setTop10Payload(DEMO_TOP10_PAYLOAD);
      } finally {
        setLoading(false);
      }
    };

    void fetchTop10();
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

  if (!top10Payload?.top10?.length) {
    return (
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"
        role="alert"
      >
        <p className="font-medium">無法載入數據</p>
        {error && <p className="text-sm">{error}</p>}
        <p className="mt-2 text-sm">請確認已執行 top10 腳本並將 JSON 放在 public/data。</p>
      </div>
    );
  }

  const top10 = top10Payload.top10;
  const visibleTop10 = SHOW_ONLY_TOP_5 ? top10.slice(0, 5) : top10;
  const chartData = visibleTop10.map((item) => ({
    ...item,
    label: `#${item.rank}`, // category key for bar; display uses custom tick
    medal: item.rank <= 3 ? MEDALS[item.rank - 1] : "",
  }));

  const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  const lastVisible = chartData[chartData.length - 1];
  const minPct = Math.min(...chartData.map((d) => d.changePercent));
  const maxPct = Math.max(...chartData.map((d) => d.changePercent));
  const xDomainMin =
    minPct < 0 ? Math.floor(minPct) - 0.5 : Math.floor((lastVisible?.changePercent ?? 0) / 2);
  const xDomainMax = Math.ceil(maxPct * 1.1);

  const renderMedal = (props: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; value?: string | number; payload?: (typeof chartData)[0] }) => {
    const { x = 0, y = 0, width = 0, value, payload } = props;
    const medal = (value != null ? String(value) : payload?.medal) || "";
    if (!medal) return null;
    const numX = typeof x === "number" ? x : 0;
    const numY = typeof y === "number" ? y : 0;
    const numW = typeof width === "number" ? width : 0;
    return (
      <g aria-hidden>
        <text
          x={numX + numW + 6}
          y={numY + (typeof props.height === "number" ? props.height / 2 : 12)}
          textAnchor="start"
          fontSize={18}
          fill="#374151"
          dominantBaseline="middle"
        >
          {medal}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-2">
      {error && (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
          role="status"
          aria-live="polite"
        >
          以下為示範數據（由負數至正數），非真實數據。
        </p>
      )}
      <p className="text-sm text-slate-600">
        本月（{top10Payload.thisMonth}）較上月（{top10Payload.lastMonth}）回報百分比
      </p>
      <div
        className="h-96 w-full"
        role="img"
        aria-label="本月表現前10基金排名與百分比長條圖"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis
              type="number"
              dataKey="changePercent"
              tickFormatter={(v) => `${v}%`}
              stroke="#64748b"
              fontSize={12}
              domain={[xDomainMin, xDomainMax]}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={240}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={(props) => {
                const { x, y, index } = props;
                const row = chartData[index];
                const detailHref = row
                  ? `${base}/funds/detail?fund=${encodeURIComponent(row.fund)}`
                  : "#";
                const line1 = row?.fundZh ?? row?.fund ?? "";
                const line2 = row?.fundZh ? row.fund : "";
                return (
                  <g transform={`translate(${x},${y})`}>
                    <foreignObject x={-236} y={-14} width={236} height={36}>
                      <div
                        className="text-end text-[12px] leading-tight"
                        {...({ xmlns: "http://www.w3.org/1999/xhtml" } as React.HTMLAttributes<HTMLDivElement>)}
                      >
                        <a
                          href={detailHref}
                          className="block text-slate-600 no-underline hover:text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 rounded"
                          aria-label={`查看 ${line1} ${line2 ? `(${line2})` : ""} 詳情`}
                        >
                          <span className="block font-medium text-slate-800">
                            {line1}
                          </span>
                          {line2 ? (
                            <span className="block text-[11px] text-slate-500">
                              {line2}
                            </span>
                          ) : null}
                        </a>
                      </div>
                    </foreignObject>
                  </g>
                );
              }}
            />
            <Tooltip
              formatter={(value: number) => [`${value?.toFixed(2) ?? 0}%`, "本月較上月"]}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as (typeof chartData)[0] | undefined;
                return p ? `${p.fundZh ?? p.fund}` : "";
              }}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="changePercent" name="百分比" radius={[0, 4, 4, 0]} barSize={24}>
              <LabelList dataKey="medal" content={renderMedal} position="right" />
              {chartData.map((row, index) => (
                <Cell key={index} fill={BAR_COLORS[row.rank - 1] ?? "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FundChart;
