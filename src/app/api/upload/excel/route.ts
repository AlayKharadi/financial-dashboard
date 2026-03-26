import { NextResponse } from 'next/server';
import { parseExcel } from '@/lib/excelParser';
import { query } from '@/lib/db';

/**
 * Helper to clean currency strings (e.g., "$1,200,000") into numeric values.
 * This prevents the database from defaulting to 0.00 or failing.
 */
const cleanCurrency = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[$,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcel(buffer);

    if (parsed.length === 0) {
      return NextResponse.json({ error: 'No households found in Excel file' }, { status: 400 });
    }

    const results = [];

    for (const hh of parsed) {
      // Clean numeric fields before database interaction
      const income = cleanCurrency(hh.income);
      const netWorth = cleanCurrency(hh.net_worth);
      const liquidNetWorth = cleanCurrency(hh.liquid_net_worth);

      // Check if household exists
      const existing = await query('SELECT id FROM households WHERE LOWER(name) = LOWER($1)', [hh.name]);
      
      let householdId: number;

      if (existing.rows.length > 0) {
        // Update existing household with cleaned numeric values
        householdId = existing.rows[0].id;
        await query(
          `UPDATE households SET 
            income = COALESCE($1, income),
            net_worth = COALESCE($2, net_worth),
            liquid_net_worth = COALESCE($3, liquid_net_worth),
            tax_bracket = COALESCE($4, tax_bracket),
            risk_tolerance = COALESCE($5, risk_tolerance),
            time_horizon = COALESCE($6, time_horizon),
            primary_investment_objective = COALESCE($7, primary_investment_objective),
            source_of_funds = COALESCE($8, source_of_funds),
            updated_at = NOW()
          WHERE id = $9`,
          [income, netWorth, liquidNetWorth, hh.tax_bracket, hh.risk_tolerance, hh.time_horizon, hh.primary_investment_objective, hh.source_of_funds, householdId]
        );
      } else {
        // Insert new household with cleaned numeric values
        const res = await query(
          `INSERT INTO households (name, income, net_worth, liquid_net_worth, tax_bracket, risk_tolerance, time_horizon, primary_investment_objective, source_of_funds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [hh.name, income, netWorth, liquidNetWorth, hh.tax_bracket, hh.risk_tolerance, hh.time_horizon, hh.primary_investment_objective, hh.source_of_funds]
        );
        householdId = res.rows[0].id;
      }

      // Insert members (skip duplicates by name)
      for (const member of hh.members) {
        const existingMember = await query(
          'SELECT id FROM members WHERE household_id = $1 AND LOWER(name) = LOWER($2)',
          [householdId, member.name]
        );
        if (existingMember.rows.length === 0) {
          await query(
            `INSERT INTO members (household_id, name, relationship, date_of_birth, email, phone, address, occupation, employer, marital_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [householdId, member.name, member.relationship || null, member.date_of_birth || null, member.email, member.phone, member.address, member.occupation, member.employer, member.marital_status]
          );
        }
      }

      // Insert accounts (skip duplicates by type + custodian + owner)
      for (const account of hh.accounts) {
        const existingAccount = await query(
          `SELECT id FROM accounts WHERE household_id = $1
           AND LOWER(COALESCE(account_type,'')) = LOWER(COALESCE($2,''))
           AND LOWER(COALESCE(custodian,'')) = LOWER(COALESCE($3,''))
           AND LOWER(COALESCE(ownership_distribution,'')) = LOWER(COALESCE($4,''))`,
          [householdId, account.account_type, account.custodian, account.ownership_distribution]
        );
        if (existingAccount.rows.length === 0) {
          await query(
            `INSERT INTO accounts (household_id, custodian, account_type, ownership_distribution)
             VALUES ($1, $2, $3, $4)`,
            [householdId, account.custodian, account.account_type, account.ownership_distribution]
          );
        }
      }

      // Insert bank details (skip duplicates)
      for (const bank of hh.bank_details) {
        const existingBank = await query(
            'SELECT id FROM bank_details WHERE household_id = $1 AND account_number = $2',
            [householdId, bank.account_number]
        );
        if (existingBank.rows.length === 0) {
            await query(
              `INSERT INTO bank_details (household_id, bank_name, account_number, bank_type)
               VALUES ($1, $2, $3, $4)`,
              [householdId, bank.bank_name, bank.account_number, bank.bank_type]
            );
        }
      }

      results.push({ id: householdId, name: hh.name });
    }

    return NextResponse.json({ 
      success: true, 
      households: results,
      message: `Processed ${results.length} household(s)` 
    });
  } catch (err) {
    console.error('Excel upload error:', err);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}