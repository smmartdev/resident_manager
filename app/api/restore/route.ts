import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.version || !body.tables) {
      return NextResponse.json({ error: 'ملف النسخة الاحتياطية غير صالح' }, { status: 400 });
    }

    const ds = await getDataSource();
    const { residents, aid_records } = body.tables;

    if (!Array.isArray(residents) || !Array.isArray(aid_records)) {
      return NextResponse.json({ error: 'بيانات غير صالحة في ملف النسخة الاحتياطية' }, { status: 400 });
    }

    // Disable foreign key checks during restore
    await ds.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear existing data
    await ds.query('DELETE FROM aid_records');
    await ds.query('DELETE FROM residents');

    // Restore residents
    let restoredResidents = 0;
    for (const r of residents) {
      await ds.query(
        `INSERT INTO residents (
          id, nationalId, firstName, fatherName, grandfatherName, familyName,
          gender, dateOfBirth, maritalStatus, phoneNumber1, phoneNumber2,
          hasChronicDisease, chronicDiseaseDescription, hasDisability, disabilityType,
          isPregnant, isBreastfeeding, isMartyr, tentNumber, headOfHouseholdId,
          relationToHead, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id, r.nationalId, r.firstName, r.fatherName, r.grandfatherName,
          r.familyName, r.gender,
          String(r.dateOfBirth).split('T')[0],
          r.maritalStatus,
          r.phoneNumber1, r.phoneNumber2 ?? null,
          r.hasChronicDisease ? 1 : 0, r.chronicDiseaseDescription ?? null,
          r.hasDisability ? 1 : 0, r.disabilityType ?? null,
          r.isPregnant ? 1 : 0, r.isBreastfeeding ? 1 : 0,
          r.isMartyr ? 1 : 0,
          r.tentNumber ?? null, r.headOfHouseholdId ?? null,
          r.relationToHead, r.isActive ? 1 : 0,
          String(r.createdAt).replace('T', ' ').replace('Z', '').split('.')[0],
          String(r.updatedAt).replace('T', ' ').replace('Z', '').split('.')[0],
        ]
      );
      restoredResidents++;
    }

    // Restore aid records
    let restoredAid = 0;
    for (const a of aid_records) {
      await ds.query(
        `INSERT INTO aid_records (id, headOfHouseholdId, aidType, amount, aidDate, source, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id, a.headOfHouseholdId, a.aidType,
          a.amount ?? null, String(a.aidDate).split('T')[0], a.source,
          a.notes ?? null, String(a.createdAt).replace('T', ' ').replace('Z', '').split('.')[0],
        ]
      );
      restoredAid++;
    }

    // Re-enable foreign key checks
    await ds.query('SET FOREIGN_KEY_CHECKS = 1');

    return NextResponse.json({
      message: 'تم استرجاع النسخة الاحتياطية بنجاح',
      restored: {
        residents: restoredResidents,
        aid_records: restoredAid,
      },
    });
  } catch (error) {
    // Make sure to re-enable foreign keys on error
    try {
      const ds = await getDataSource();
      await ds.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (_) { }

    return NextResponse.json(
      { error: 'فشل في استرجاع النسخة الاحتياطية', detail: String(error) },
      { status: 500 }
    );
  }
}