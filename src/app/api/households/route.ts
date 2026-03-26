import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
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
    `);
    return NextResponse.json(result.rows || []);
  } catch (err) {
    console.error('Error fetching households:', err);
    return NextResponse.json([], { status: 200 });
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