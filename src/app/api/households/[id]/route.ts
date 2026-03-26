import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [household, members, accounts, bankDetails, insights] = await Promise.all([
      query('SELECT * FROM households WHERE id = $1', [id]),
      query('SELECT * FROM members WHERE household_id = $1 ORDER BY id', [id]),
      query('SELECT * FROM accounts WHERE household_id = $1 ORDER BY id', [id]),
      query('SELECT * FROM bank_details WHERE household_id = $1 ORDER BY id', [id]),
      query('SELECT * FROM audio_insights WHERE household_id = $1 ORDER BY created_at DESC LIMIT 5', [id]),
    ]);

    if (household.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...household.rows[0],
      members: members.rows,
      accounts: accounts.rows,
      bank_details: bankDetails.rows,
      audio_insights: insights.rows,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch household' }, { status: 500 });
  }
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await _req.json();
    const fields = Object.keys(body).filter(k =>
      ['income','net_worth','liquid_net_worth','tax_bracket','risk_tolerance','time_horizon','primary_investment_objective','source_of_funds','notes'].includes(k)
    );
    if (fields.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values = fields.map(f => body[f]);
    values.push(id);

    const result = await query(
      `UPDATE households SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update household' }, { status: 500 });
  }
}