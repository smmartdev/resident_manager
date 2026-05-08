import { calculateAge } from '@/lib/queryHelpers';

export function enrichResident(resident: any) {
  const age = calculateAge(resident.dateOfBirth);
  return {
    ...resident,
    age,
    isElderly: age >= 60,
    isChildUnder2: age <= 2,
    isChildUnder5: age <= 5,
    tentNumber: resident.tentNumber ?? resident.headOfHousehold?.tentNumber ?? null,
  };
}

export function enrichResidents(residents: any[]) {
  return residents.map(enrichResident);
}