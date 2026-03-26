// app/insights/page.tsx
'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
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
      <div className="shell">
        <Sidebar />
        <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading insights...</div>
        </div>
      </div>
    );
  }

  if (!data || data.totalHouseholds === 0) {
    return (
      <div className="shell">
        <Sidebar />
        <div className="main">
          <div className="tabs">
            <Link href="/households" className="tab">Households</Link>
            <div className="tab active">Insights</div>
          </div>
          <div className="topbar">
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Analytics</div>
              <h1>Portfolio Insights</h1>
            </div>
          </div>
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No data available yet.<br />Upload an Excel file on the Households page.
          </div>
        </div>
      </div>
    );
  }

  const formatLarge = (num: number) => {
    if (!num || num > 1e12) return '—';
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    return '$' + num.toLocaleString();
  };

  return (
    <div className="shell">
      <Sidebar />

      <div className="main">
        <div className="tabs">
          <Link href="/households" className="tab">Households</Link>
          <div className="tab active">Insights</div>
        </div>

        <div className="topbar">
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Analytics</div>
            <h1>Portfolio Insights</h1>
          </div>
        </div>

        <div className="insights-body">
          <div className="stat-row">
            <div className="stat">
              <div className="stat-label">Total AUM</div>
              <div className="stat-val green">{formatLarge(data.totalNetWorth)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Households</div>
              <div className="stat-val">{data.totalHouseholds}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Avg net worth</div>
              <div className="stat-val">{formatLarge(data.avgNetWorth)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Avg income</div>
              <div className="stat-val">{formatLarge(data.avgIncome)}</div>
            </div>
          </div>

          <div className="chart-grid">
            {/* Net Worth */}
            {data.netWorthByHousehold?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Net worth by household</div>
                <div className="bar-group">
                  {data.netWorthByHousehold.map((item: any, i: number) => (
                    <div key={i} className="bar-item">
                      <div className="bar-label">
                        <span>{item.name}</span>
                        <span>{formatLarge(item.value)}</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${item.percent}%`, 
                            background: '#378ADD' 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Income */}
            {data.incomeByHousehold?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Income by household</div>
                <div className="bar-group">
                  {data.incomeByHousehold.map((item: any, i: number) => (
                    <div key={i} className="bar-item">
                      <div className="bar-label">
                        <span>{item.name}</span>
                        <span>{formatLarge(item.value)}</span>
                      </div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${item.percent}%`, 
                            background: '#1D9E75' 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members per Household */}
            {data.memberCounts?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Members per household</div>
                <div className="bar-group">
                  {(() => {
                    const max = Math.max(...data.memberCounts.map((h: any) => h.members), 1);
                    return data.memberCounts.map((item: any, i: number) => (
                      <div key={i} className="bar-item">
                        <div className="bar-label">
                          <span>{item.name}</span>
                          <span>{item.members}</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${Math.round((item.members / max) * 100)}%`, background: '#7F77DD' }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Accounts by Type — shows count, not value (per-account balances not in source data) */}
            {data.accountsByType?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Accounts by type</div>
                <div className="donut-row">
                  {data.accountsByType.map((item: any, i: number) => (
                    <div key={i} className="donut-item">
                      <div className="dot" style={{ background: '#378ADD' }} />
                      {item.type}
                      <div className="donut-val">{item.count} accounts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accounts by Custodian */}
            {data.accountsByCustodian?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Accounts by custodian</div>
                <div className="donut-row">
                  {data.accountsByCustodian.map((item: any, i: number) => (
                    <div key={i} className="donut-item">
                      <div className="dot" style={{ background: ['#378ADD', '#1D9E75', '#BA7517', '#7F77DD'][i % 4] }} />
                      {item.custodian}
                      <div className="donut-val">{item.count} accounts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Distribution */}
            {data.riskDistribution?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Risk tolerance distribution</div>
                <div className="donut-row">
                  {data.riskDistribution.map((item: any, i: number) => (
                    <div key={i} className="donut-item">
                      <div className="dot" style={{ background: item.color }} />
                      {item.risk}
                      <div className="donut-val">{item.count} households</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investment Objectives */}
            {data.investmentObjectives?.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Investment objectives</div>
                <div className="donut-row">
                  {data.investmentObjectives.map((item: any, i: number) => (
                    <div key={i} className="donut-item">
                      <div className="dot" style={{ background: ['#378ADD', '#1D9E75', '#BA7517', '#7F77DD'][i % 4] }} />
                      {item.objective}
                      <div className="donut-val">{item.count} households</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}