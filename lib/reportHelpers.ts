import { DataSource } from 'typeorm';
import { enrichResidents, enrichResident } from '@/lib/residentHelpers';

export async function getElderlyResidents(ds: DataSource) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 60);

  const residents = await ds.query(
    `SELECT r.*, h.tentNumber as headTentNumber, h.firstName as headFirstName, h.familyName as headFamilyName
     FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.dateOfBirth <= ?
     ORDER BY r.dateOfBirth ASC`,
    [cutoff]
  );
  return residents.map(mapResident);
}

export async function getChronicDiseaseResidents(ds: DataSource) {
  const residents = await ds.query(
    `SELECT r.*, h.tentNumber as headTentNumber
     FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.hasChronicDisease = 1
     ORDER BY r.familyName ASC`
  );
  return residents.map(mapResident);
}

export async function getPregnantResidents(ds: DataSource) {
  const residents = await ds.query(
    `SELECT r.*, h.tentNumber as headTentNumber
     FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.isPregnant = 1
     ORDER BY r.familyName ASC`
  );
  return residents.map(mapResident);
}

export async function getBreastfeedingResidents(ds: DataSource) {
  const residents = await ds.query(
    `SELECT r.*, h.tentNumber as headTentNumber
     FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.isBreastfeeding = 1
     ORDER BY r.familyName ASC`
  );
  return residents.map(mapResident);
}

export async function getChildrenUnder(ds: DataSource, years: 2 | 5) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);

  const residents = await ds.query(
    `SELECT r.*, h.tentNumber as headTentNumber
     FROM residents r
     LEFT JOIN residents h ON h.id = r.headOfHouseholdId
     WHERE r.isActive = 1 AND r.dateOfBirth > ?
     ORDER BY r.dateOfBirth DESC`,
    [cutoff]
  );
  return residents.map(mapResident);
}

export async function getHouseholdsWithNoAid(ds: DataSource, days: number) {
  const heads = await ds.query(
    `SELECT r.*,
       (SELECT MAX(a.aidDate) FROM aid_records a WHERE a.headOfHouseholdId = r.id) as lastAidDate
     FROM residents r
     WHERE r.isActive = 1 AND r.relationToHead = 'head'
     HAVING lastAidDate IS NULL OR lastAidDate < DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY lastAidDate ASC`,
    [days]
  );

  return heads.map((h: any) => ({
    ...mapResident(h),
    lastAidDate: h.lastAidDate ?? null,
    daysSinceLastAid: h.lastAidDate
      ? Math.floor((Date.now() - new Date(h.lastAidDate).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

export async function getHouseholdAidReport(ds: DataSource, days: number) {
  const records = await ds.query(
    `SELECT a.*, 
       h.id as headId, h.firstName as headFirstName, h.fatherName as headFatherName,
       h.familyName as headFamilyName, h.nationalId as headNationalId,
       h.tentNumber as headTentNumber, h.phoneNumber1 as headPhone
     FROM aid_records a
     LEFT JOIN residents h ON h.id = a.headOfHouseholdId
     WHERE a.aidDate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY h.familyName ASC, a.aidDate DESC`,
    [days]
  );

  const grouped: Record<number, { head: any; records: any[] }> = {};

  for (const row of records) {
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
    ...r,
    age,
    isElderly: age >= 60,
    isChildUnder2: age <= 2,
    isChildUnder5: age <= 5,
    tentNumber: r.tentNumber ?? r.headTentNumber ?? null,
    hasChronicDisease: r.hasChronicDisease === 1 || r.hasChronicDisease === true,
    hasDisability: r.hasDisability === 1 || r.hasDisability === true,
    isPregnant: r.isPregnant === 1 || r.isPregnant === true,
    isBreastfeeding: r.isBreastfeeding === 1 || r.isBreastfeeding === true,
    isActive: r.isActive === 1 || r.isActive === true,
  };
}

function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}