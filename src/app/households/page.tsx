'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { shell, main, topbar, btnPrimary, btnSm, statRow, stat, tableCard, tableHead, tableRow } from '@/lib/styles';
import Modal from '@/components/Modal';
import UploadExcel from '@/components/UploadExcel';
import Toast from '@/components/Toast';
import { useToast } from '@/components/useToast';

interface Household {
  id: number;
  name: string;
  income: number | null;
  net_worth: number | null;
  risk_tolerance: string | null;
  member_count: number;
  account_count: number;
}

// ── badge ────────────────────────────────────────────────────────────────────
const badgeBase = 'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap max-w-40 overflow-hidden text-ellipsis';
const badgeVariant: Record<string, string> = {
  blue:  'bg-bg-info text-text-info',
  amber: 'bg-[#FAEEDA] text-[#854F0B]',
  green: 'bg-[#EAF3DE] text-[#3B6D11]',
  gray:  'bg-bg-secondary text-text-secondary border border-border-subtle',
};
function riskVariant(risk: string | null): string {
  if (!risk) return badgeVariant.gray;
  const r = risk.toLowerCase();
  if (r === 'low') return badgeVariant.green;
  if (r === 'moderate' || r === 'medium') return badgeVariant.amber;
  return badgeVariant.blue;
}

const PAGE_SIZE = 5;

export default function HouseholdsPage() {
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [avgNetWorth, setAvgNetWorth]     = useState(0);
  const [totalMembers, setTotalMembers]   = useState(0);
  const { toasts, showToast, removeToast } = useToast();

  const fetchHouseholds = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/households?page=${p}&limit=${PAGE_SIZE}`);
      const data = await res.json();
      setHouseholds(data.rows ?? []);
      setTotal(data.total ?? 0);
      setTotalNetWorth(data.totalNetWorth ?? 0);
      setAvgNetWorth(data.avgNetWorth ?? 0);
      setTotalMembers(data.totalMembers ?? 0);
    } catch {
      showToast('Failed to load households', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchHouseholds(page); }, [fetchHouseholds, page]);

  const fmt = (amount: number | null) => {
    if (!amount || amount > 1e12) return '—';
    if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1) + 'M';
    if (amount >= 1_000)     return '$' + (amount / 1_000).toFixed(0) + 'K';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={shell}>
      <Sidebar />

      <div className={main}>
        {/* Topbar */}
        <div className={topbar}>
          <div>
            <div className="text-[11px] text-text-secondary mb-0.5">Overview</div>
            <h1 className="text-[15px] font-medium text-text-primary">All Households</h1>
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary} onClick={() => setShowExcelModal(true)}>+ Upload Excel</button>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto py-5 px-6">
          {/* Stats */}
          <div className={statRow}>
            {[
              { label: 'Households',    val: total,             green: false },
              { label: 'Total AUM',     val: fmt(totalNetWorth), green: true  },
              { label: 'Avg net worth', val: fmt(avgNetWorth),   green: false },
              { label: 'Members',       val: totalMembers,       green: false },
            ].map(({ label, val, green }) => (
              <div key={label} className={stat}>
                <div className="text-[11px] text-text-secondary">{label}</div>
                <div className={`text-[20px] font-medium mt-1 ${green ? 'text-green' : 'text-text-primary'}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-text-secondary text-[13px]">Loading households…</div>
          ) : total === 0 ? (
            <div className="py-12 text-center text-text-secondary text-[13px]">No households yet. Upload an Excel file to get started.</div>
          ) : (
            <>
              <div className={tableCard}>
                <div className={tableHead}>
                  {['Household', 'Income', 'Net Worth', 'Members', 'Accounts', 'Risk'].map(h => (
                    <div key={h}>{h}</div>
                  ))}
                </div>
                {households.map((h) => (
                  <Link
                    key={h.id}
                    href={`/households/${h.id}`}
                    className={tableRow}
                  >
                    <div className="text-[12px] text-text-primary font-medium">{h.name}</div>
                    <div className="text-[12px] text-green">{fmt(h.income)}</div>
                    <div className="text-[12px] text-green">{fmt(h.net_worth)}</div>
                    <div className="text-[12px] text-text-secondary">{h.member_count}</div>
                    <div className="text-[12px] text-text-secondary">{h.account_count}</div>
                    <div className="text-[12px]">
                      {h.risk_tolerance
                        ? <span className={`${badgeBase} ${riskVariant(h.risk_tolerance)}`}>{h.risk_tolerance}</span>
                        : <span className="text-text-secondary">—</span>}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[12px] text-text-secondary">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className={btnSm}
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                    >
                      ← Prev
                    </button>
                    <span className="flex items-center px-3 text-[12px] text-text-secondary">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      className={btnSm}
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showExcelModal} onClose={() => setShowExcelModal(false)} title="Upload Excel File">
        <UploadExcel
          onSuccess={(msg) => { showToast(msg, 'success'); setShowExcelModal(false); setPage(0); fetchHouseholds(0); }}
          onError={(msg) => showToast(msg, 'error')}
          onClose={() => setShowExcelModal(false)}
        />
      </Modal>

{toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
