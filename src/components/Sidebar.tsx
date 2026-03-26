// components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">Financial Manager</div>
        <div className="sub">Dashboard</div>
      </div>
      <div className="nav-section">
        <Link 
          href="/households" 
          className={`nav-item ${pathname.startsWith('/households') ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="8" width="4" height="6" rx="1"/>
            <rect x="6" y="5" width="4" height="9" rx="1"/>
            <rect x="10" y="2" width="4" height="12" rx="1"/>
          </svg>
          Households
        </Link>
        <Link 
          href="/insights" 
          className={`nav-item ${pathname === '/insights' ? 'active' : ''}`}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="5.5"/>
            <path d="M8 5v3l2 1.5"/>
          </svg>
          Insights
        </Link>
      </div>
    </div>
  );
}