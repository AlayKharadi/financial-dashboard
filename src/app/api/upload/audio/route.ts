import { NextResponse } from 'next/server';
import { processAudio } from '@/lib/gemini';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const householdId = formData.get('household_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    if (!householdId) {
      return NextResponse.json({ error: 'household_id is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'audio/mpeg';

    // Process with Gemini
    const insight = await processAudio(buffer, mimeType);

    // Store the insight
    await query(
      `INSERT INTO audio_insights (household_id, transcript, insights, extracted_updates)
       VALUES ($1, $2, $3, $4)`,
      [householdId, insight.transcript, insight.summary, JSON.stringify(insight.extracted_updates)]
    );

    // Apply extracted updates to household
    const updates = insight.extracted_updates;
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    if (updates.income) { updateFields.push('income'); updateValues.push(updates.income); }
    if (updates.net_worth) { updateFields.push('net_worth'); updateValues.push(updates.net_worth); }
    if (updates.risk_tolerance) { updateFields.push('risk_tolerance'); updateValues.push(updates.risk_tolerance); }
    if (updates.time_horizon) { updateFields.push('time_horizon'); updateValues.push(updates.time_horizon); }
    if (updates.tax_bracket) { updateFields.push('tax_bracket'); updateValues.push(updates.tax_bracket); }
    if (updates.notes) { updateFields.push('notes'); updateValues.push(updates.notes); }

    if (updateFields.length > 0) {
      const setClause = updateFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      updateValues.push(householdId);
      await query(
        `UPDATE households SET ${setClause}, updated_at = NOW() WHERE id = $${updateValues.length}`,
        updateValues
      );
    }

    // Add new members if mentioned
    if (updates.new_members && updates.new_members.length > 0) {
      for (const member of updates.new_members) {
        const existing = await query(
          'SELECT id FROM members WHERE household_id = $1 AND LOWER(name) = LOWER($2)',
          [householdId, member.name]
        );
        if (existing.rows.length === 0) {
          await query(
            `INSERT INTO members (household_id, name, email, phone) VALUES ($1, $2, $3, $4)`,
            [householdId, member.name, member.email, member.phone]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: insight.summary,
      updates_applied: updateFields,
      new_members_added: updates.new_members?.length || 0,
    });
  } catch (err) {
    console.error('Audio upload error:', err);
    return NextResponse.json({ error: 'Failed to process audio file' }, { status: 500 });
  }
}