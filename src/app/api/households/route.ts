import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page   = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10)));
    const offset = page * limit;

    const [rowsResult, statsResult] = await Promise.all([
      query(`
        SELECT
          h.id,
          h.name,
          h.income,
          h.net_worth,
          h.liquid_net_worth,
          h.tax_bracket,
          h.risk_tolerance,
          h.time_horizon,
          COUNT(DISTINCT m.id) as member_count,
          COUNT(DISTINCT a.id) as account_count
        FROM households h
        LEFT JOIN members m ON m.household_id = h.id
        LEFT JOIN accounts a ON a.household_id = h.id
        GROUP BY h.id, h.name, h.income, h.net_worth, h.liquid_net_worth,
                 h.tax_bracket, h.risk_tolerance, h.time_horizon
        ORDER BY h.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      query(`
        SELECT
          COUNT(*)                          AS total,
          COALESCE(SUM(net_worth), 0)       AS total_net_worth,
          COALESCE(AVG(net_worth), 0)       AS avg_net_worth,
          (SELECT COUNT(*) FROM members)    AS total_members
        FROM households
      `),
    ]);

    const s = statsResult.rows[0];
    return NextResponse.json({
      rows:         rowsResult.rows ?? [],
      total:        parseInt(s.total, 10),
      totalNetWorth: parseFloat(s.total_net_worth),
      avgNetWorth:   parseFloat(s.avg_net_worth),
      totalMembers:  parseInt(s.total_members, 10),
    });
  } catch (err) {
    console.error('Error fetching households:', err);
    return NextResponse.json({ rows: [], total: 0, totalNetWorth: 0, avgNetWorth: 0, totalMembers: 0 }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, income, net_worth, liquid_net_worth,
      tax_bracket, risk_tolerance, time_horizon,
      primary_investment_objective, source_of_funds, notes
    } = body;

    const result = await query(
      `INSERT INTO households 
        (name, income, net_worth, liquid_net_worth, tax_bracket, risk_tolerance, time_horizon, primary_investment_objective, source_of_funds, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, income, net_worth, liquid_net_worth, tax_bracket, risk_tolerance, time_horizon, primary_investment_objective, source_of_funds, notes]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  }
}