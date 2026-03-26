const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS audio_insights CASCADE;
      DROP TABLE IF EXISTS bank_details CASCADE;
      DROP TABLE IF EXISTS accounts CASCADE;
      DROP TABLE IF EXISTS members CASCADE;
      DROP TABLE IF EXISTS households CASCADE;
    `);
    console.log('Tables dropped.');

    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE households (
        id                           SERIAL PRIMARY KEY,
        name                         TEXT NOT NULL UNIQUE,
        income                       NUMERIC,
        net_worth                    NUMERIC,
        liquid_net_worth             NUMERIC,
        expense_range                TEXT,
        tax_bracket                  TEXT,
        risk_tolerance               TEXT,
        time_horizon                 TEXT,
        primary_investment_objective TEXT,
        source_of_funds              TEXT,
        notes                        TEXT,
        created_at                   TIMESTAMP DEFAULT NOW(),
        updated_at                   TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE members (
        id             SERIAL PRIMARY KEY,
        household_id   INTEGER REFERENCES households(id) ON DELETE CASCADE,
        name           TEXT NOT NULL,
        relationship   TEXT,
        date_of_birth  TEXT,
        email          TEXT,
        phone          TEXT,
        address        TEXT,
        occupation     TEXT,
        employer       TEXT,
        marital_status TEXT,
        created_at     TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE accounts (
        id                     SERIAL PRIMARY KEY,
        household_id           INTEGER REFERENCES households(id) ON DELETE CASCADE,
        custodian              TEXT,
        account_type           TEXT,
        ownership_distribution TEXT,
        created_at             TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE bank_details (
        id             SERIAL PRIMARY KEY,
        household_id   INTEGER REFERENCES households(id) ON DELETE CASCADE,
        bank_name      TEXT,
        account_number TEXT,
        bank_type      TEXT,
        created_at     TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE audio_insights (
        id                SERIAL PRIMARY KEY,
        household_id      INTEGER REFERENCES households(id) ON DELETE CASCADE,
        transcript        TEXT,
        insights          TEXT,
        extracted_updates JSONB,
        created_at        TIMESTAMP DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_households_updated_at
        BEFORE UPDATE ON households
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Migration complete. All tables created fresh.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
