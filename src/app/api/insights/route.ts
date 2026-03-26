// app/api/insights/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Basic stats
    const statsResult = await query(`
      SELECT 
        COUNT(DISTINCT h.id) as total_households,
        COALESCE(SUM(h.net_worth), 0) as total_net_worth,
        COALESCE(AVG(h.net_worth), 0) as avg_net_worth,
        COALESCE(AVG(h.income), 0) as avg_income,
        COALESCE(SUM(h.income), 0) as total_income
      FROM households h
    `);

    const stats = statsResult.rows[0];

    // 2. Net Worth by Household (top 8)
    const netWorthResult = await query(`
      SELECT 
        name,
        COALESCE(net_worth, 0) as value
      FROM households 
      WHERE net_worth IS NOT NULL 
      ORDER BY net_worth DESC 
      LIMIT 8
    `);

    const netWorthByHousehold = netWorthResult.rows.map((row: any, index: number) => ({
      name: row.name,
      value: Number(row.value),
      percent: index === 0 ? 100 : Math.round((Number(row.value) / (netWorthResult.rows[0]?.value || 1)) * 100)
    }));

    // 3. Income by Household (top 8)
    const incomeResult = await query(`
      SELECT 
        name,
        COALESCE(income, 0) as value
      FROM households 
      WHERE income IS NOT NULL 
      ORDER BY income DESC 
      LIMIT 8
    `);

    const incomeByHousehold = incomeResult.rows.map((row: any, index: number) => ({
      name: row.name,
      value: Number(row.value),
      percent: index === 0 ? 100 : Math.round((Number(row.value) / (incomeResult.rows[0]?.value || 1)) * 100)
    }));

    // 4. Accounts by Type — ordered by count (no per-account balances in source data)
    const accountsByTypeResult = await query(`
      SELECT
        account_type as type,
        COUNT(*) as count
      FROM accounts a
      GROUP BY account_type
      ORDER BY count DESC
    `);

    const accountsByType = accountsByTypeResult.rows.map((row: any) => ({
      type: row.type || 'Unknown',
      count: Number(row.count),
    }));

    // 5. Risk Distribution
    const riskResult = await query(`
      SELECT 
        risk_tolerance as risk,
        COUNT(*) as count
      FROM households 
      WHERE risk_tolerance IS NOT NULL
      GROUP BY risk_tolerance
      ORDER BY count DESC
    `);

    const riskDistribution = riskResult.rows.map((row: any) => ({
      risk: row.risk || 'Unknown',
      count: Number(row.count),
      color: getRiskColor(row.risk)
    }));

    // 6. Investment objectives
    const objectivesResult = await query(`
      SELECT
        primary_investment_objective as objective,
        COUNT(*) as count
      FROM households
      WHERE primary_investment_objective IS NOT NULL
        AND primary_investment_objective != ''
      GROUP BY primary_investment_objective
      ORDER BY count DESC
    `);

    const investmentObjectives = objectivesResult.rows.map((row: any) => ({
      objective: row.objective,
      count: Number(row.count),
    }));

    // 7. Accounts by custodian
    const accountsByCustodianResult = await query(`
      SELECT
        COALESCE(custodian, 'Unknown') as custodian,
        COUNT(*) as count
      FROM accounts
      GROUP BY custodian
      ORDER BY count DESC
    `);

    const accountsByCustodian = accountsByCustodianResult.rows.map((row: any) => ({
      custodian: row.custodian,
      count: Number(row.count),
    }));

    // 8. Member count per household
    const memberCountsResult = await query(`
      SELECT 
        h.name,
        COUNT(m.id) as members
      FROM households h
      LEFT JOIN members m ON m.household_id = h.id
      GROUP BY h.id, h.name
      ORDER BY members DESC
      LIMIT 8
    `);

    const memberCounts = memberCountsResult.rows.map((row: any) => ({
      name: row.name,
      members: Number(row.members)
    }));

    return NextResponse.json({
      totalHouseholds: Number(stats.total_households) || 0,
      totalNetWorth: Number(stats.total_net_worth) || 0,
      avgNetWorth: Number(stats.avg_net_worth) || 0,
      avgIncome: Number(stats.avg_income) || 0,
      totalIncome: Number(stats.total_income) || 0,

      netWorthByHousehold,
      incomeByHousehold,
      accountsByType,
      accountsByCustodian,
      riskDistribution,
      investmentObjectives,
      memberCounts,
    });
  } catch (err) {
    console.error('Insights API error:', err);
    return NextResponse.json({ 
      error: 'Failed to generate insights',
      totalHouseholds: 0 
    }, { status: 500 });
  }
}

// Helper to assign colors to risk levels
function getRiskColor(risk: string | null): string {
  if (!risk) return '#888';
  const r = risk.toLowerCase();
  if (r.includes('low')) return '#1D9E75';
  if (r.includes('medium') || r.includes('moderate')) return '#BA7517';
  if (r.includes('high')) return '#E24B4A';
  return '#378ADD';
}