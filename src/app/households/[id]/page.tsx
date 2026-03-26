'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import UploadAudio from '@/components/UploadAudio';
import Toast from '@/components/Toast';
import { useToast } from '@/components/useToast';

interface Member {
  id: number;
  name: string;
  relationship: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  employer: string | null;
  marital_status: string | null;
}

interface Account {
  id: number;
  custodian: string | null;
  account_type: string | null;
  ownership_distribution: string | null;
}

interface BankDetail {
  id: number;
  bank_name: string | null;
  account_number: string | null;
  bank_type: string | null;
}

interface AudioInsight {
  id: number;
  transcript: string;
  insights: string;
  created_at: string;
}

interface Household {
  id: number;
  name: string;
  income: number | null;
  net_worth: number | null;
  liquid_net_worth: number | null;
  expense_range: string | null;
  tax_bracket: string | null;
  risk_tolerance: string | null;
  time_horizon: string | null;
  primary_investment_objective: string | null;
  source_of_funds: string | null;
  notes: string | null;
  members: Member[];
  accounts: Account[];
  bank_details: BankDetail[];
  audio_insights: AudioInsight[];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(amount: number | null): string {
  if (!amount || amount > 1e12) return '—';
  if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function getRiskBadgeClass(risk: string | null): string {
  if (!risk) return 'badge-gray';
  const r = risk.toLowerCase();
  if (r === 'low') return 'badge-green';
  if (r === 'moderate' || r === 'medium') return 'badge-amber';
  return 'badge-blue';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const fetchHousehold = useCallback(async () => {
    try {
      const res = await fetch(`/api/households/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setHousehold(data);
    } catch {
      showToast('Failed to load household', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);

  if (loading) {
    return (
      <div className="shell">
        <Sidebar />
        <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="shell">
        <Sidebar />
        <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Household not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <Sidebar />

      <div className="main">
        <div className="tabs">
          <Link href="/households" className="tab">Households</Link>
          <div className="tab active">{household.name}</div>
          <Link href="/insights" className="tab">Insights</Link>
        </div>

        <div className="detail-header">
          <Link href="/households" className="back-btn">← Back</Link>
          <div className="detail-name">{household.name}</div>
          <div className="detail-chips">
            {household.risk_tolerance && (
              <span className={`badge ${getRiskBadgeClass(household.risk_tolerance)}`}>
                {household.risk_tolerance} risk
              </span>
            )}
            {household.time_horizon && (
              <span className="badge badge-blue">{household.time_horizon}</span>
            )}
            <button className="btn-sm btn-primary" onClick={() => setShowAudioModal(true)}>
              Upload Audio
            </button>
          </div>
        </div>

        <div className="detail-body">
          {/* Financial Overview */}
          <div className="section-card">
            <div className="section-title">Financial overview</div>
            <div className="detail-line">
              <span className="dl">Annual income</span>
              <span className="dv green">{formatCurrency(household.income)}</span>
            </div>
            <div className="detail-line">
              <span className="dl">Net worth</span>
              <span className="dv green">{formatCurrency(household.net_worth)}</span>
            </div>
            <div className="detail-line">
              <span className="dl">Liquid net worth</span>
              <span className="dv">{formatCurrency(household.liquid_net_worth)}</span>
            </div>
            <div className="detail-line">
              <span className="dl">Tax bracket</span>
              <span className="dv">{household.tax_bracket || '—'}</span>
            </div>
            <div className="detail-line">
                <span className="dl">Expense range</span>
                <span className="dv">{household.expense_range || '—'}</span>
            </div>
            <div className="detail-line">
              <span className="dl">Time horizon</span>
              <span className="dv">{household.time_horizon || '—'}</span>
            </div>
            <div className="detail-line">
              <span className="dl">Investment objective</span>
              <span className="dv">{household.primary_investment_objective || '—'}</span>
            </div>
            {household.notes && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6', padding: '8px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                {household.notes}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="section-card">
            <div className="section-title">Members ({household.members.length})</div>
            {household.members.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', padding: '8px 0' }}>No members on record.</div>
            ) : (
              household.members.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="avatar">{getInitials(member.name)}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{member.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {[member.relationship, member.occupation, member.employer].filter(Boolean).join(' · ') || member.email || '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Accounts */}
          <div className="section-card">
            <div className="section-title">Accounts ({household.accounts.length})</div>
            {household.accounts.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', padding: '8px 0' }}>No accounts on record.</div>
            ) : (
              <table className="acc-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Custodian</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {household.accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="acc-primary">{account.account_type || '—'}</td>
                      <td>{account.custodian || '—'}</td>
                      <td>{account.ownership_distribution || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Audio Insights */}
          <div className="section-card">
            <div className="section-title">AI audio insights</div>
            {household.audio_insights.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', padding: '8px 0' }}>
                No audio uploaded yet. Use the Upload Audio button to analyse a conversation.
              </div>
            ) : (
              household.audio_insights.map((insight) => (
                <div key={insight.id} style={{ marginBottom: '12px' }}>
                  <div className="audio-label">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M6 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2v2" />
                      <circle cx="8" cy="13" r="0.5" fill="currentColor" />
                    </svg>
                    Gemini summary · {formatDate(insight.created_at)}
                  </div>
                  <div className="audio-block">{insight.insights}</div>
                </div>
              ))
            )}
          </div>

          {/* Bank Details — only show if present */}
          {household.bank_details.length > 0 && (
            <div className="section-card">
              <div className="section-title">Bank details</div>
              {household.bank_details.map((bank) => (
                <div key={bank.id} className="detail-line">
                  <span className="dl">{bank.bank_name || '—'}</span>
                  <span className="dv">{[bank.bank_type, bank.account_number].filter(Boolean).join(' · ') || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        title={`Upload Audio for ${household.name}`}
      >
        <UploadAudio
          householdId={String(household.id)}
          onSuccess={(msg) => {
            showToast(msg, 'success');
            setShowAudioModal(false);
            fetchHousehold(); // refresh to show new insight
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