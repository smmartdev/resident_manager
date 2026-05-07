import { Resident } from '@/entities/Resident';

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function enrichResident(resident: Resident) {
  const age = calculateAge(resident.dateOfBirth);
  return {
    ...resident,
    age,
    isElderly: age >= 60,
    isChildUnder2: age <= 2,
    isChildUnder5: age <= 5,
    tentNumber: resident.tentNumber ?? (resident.headOfHousehold as any)?.tentNumber ?? null,
  };
}

export function enrichResidents(residents: Resident[]) {
  return residents.map(enrichResident);
}