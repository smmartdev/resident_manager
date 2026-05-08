import { calculateAge } from '@/lib/queryHelpers';

export async function getElderlyResidents(ds: any) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 60);
  const rows = await ds.query(
    `SELECT r.*, h.tentNumber as h_tentNumber FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.dateOfBirth <= ?
     ORDER BY r.dateOfBirth ASC`,
    [cutoff]
  ) as any[];
  return rows.map(mapResident);
}

export async function getChronicDiseaseResidents(ds: any) {
  const rows = await ds.query(
    `SELECT r.*, h.tentNumber as h_tentNumber FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.hasChronicDisease = 1
     ORDER BY r.familyName ASC`
  ) as any[];
  return rows.map(mapResident);
}

export async function getPregnantResidents(ds: any) {
  const rows = await ds.query(
    `SELECT r.*, h.tentNumber as h_tentNumber FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.isPregnant = 1
     ORDER BY r.familyName ASC`
  ) as any[];
  return rows.map(mapResident);
}

export async function getBreastfeedingResidents(ds: any) {
  const rows = await ds.query(
    `SELECT r.*, h.tentNumber as h_tentNumber FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.isBreastfeeding = 1
     ORDER BY r.familyName ASC`
  ) as any[];
  return rows.map(mapResident);
}

export async function getChildrenUnder(ds: any, years: 2 | 5) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  const rows = await ds.query(
    `SELECT r.*, h.tentNumber as h_tentNumber FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.dateOfBirth > ?
     ORDER BY r.dateOfBirth DESC`,
    [cutoff]
  ) as any[];
  return rows.map(mapResident);
}

export async function getHouseholdsWithNoAid(ds: any, days: number) {
  const rows = await ds.query(
    `SELECT r.*,
       (SELECT MAX(a.aidDate) FROM aid_records a WHERE a.headOfHouseholdId = r.id) as lastAidDate
     FROM residents r
     WHERE r.isActive = 1 AND r.relationToHead = 'head'
     HAVING lastAidDate IS NULL OR lastAidDate < DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY lastAidDate ASC`,
    [days]
  ) as any[];

  return rows.map((h: any) => ({
    ...mapResident(h),
    lastAidDate: h.lastAidDate ?? null,
    daysSinceLastAid: h.lastAidDate
      ? Math.floor((Date.now() - new Date(h.lastAidDate).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export async function getHouseholdAidReport(ds: any, days: number) {
  const rows = await ds.query(
    `SELECT a.*,
       h.id as headId, h.firstName as headFirstName, h.fatherName as headFatherName,
       h.familyName as headFamilyName, h.nationalId as headNationalId,
       h.tentNumber as headTentNumber, h.phoneNumber1 as headPhone
     FROM aid_records a
     LEFT JOIN residents h ON h.id = a.headOfHouseholdId
     WHERE a.aidDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY h.familyName ASC, a.aidDate DESC`,
    [days]
  ) as any[];

  const grouped: Record<number, { head: any; records: any[] }> = {};
  for (const row of rows) {
    const hid = row.headOfHouseholdId;
    if (!grouped[hid]) {
      grouped[hid] = {
        head: {
          id: row.headId,
          firstName: row.headFirstName,
          fatherName: row.headFatherName,
          familyName: row.headFamilyName,
          nationalId: row.headNationalId,
          tentNumber: row.headTentNumber,
          phoneNumber1: row.headPhone,
        },
        records: [],
      };
    }
    grouped[hid].records.push({
      id: row.id,
      aidType: row.aidType,
      amount: row.amount,
      aidDate: row.aidDate,
      source: row.source,
      notes: row.notes,
    });
  }
  return Object.values(grouped);
}

function mapResident(r: any) {
  const age = calculateAge(r.dateOfBirth);
  return {
    id: r.id,
    nationalId: r.nationalId,
    firstName: r.firstName,
    fatherName: r.fatherName,
    grandfatherName: r.grandfatherName,
    familyName: r.familyName,
    gender: r.gender,
    dateOfBirth: r.dateOfBirth,
    maritalStatus: r.maritalStatus,
    phoneNumber1: r.phoneNumber1,
    phoneNumber2: r.phoneNumber2,
    hasChronicDisease: r.hasChronicDisease === 1 || r.hasChronicDisease === true,
    chronicDiseaseDescription: r.chronicDiseaseDescription,
    hasDisability: r.hasDisability === 1 || r.hasDisability === true,
    disabilityType: r.disabilityType,
    isPregnant: r.isPregnant === 1 || r.isPregnant === true,
    isBreastfeeding: r.isBreastfeeding === 1 || r.isBreastfeeding === true,
    tentNumber: r.tentNumber ?? r.h_tentNumber ?? null,
    headOfHouseholdId: r.headOfHouseholdId,
    relationToHead: r.relationToHead,
    isActive: r.isActive === 1 || r.isActive === true,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    age,
    isElderly: age >= 60,
    isChildUnder2: age <= 2,
    isChildUnder5: age <= 5,
  };
}