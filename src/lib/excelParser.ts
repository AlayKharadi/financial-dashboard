import * as XLSX from 'xlsx';

export interface ParsedHousehold {
  name: string;
  income?: number;
  net_worth?: number;
  liquid_net_worth?: number;
  tax_bracket?: string;
  risk_tolerance?: string;
  time_horizon?: string;
  primary_investment_objective?: string;
  source_of_funds?: string;
  members: ParsedMember[];
  accounts: ParsedAccount[];
  bank_details: ParsedBankDetail[];
}

export interface ParsedMember {
  name: string;
  relationship?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  address?: string;
  occupation?: string;
  employer?: string;
  marital_status?: string;
}

export interface ParsedAccount {
  custodian?: string;
  account_type?: string;
  ownership_distribution?: string;
}

export interface ParsedBankDetail {
  bank_name?: string;
  account_number?: string;
  bank_type?: string;
}

function toString(val: unknown): string | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  return s === '' ? undefined : s;
}

function toNumber(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(String(val).replace(/[$,]/g, '').trim());
  return isNaN(n) ? undefined : n;
}

// Infer member relationship from available signals
function inferRelationship(
  isFirstMember: boolean,
  dobStr: string | undefined,
  maritalStatus: string | undefined,
): string {
  if (isFirstMember) return 'Primary';

  // Parse year of birth if available
  if (dobStr) {
    const parts = dobStr.split(/[\/\-]/);
    // Handles DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const year = parts.find(p => p.length === 4);
    if (year) {
      const age = 2025 - parseInt(year, 10);
      if (age <= 27) return 'Dependent';
    }
  }

  // Adult with a marital status recorded → likely spouse
  if (maritalStatus && maritalStatus.toLowerCase().includes('married')) return 'Spouse';

  return '—';
}

// Normalize a column header for loose matching
function norm(key: string): string {
  return key.toLowerCase().replace(/[\s_\-#\/]+/g, '_').trim();
}

// Find a value in a row by trying multiple candidate header names
function get(row: Record<string, unknown>, ...candidates: string[]): unknown {
  for (const candidate of candidates) {
    for (const key of Object.keys(row)) {
      if (norm(key) === norm(candidate)) return row[key];
    }
  }
  // Second pass: partial match
  for (const candidate of candidates) {
    for (const key of Object.keys(row)) {
      if (norm(key).includes(norm(candidate))) return row[key];
    }
  }
  return undefined;
}

export function parseExcel(buffer: Buffer): ParsedHousehold[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const households: Map<string, ParsedHousehold> = new Map();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length === 0) continue;

    for (const row of rows) {
      // ── Household identity ──────────────────────────────────────────
      const householdName = toString(get(row, 'Household Name', 'household_name', 'household', 'family', 'client'));
      if (!householdName) continue;

      if (!households.has(householdName)) {
        households.set(householdName, {
          name: householdName,
          // Household-level financials — same across rows for a household, take first non-null
          income: toNumber(get(row, 'Annual income', 'annual_income', 'income', 'total_income')),
          net_worth: toNumber(get(row, 'Estimated Total Net Worth', 'total_net_worth', 'net_worth')),
          liquid_net_worth: toNumber(get(row, 'Estimated Liquid Net Worth', 'liquid_net_worth', 'liquid')),
          tax_bracket: toString(get(row, 'Client Tax Bracket', 'tax_bracket', 'tax')),
          risk_tolerance: toString(get(row, 'Risk Tolerance', 'risk_tolerance', 'risk')),
          time_horizon: toString(get(row, 'Time Horizon', 'time_horizon', 'horizon')),
          primary_investment_objective: toString(get(row, 'Primary Investment Objective', 'investment_objective')),
          source_of_funds: toString(get(row, 'Source of Funds', 'source_of_funds')),
          members: [],
          accounts: [],
          bank_details: [],
        });
      }

      const hh = households.get(householdName)!;

      // Fill in household financials from later rows if missing on first
      if (!hh.income) hh.income = toNumber(get(row, 'Annual income', 'annual_income', 'income'));
      if (!hh.net_worth) hh.net_worth = toNumber(get(row, 'Estimated Total Net Worth', 'total_net_worth', 'net_worth'));
      if (!hh.liquid_net_worth) hh.liquid_net_worth = toNumber(get(row, 'Estimated Liquid Net Worth', 'liquid_net_worth'));
      if (!hh.risk_tolerance) hh.risk_tolerance = toString(get(row, 'Risk Tolerance', 'risk_tolerance'));
      if (!hh.time_horizon) hh.time_horizon = toString(get(row, 'Time Horizon', 'time_horizon'));

      // ── Member ──────────────────────────────────────────────────────
      // Each row has First Name + Last Name — compose full name
      const firstName = toString(get(row, 'First Name', 'first_name'));
      const lastName = toString(get(row, 'Last Name', 'last_name'));
      const fullName = firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName;

      if (fullName) {
        const alreadyAdded = hh.members.some(m => m.name.toLowerCase() === fullName.toLowerCase());
        if (!alreadyAdded) {
          const dob = toString(get(row, 'DOB', 'date_of_birth', 'dob', 'birthday'));
          const maritalStatus = toString(get(row, 'Marital Status', 'marital_status'));
          const isFirst = hh.members.length === 0;
          hh.members.push({
            name: fullName,
            relationship: inferRelationship(isFirst, dob, maritalStatus),
            date_of_birth: dob,
            email: toString(get(row, 'Email', 'email_address', 'email')),
            phone: toString(get(row, 'Phone #', 'phone', 'phone_number', 'mobile')),
            address: toString(get(row, 'Address', 'home_address')),
            occupation: toString(get(row, 'Occupation', 'occupation')),
            employer: toString(get(row, 'Employer', 'employer')),
            marital_status: maritalStatus,
          });
        }
      }

      // ── Account ─────────────────────────────────────────────────────
      // Each row represents one account (Account Type column)
      const accountType = toString(get(row, 'Account Type', 'account_type', 'type'));
      const custodian = toString(get(row, 'Custodian', 'custodian', 'institution', 'brokerage'));

      if (accountType) {
        hh.accounts.push({
          custodian,
          account_type: accountType,
          ownership_distribution: fullName, // track which member owns this account
        });
      }

      // ── Bank details ─────────────────────────────────────────────────
      const bankName = toString(get(row, 'Bank Name', 'bank_name', 'bank'));
      const bankAccountNo = toString(get(row, 'Account No', 'account_no', 'account_number', 'bank_account'));
      const bankType = toString(get(row, 'Bank Type - Checking/Savings', 'bank_type', 'checking_savings'));

      if (bankName) {
        const alreadyAdded = hh.bank_details.some(
          b => b.bank_name === bankName && b.account_number === bankAccountNo
        );
        if (!alreadyAdded) {
          hh.bank_details.push({
            bank_name: bankName,
            account_number: bankAccountNo,
            bank_type: bankType,
          });
        }
      }
    }
  }

  return Array.from(households.values());
}