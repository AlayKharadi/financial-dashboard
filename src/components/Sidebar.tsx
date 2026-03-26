// components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItem = (active: boolean) =>
    [
      'flex items-center gap-[9px] px-[10px] py-2 rounded-md text-[13px] mb-0.5 no-underline cursor-pointer',
      active
        ? 'bg-bg-info text-text-info font-medium'
        : 'text-text-secondary hover:bg-bg-secondary',
    ].join(' ');

  const isHouseholds = pathname.startsWith('/households');
  const isInsights   = pathname === '/insights';

  return (
    <>
      {/* ── Desktop sidebar (md+) ────────────────────────────────────────── */}
      <div className="hidden md:flex w-47.5 min-w-47.5 bg-bg-primary border-r border-border-subtle flex-col">
        <div className="px-4 pt-4 pb-3.5 border-b border-border-subtle">
          <div className="text-[15px] font-medium text-text-primary">Financial Manager</div>
          <div className="text-[11px] text-text-secondary mt-px">Dashboard</div>
        </div>
        <div className="py-2.5 px-2 flex-1">
          <Link href="/households" className={navItem(isHouseholds)}>
            <svg className="w-3.75 h-3.75 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="8" width="4" height="6" rx="1"/>
              <rect x="6" y="5" width="4" height="9" rx="1"/>
              <rect x="10" y="2" width="4" height="12" rx="1"/>
            </svg>
            Households
          </Link>
          <Link href="/insights" className={navItem(isInsights)}>
            <svg className="w-3.75 h-3.75 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="5.5"/>
              <path d="M8 5v3l2 1.5"/>
            </svg>
            Insights
          </Link>
        </div>
      </div>

      {/* ── Mobile top nav (< md) ────────────────────────────────────────── */}
      <div className="flex md:hidden items-center justify-between px-4 py-2 bg-bg-primary border-b border-border-subtle shrink-0">
        <div className="text-[14px] font-medium text-text-primary">Financial Manager</div>
        <nav className="flex gap-4">
          <Link
            href="/households"
            className={`text-[12px] no-underline font-medium ${isHouseholds ? 'text-text-info' : 'text-text-secondary'}`}
          >
            Households
          </Link>
          <Link
            href="/insights"
            className={`text-[12px] no-underline font-medium ${isInsights ? 'text-text-info' : 'text-text-secondary'}`}
          >
            Insights
          </Link>
        </nav>
      </div>
    </>
  );
}
