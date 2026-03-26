'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { use } from 'react';
import Sidebar from '@/components/Sidebar';
import { shell, main, btnPrimary, detailHeader, detailBody, sectionCard, sectionTitle, detailLine } from '@/lib/styles';
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

// ── badge ─────────────────────────────────────────────────────────────────────
const badgeBase = 'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap max-w-48 overflow-hidden text-ellipsis';
const badgeVariant: Record<string, string> = {
  blue:  'bg-bg-info text-text-info',
  amber: 'bg-[#FAEEDA] text-[#854F0B]',
  green: 'bg-[#EAF3DE] text-[#3B6D11]',
  gray:  'bg-bg-secondary text-text-secondary border border-border-subtle',
};
function riskVariant(risk: string | null) {
  if (!risk) return badgeVariant.gray;
  const r = risk.toLowerCase();
  if (r === 'low') return badgeVariant.green;
  if (r === 'moderate' || r === 'medium') return badgeVariant.amber;
  return badgeVariant.blue;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatCurrency(amount: number | null) {
  if (!amount || amount > 1e12) return '—';
  if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000)     return '$' + (amount / 1_000).toFixed(0) + 'K';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HouseholdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const { toasts, showToast, removeToast }  = useToast();

  const fetchHousehold = useCallback(async () => {
    try {
      const res = await fetch(`/api/households/${id}`);
      if (!res.ok) throw new Error('Not found');
      setHousehold(await res.json());
    } catch {
      showToast('Failed to load household', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => { fetchHousehold(); }, [fetchHousehold]);

  if (loading || !household) {
    return (
      <div className={shell}>
        <Sidebar />
        <div className={`${main} items-center justify-center`}>
          <div className="text-text-secondary text-[13px]">
            {loading ? 'Loading…' : 'Household not found.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <Sidebar />

      <div className={main}>
        {/* Detail header */}
        <div className={detailHeader}>
          <Link href="/households" className="text-[12px] text-text-secondary flex items-center gap-1 no-underline">
            ← Back
          </Link>
          <div className="text-[15px] font-medium text-text-primary">{household.name}</div>
          <div className="flex gap-1.5 ml-auto items-center flex-wrap justify-end max-w-120">
            {household.risk_tolerance && (
              <span className={`${badgeBase} ${riskVariant(household.risk_tolerance)}`}>
                {household.risk_tolerance} risk
              </span>
            )}
            {household.time_horizon && (
              <span className={`${badgeBase} ${badgeVariant.blue}`}>{household.time_horizon}</span>
            )}
            <button className={btnPrimary} onClick={() => setShowAudioModal(true)}>
              Upload Audio
            </button>
          </div>
        </div>

        {/* Detail body */}
        <div className={detailBody}>

          {/* Financial overview */}
          <div className={sectionCard}>
            <div className={sectionTitle}>Financial overview</div>
            {[
              { label: 'Annual income',        val: formatCurrency(household.income),              green: true  },
              { label: 'Net worth',             val: formatCurrency(household.net_worth),           green: true  },
              { label: 'Liquid net worth',      val: formatCurrency(household.liquid_net_worth),    green: false },
              { label: 'Tax bracket',           val: household.tax_bracket || '—',                  green: false },
              { label: 'Expense range',         val: household.expense_range || '—',                green: false },
              { label: 'Time horizon',          val: household.time_horizon || '—',                 green: false },
              { label: 'Investment objective',  val: household.primary_investment_objective || '—', green: false },
            ].map(({ label, val, green }) => (
              <div key={label} className={detailLine}>
                <span className="text-text-secondary">{label}</span>
                <span className={`font-medium ${green ? 'text-green' : 'text-text-primary'}`}>{val}</span>
              </div>
            ))}
            {household.notes && (
              <div className="mt-3 text-[12px] text-text-secondary leading-relaxed px-3 py-2.5 bg-bg-secondary rounded-lg">
                {household.notes}
              </div>
            )}
          </div>

          {/* Members */}
          <div className={sectionCard}>
            <div className={sectionTitle}>Members ({household.members.length})</div>
            {household.members.length === 0 ? (
              <div className="text-text-secondary text-[12px] py-2">No members on record.</div>
            ) : (
              household.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-b-0">
                  <div className="w-8 h-8 rounded-full bg-bg-info flex items-center justify-center text-[11px] font-medium text-text-info shrink-0">
                    {getInitials(m.name)}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary">{m.name}</div>
                    <div className="text-[11px] text-text-secondary">
                      {[m.relationship, m.occupation, m.employer].filter(Boolean).join(' · ') || m.email || '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Accounts */}
          <div className={sectionCard}>
            <div className={sectionTitle}>Accounts ({household.accounts.length})</div>
            {household.accounts.length === 0 ? (
              <div className="text-text-secondary text-[12px] py-2">No accounts on record.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.5px] pb-2 text-left">Type</th>
                    <th className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.5px] pb-2 text-left pl-3">Custodian</th>
                    <th className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.5px] pb-2 text-left pl-3">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {household.accounts.map((a) => (
                    <tr key={a.id} className="border-b border-border-subtle last:border-b-0">
                      <td className="text-[12px] text-text-primary font-medium py-2">{a.account_type || '—'}</td>
                      <td className="text-[12px] text-text-secondary py-2 pl-3">{a.custodian || '—'}</td>
                      <td className="text-[12px] text-text-secondary py-2 pl-3">{a.ownership_distribution || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Audio Insights */}
          <div className={sectionCard}>
            <div className={sectionTitle}>AI audio insights</div>
            {household.audio_insights.length === 0 ? (
              <div className="text-text-secondary text-[12px] py-2">
                No audio uploaded yet. Use the Upload Audio button to analyse a conversation.
              </div>
            ) : (
              household.audio_insights.map((insight) => (
                <div key={insight.id} className="mb-3">
                  <div className="text-[11px] text-text-info font-medium mb-1.5 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M6 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2v2" />
                      <circle cx="8" cy="13" r="0.5" fill="currentColor" />
                    </svg>
                    Gemini summary · {formatDate(insight.created_at)}
                  </div>
                  <div className="bg-bg-secondary rounded-lg px-3 py-2.5 text-[12px] text-text-secondary leading-relaxed">
                    {insight.insights}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bank details — only if present */}
          {household.bank_details.length > 0 && (
            <div className={sectionCard}>
              <div className={sectionTitle}>Bank details</div>
              {household.bank_details.map((b) => (
                <div key={b.id} className={detailLine}>
                  <span className="text-text-secondary">{b.bank_name || '—'}</span>
                  <span className="text-text-primary font-medium">
                    {[b.bank_type, b.account_number].filter(Boolean).join(' · ') || '—'}
                  </span>
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
          onSuccess={(msg) => { showToast(msg, 'success'); setShowAudioModal(false); fetchHousehold(); }}
          onError={(msg) => showToast(msg, 'error')}
          onClose={() => setShowAudioModal(false)}
        />
      </Modal>

      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
