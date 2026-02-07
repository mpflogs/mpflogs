import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FundEntry, UnitPriceEntry } from "../types/mpf";

const chartDataFromUnitPrice = (list: UnitPriceEntry[]): { month: string; price: number }[] =>
  list
    .filter((e): e is UnitPriceEntry & { price: number } => e.price != null && typeof e.price === "number")
    .map(({ month, price }) => ({ month, price }));

const isUnitPriceList = (up: FundEntry["unitPrice"]): up is UnitPriceEntry[] =>
  Array.isArray(up) && up.length > 0 && typeof (up as UnitPriceEntry[])[0] === "object";

interface FundDetailBlockProps {
  fund: FundEntry;
  /** Optional heading id for a11y */
  headingId?: string;
}

const FundDetailBlock = ({ fund, headingId = "fund-detail-block-heading" }: FundDetailBlockProps) => {
  const hasList = isUnitPriceList(fund.unitPrice);
  const list = hasList ? (fund.unitPrice as UnitPriceEntry[]) : [];
  const chartData = hasList ? chartDataFromUnitPrice(list) : [];
  const hasSinglePrice = !hasList && typeof fund.unitPrice === "number";

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="mb-4 text-xl font-semibold text-slate-800">
        {fund.zh || fund.fund}
      </h2>
      {fund.zh && fund.fund !== fund.zh && (
        <p className="mb-4 text-slate-600">{fund.fund}</p>
      )}

      {chartData.length > 0 && (
        <section aria-labelledby={`${headingId}-chart`}>
          <h3 id={`${headingId}-chart`} className="mb-2 text-sm font-medium text-slate-700">
            單位價格走勢
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), "單位價格"]}
                  labelFormatter={(label) => `月份：${label}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line type="monotone" dataKey="price" name="單位價格" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="mt-4" aria-labelledby={`${headingId}-data`}>
        <h3 id={`${headingId}-data`} className="mb-2 text-sm font-medium text-slate-700">
          單位價格數據
        </h3>
        {hasList && list.length > 0 ? (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 text-sm">
            <table className="w-full border-collapse" role="table" aria-labelledby={`${headingId}-data`}>
              <thead className="sticky top-0 z-10 bg-slate-100/95">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                    月份
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                    單位價格
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                    變動百分比
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[...list].reverse().map(({ month, price }, i, reversed) => {
                  const prevPrice = reversed[i + 1]?.price ?? null;
                  const changePercent =
                    prevPrice != null &&
                    typeof prevPrice === "number" &&
                    price != null &&
                    typeof price === "number" &&
                    prevPrice !== 0
                      ? ((price - prevPrice) / prevPrice) * 100
                      : null;
                  return (
                    <tr key={month} className="border-t border-slate-200/80 first:border-t-0">
                      <td className="px-3 py-1.5">{month}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {price != null
                          ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                          : "—"}
                      </td>
                      <td
                        className={`px-3 py-1.5 text-right tabular-nums ${
                          changePercent === null
                            ? "text-slate-500"
                            : changePercent > 0
                              ? "text-emerald-600"
                              : changePercent < 0
                                ? "text-rose-600"
                                : "text-slate-600"
                        }`}
                      >
                        {changePercent === null
                          ? "—"
                          : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : hasSinglePrice ? (
          <p className="text-slate-700">
            單位價格：{(fund.unitPrice as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
        ) : (
          <p className="text-slate-500">暫無單位價格數據</p>
        )}
      </section>
    </article>
  );
};

export default FundDetailBlock;
