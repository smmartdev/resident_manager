import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';
import { calculateAge } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();

    const heads = await ds.query(
      `SELECT r.*,
        (SELECT COUNT(*) FROM residents m WHERE m.headOfHouseholdId = r.id AND m.isActive = 1) as memberCount
       FROM residents r
       WHERE r.isActive = 1 AND r.relationToHead = 'head'
       ORDER BY r.familyName ASC`
    ) as any[];

    // For each head, get family members to build notes
    const data = await Promise.all(heads.map(async (head: any) => {
      const members = await ds.query(
        `SELECT * FROM residents WHERE headOfHouseholdId = ? AND isActive = 1`,
        [head.id]
      ) as any[];

      const all = [head, ...members];
      const notes: string[] = [];

      for (const p of all) {
        const age = calculateAge(p.dateOfBirth);
        if (age >= 60) notes.push(`كبير سن: ${p.firstName} ${p.familyName}`);
        if (p.hasChronicDisease === 1 || p.hasChronicDisease === true)
          notes.push(`مرض مزمن: ${p.firstName} ${p.familyName}${p.chronicDiseaseDescription ? ` (${p.chronicDiseaseDescription})` : ''}`);
        if (p.isPregnant === 1 || p.isPregnant === true)
          notes.push(`حامل: ${p.firstName} ${p.familyName}`);
        if (p.isBreastfeeding === 1 || p.isBreastfeeding === true)
          notes.push(`مرضع: ${p.firstName} ${p.familyName}`);
        if (age <= 2) notes.push(`طفل دون سنتين: ${p.firstName} ${p.familyName}`);
        else if (age <= 5) notes.push(`طفل دون 5 سنوات: ${p.firstName} ${p.familyName}`);
      }

      return {
        id: head.id,
        nationalId: head.nationalId,
        firstName: head.firstName,
        fatherName: head.fatherName,
        grandfatherName: head.grandfatherName,
        familyName: head.familyName,
        phoneNumber1: head.phoneNumber1,
        phoneNumber2: head.phoneNumber2,
        tentNumber: head.tentNumber,
        familySize: parseInt(head.memberCount) + 1, // include head
        notes: notes.join(' | '),
      };
    }));

    return successResponse({ data, total: data.length });
  } catch (error) {
    return errorResponse('فشل في جلب بيانات الأسر', 500, String(error));
  }
}