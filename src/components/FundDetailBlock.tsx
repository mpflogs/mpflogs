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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card aria-labelledby={headingId}>
      <CardHeader>
        <CardTitle id={headingId}>
          {fund.zh || fund.fund}
        </CardTitle>
        {fund.zh && fund.fund !== fund.zh && (
          <p className="text-muted-foreground">{fund.fund}</p>
        )}
      </CardHeader>

      {chartData.length > 0 && (
        <CardContent className="pt-0">
          <section aria-labelledby={`${headingId}-chart`}>
            <h3 id={`${headingId}-chart`} className="mb-2 text-sm font-medium text-foreground">
              單位價格走勢
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), "單位價格"]}
                    labelFormatter={(label) => `月份：${label}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="price" name="單位價格" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </CardContent>
      )}

      <CardContent className="pt-0">
        <section aria-labelledby={`${headingId}-data`}>
          <h3 id={`${headingId}-data`} className="mb-2 text-sm font-medium text-foreground">
            單位價格數據
          </h3>
          {hasList && list.length > 0 ? (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-muted/50 text-sm">
              <table className="w-full border-collapse" role="table" aria-labelledby={`${headingId}-data`}>
                <thead className="sticky top-0 z-10 bg-muted/95">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      月份
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      單位價格
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      變動百分比
                    </th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
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
                      <tr key={month} className="border-t border-border first:border-t-0">
                        <td className="px-3 py-1.5">{month}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {price != null
                            ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                            : "—"}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right tabular-nums ${
                            changePercent === null
                              ? "text-muted-foreground"
                              : changePercent > 0
                                ? "text-foreground"
                                : changePercent < 0
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground"
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
            <p className="text-foreground">
              單位價格：{(fund.unitPrice as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </p>
          ) : (
            <p className="text-muted-foreground">暫無單位價格數據</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
};

export default FundDetailBlock;
