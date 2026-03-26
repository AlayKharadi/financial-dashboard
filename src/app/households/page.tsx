'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import UploadExcel from '@/components/UploadExcel';
import UploadAudio from '@/components/UploadAudio';
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

export default function HouseholdsPage() {
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const fetchHouseholds = useCallback(async () => {
    try {
      const res = await fetch('/api/households');
      const data = await res.json();
      setHouseholds(data);
    } catch {
      showToast('Failed to load households', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  const formatCurrency = (amount: number | null) => {
    if (!amount || amount > 1e12) return '—';
    if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const getRiskBadgeClass = (risk: string | null) => {
    if (!risk) return 'badge-gray';
    const r = risk.toLowerCase();
    if (r === 'low') return 'badge-green';
    if (r === 'moderate' || r === 'medium') return 'badge-amber';
    return 'badge-blue';
  };

  const totalHouseholds = households.length;
  const totalNetWorth = households.reduce((sum, h) => sum + Number(h.net_worth || 0), 0);
  const totalMembers = households.reduce((sum, h) => sum + Number(h.member_count || 0), 0);
  const avgNetWorth = totalHouseholds > 0 ? totalNetWorth / totalHouseholds : 0;

  return (
    <div className="shell">
      <Sidebar />

      <div className="main">
        <div className="tabs">
          <div className="tab active">Households</div>
          <Link href="/insights" className="tab">Insights</Link>
        </div>

        <div className="topbar">
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Overview</div>
            <h1>All Households</h1>
          </div>
          <div className="topbar-right">
            <button
              className="btn-sm"
              onClick={() => setShowAudioModal(true)}
            >
              Upload Audio
            </button>
            <button
              className="btn-sm btn-primary"
              onClick={() => setShowExcelModal(true)}
            >
              + Upload Excel
            </button>
          </div>
        </div>

        <div className="scroll-area">
          <div className="stat-row">
            <div className="stat">
              <div className="stat-label">Households</div>
              <div className="stat-val">{totalHouseholds}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Total AUM</div>
              <div className="stat-val green">{formatCurrency(totalNetWorth)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Avg net worth</div>
              <div className="stat-val">{formatCurrency(avgNetWorth)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Members</div>
              <div className="stat-val">{totalMembers}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Loading households...
            </div>
          ) : households.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              No households yet. Upload an Excel file to get started.
            </div>
          ) : (
            <div className="table-card">
              <div className="table-head">
                <div className="th">Household</div>
                <div className="th">Income</div>
                <div className="th">Net Worth</div>
                <div className="th">Members</div>
                <div className="th">Accounts</div>
                <div className="th">Risk</div>
              </div>
              {households.map((h) => (
                <Link key={h.id} href={`/households/${h.id}`} className="table-row">
                  <div className="td name">{h.name}</div>
                  <div className="td money">{formatCurrency(h.income)}</div>
                  <div className="td money">{formatCurrency(h.net_worth)}</div>
                  <div className="td">{h.member_count}</div>
                  <div className="td">{h.account_count}</div>
                  <div className="td">
                    {h.risk_tolerance ? (
                      <span className={`badge ${getRiskBadgeClass(h.risk_tolerance)}`}>
                        {h.risk_tolerance}
                      </span>
                    ) : '—'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        title="Upload Excel File"
      >
        <UploadExcel
          onSuccess={(msg) => {
            showToast(msg, 'success');
            setShowExcelModal(false);
            fetchHouseholds();
          }}
          onError={(msg) => showToast(msg, 'error')}
          onClose={() => setShowExcelModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        title="Upload Audio Recording"
      >
        <UploadAudio
          onSuccess={(msg) => {
            showToast(msg, 'success');
            setShowAudioModal(false);
          }}
          onError={(msg) => showToast(msg, 'error')}
          onClose={() => setShowAudioModal(false)}
        />
      </Modal>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}