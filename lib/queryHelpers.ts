export async function findResidents(ds: any, options: {
  where?: string;
  params?: any[];
  limit?: number;
  offset?: number;
  orderBy?: string;
} = {}) {
  const where = options.where ? `WHERE ${options.where}` : '';
  const order = options.orderBy ? `ORDER BY ${options.orderBy}` : 'ORDER BY r.createdAt DESC';
  const limit = options.limit !== undefined ? `LIMIT ${options.limit}` : '';
  const offset = options.offset !== undefined ? `OFFSET ${options.offset}` : '';

  const sql = `
    SELECT r.*,
      h.id as h_id, h.firstName as h_firstName, h.fatherName as h_fatherName,
      h.familyName as h_familyName, h.nationalId as h_nationalId,
      h.tentNumber as h_tentNumber, h.phoneNumber1 as h_phoneNumber1
    FROM residents r
    LEFT JOIN residents h ON h.id = r.headOfHouseholdId
    ${where} ${order} ${limit} ${offset}
  `;

  const rows = await ds.query(sql, options.params ?? []) as any[];
  return rows.map(mapRow);
}

export async function countResidents(ds: any, options: {
  where?: string;
  params?: any[];
} = {}) {
  const where = options.where ? `WHERE ${options.where}` : '';
  const sql = `SELECT COUNT(*) as cnt FROM residents r ${where}`;
  const result = await ds.query(sql, options.params ?? []) as any[];
  return parseInt(result[0].cnt);
}

export function mapRow(r: any) {
  const age = calculateAge(r.dateOfBirth);
  const headOfHousehold = r.h_id ? {
    id: r.h_id,
    firstName: r.h_firstName,
    fatherName: r.h_fatherName,
    familyName: r.h_familyName,
    nationalId: r.h_nationalId,
    tentNumber: r.h_tentNumber,
    phoneNumber1: r.h_phoneNumber1,
  } : null;

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
    headOfHousehold,
    age,
    isElderly: age >= 60,
    isChildUnder2: age <= 2,
    isChildUnder5: age <= 5,
  };
}

export function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}