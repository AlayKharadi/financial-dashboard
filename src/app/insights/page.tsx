// app/insights/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { shell, main, topbar, statRow, stat, chartGrid, chartCard, chartTitle } from '@/lib/styles';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend,
  ScatterChart, Scatter, CartesianGrid,
} from 'recharts';

const PALETTE = ['#378ADD', '#E2856A', '#BA7517', '#1D9E75', '#7F77DD', '#94a3b8'];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#0f172a',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

function fmt(num: number) {
  if (!num || num > 1e12) return '—';
  if (num >= 1_000_000) return '$' + (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return '$' + (num / 1_000).toFixed(0) + 'K';
  return '$' + num.toLocaleString();
}

// ── Horizontal bar chart ──────────────────────────────────────────────────────
function HBarChart({
  data, color, valueFormatter = fmt,
}: {
  data: { name: string; value: number }[];
  color: string;
  valueFormatter?: (v: number) => string;
}) {
  const height = Math.max(data.length * 40, 160);
  const maxVal = Math.max(...data.map(d => d.value));
  const yAxisWidth = Math.min(Math.max(...data.map(d => Math.min(d.name.length, 22))) * 7 + 8, 160);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
          <YAxis
            dataKey="name"
            type="category"
            width={yAxisWidth}
            interval={0}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 21) + '…' : v}
          />
          <XAxis type="number" hide domain={[0, maxVal]} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [valueFormatter(Number(v)), '']}
            cursor={{ fill: '#f1f3f5' }}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data, nameKey }: { data: any[]; nameKey: string }) {
  const colored = data.map((d, i) => ({ ...d, fill: d.color ?? PALETTE[i % PALETTE.length] }));
  return (
    <ResponsiveContainer width="100%" height={220} minWidth={0}>
      <PieChart>
        <Pie
          data={colored}
          dataKey="count"
          nameKey={nameKey}
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          strokeWidth={0}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, name) => [v, name]}
        />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/insights')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={shell}>
        <Sidebar />
        <div className={`${main} items-center justify-center`}>
          <div className="text-text-secondary text-[13px]">Loading insights…</div>
        </div>
      </div>
    );
  }

  if (!data || data.totalHouseholds === 0) {
    return (
      <div className={shell}>
        <Sidebar />
        <div className={main}>
          <div className="flex items-center justify-center flex-1 px-5 text-center text-text-secondary text-[13px]">
            No data available yet.<br />Upload an Excel file on the Households page.
          </div>
        </div>
      </div>
    );
  }

  const netWorthItems = (data.netWorthByHousehold ?? []).map((d: any) => ({ name: d.name, value: d.value }));
  const incomeItems   = (data.incomeByHousehold ?? []).map((d: any) => ({ name: d.name, value: d.value }));
  const memberItems   = (data.memberCounts ?? []).map((d: any) => ({ name: d.name, value: d.members }));
  const custodianItems = (data.accountsByCustodian ?? [])
    .filter((d: any) => d.custodian?.toLowerCase() !== 'unknown')
    .map((d: any) => ({ name: d.custodian, value: d.count }));

  const riskItems      = (data.riskDistribution ?? []).map((d: any) => ({ name: d.risk,      count: d.count, color: d.color }));
  const accountTypeItems = (data.accountsByType ?? []).slice(0, 8).map((d: any, i: number) => ({ name: d.type, count: d.count, color: PALETTE[i % PALETTE.length] }));
  const objectiveItems = (data.investmentObjectives ?? []).map((d: any, i: number) => ({ name: d.objective, count: d.count, color: PALETTE[i % PALETTE.length] }));
  const scatterData    = (data.householdScatter ?? []) as { name: string; netWorth: number; income: number }[];

  return (
    <div className={shell}>
      <Sidebar />

      <div className={main}>
        {/* Topbar */}
        <div className={topbar}>
          <div>
            <div className="text-[11px] text-text-secondary mb-0.5">Analytics</div>
            <h1 className="text-[15px] font-medium text-text-primary">Portfolio Insights</h1>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto py-5 px-6">

          {/* Stats */}
          <div className={statRow}>
            {[
              { label: 'Total AUM',     val: fmt(data.totalNetWorth), green: true  },
              { label: 'Households',    val: data.totalHouseholds,    green: false },
              { label: 'Avg net worth', val: fmt(data.avgNetWorth),   green: false },
              { label: 'Avg income',    val: fmt(data.avgIncome),     green: false },
            ].map(({ label, val, green }) => (
              <div key={label} className={stat}>
                <div className="text-[11px] text-text-secondary">{label}</div>
                <div className={`text-[20px] font-medium mt-1 ${green ? 'text-green' : 'text-text-primary'}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className={chartGrid}>

            {netWorthItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Net worth by household</div>
                <HBarChart data={netWorthItems} color="#378ADD" />
              </div>
            )}

            {incomeItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Income by household</div>
                <HBarChart data={incomeItems} color="#1D9E75" />
              </div>
            )}

            {scatterData.length > 1 && (
              <div className={`${chartCard} lg:col-span-2`}>
                <div className={chartTitle}>Net worth vs. income</div>
                <ResponsiveContainer width="100%" height={260} minWidth={0}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="income"
                      type="number"
                      name="Income"
                      tickFormatter={fmt}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Income', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#94a3b8' }}
                    />
                    <YAxis
                      dataKey="netWorth"
                      type="number"
                      name="Net Worth"
                      tickFormatter={fmt}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                      label={{ value: 'Net Worth', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={tooltipStyle}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
                            <div style={{ color: '#64748b' }}>Income: <span style={{ color: '#0f172a' }}>{fmt(d.income)}</span></div>
                            <div style={{ color: '#64748b' }}>Net worth: <span style={{ color: '#0f172a' }}>{fmt(d.netWorth)}</span></div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} fill="#378ADD" opacity={0.75} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {riskItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Risk tolerance</div>
                <DonutChart data={riskItems} nameKey="name" />
              </div>
            )}

            {accountTypeItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Account types</div>
                <DonutChart data={accountTypeItems} nameKey="name" />
              </div>
            )}

            {objectiveItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Investment objectives</div>
                <DonutChart data={objectiveItems} nameKey="name" />
              </div>
            )}

            {memberItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Members per household</div>
                <HBarChart data={memberItems} color="#7F77DD" valueFormatter={(v) => String(v)} />
              </div>
            )}

            {custodianItems.length > 0 && (
              <div className={chartCard}>
                <div className={chartTitle}>Accounts by custodian</div>
                <HBarChart data={custodianItems} color="#E2856A" valueFormatter={(v) => `${v} accts`} />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
