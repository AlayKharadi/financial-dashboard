// Shared Tailwind class strings — single source of truth for layout tokens

// ── Shell & main layout ───────────────────────────────────────────────────────
export const shell = 'flex flex-col md:flex-row h-screen border border-border-subtle rounded-xl overflow-hidden bg-bg-tertiary shadow-xl';
export const main  = 'flex-1 overflow-hidden flex flex-col';

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const tabs        = 'flex border-b border-border-subtle bg-bg-primary';
const tabBase            = 'px-5 py-3 text-sm cursor-pointer border-b-2 -mb-px transition-colors no-underline';
export const tabActive   = `${tabBase} text-brand border-b-brand font-semibold`;
export const tabInactive = `${tabBase} text-text-secondary hover:text-text-primary border-b-transparent`;

// ── Topbar & buttons ──────────────────────────────────────────────────────────
export const topbar     = 'flex items-center justify-between px-6 py-4 bg-bg-primary border-b border-border-subtle';
export const btnSm      = 'px-4 py-2 text-sm font-medium rounded-lg border border-border-mid bg-bg-primary text-text-primary hover:bg-bg-secondary hover:border-border-subtle transition-all duration-150 cursor-pointer';
export const btnPrimary = 'px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-all duration-150 bg-brand text-white border-brand hover:bg-[#2a7bc9] hover:border-[#2a7bc9]';

// ── Stats ─────────────────────────────────────────────────────────────────────
export const statRow = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';
export const stat    = 'bg-bg-primary border border-border-subtle rounded-xl px-5 py-4';

// ── Table ─────────────────────────────────────────────────────────────────────
export const tableCard = 'bg-bg-primary border border-border-subtle rounded-xl overflow-hidden overflow-x-auto';
export const tableHead = 'grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] min-w-140 px-6 py-3 bg-bg-secondary border-b border-border-subtle text-xs font-medium text-text-secondary';
export const tableRow  = 'grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] min-w-140 px-6 h-14 border-b border-border-subtle last:border-b-0 hover:bg-bg-secondary transition-colors cursor-pointer items-center no-underline';

// ── Detail page ───────────────────────────────────────────────────────────────
export const detailHeader = 'px-6 py-4 bg-bg-primary border-b border-border-subtle flex items-center gap-4';
export const detailBody   = 'flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6';
export const sectionCard  = 'bg-bg-primary border border-border-subtle rounded-xl p-6';
export const sectionTitle = 'text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4 pb-3 border-b border-border-subtle';
export const detailLine   = 'flex justify-between py-3 text-sm border-b border-border-subtle last:border-b-0';

// ── Insights ──────────────────────────────────────────────────────────────────
export const chartGrid  = 'grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0';
export const chartCard  = 'bg-bg-primary border border-border-subtle rounded-xl p-6';
export const chartTitle = 'text-xs font-semibold text-text-secondary uppercase tracking-widest mb-5';
