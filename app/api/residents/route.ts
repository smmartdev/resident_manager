import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  parseIntParam,
} from '@/lib/apiHelpers';

import {
  findResidents,
  countResidents,
  mapRow,
} from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const { searchParams } = req.nextUrl;

    const page = parseIntParam(searchParams.get('page'), 1);
    const pageSize = parseIntParam(
      searchParams.get('pageSize'),
      20
    );

    const search = searchParams.get('search') || '';
    const headOnly =
      searchParams.get('headOnly') === 'true';

    const gender = searchParams.get('gender');
    const isActive = searchParams.get('isActive');

    const conditions: string[] = [];
    const params: any[] = [];

    if (headOnly) {
      conditions.push("r.relationToHead = 'head'");
    }

    if (gender) {
      conditions.push('r.gender = ?');
      params.push(gender);
    }

    if (isActive !== null && isActive !== '') {
      conditions.push('r.isActive = ?');
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      conditions.push(`
        (
          r.firstName LIKE ?
          OR r.fatherName LIKE ?
          OR r.familyName LIKE ?
          OR r.nationalId LIKE ?
          OR r.phoneNumber1 LIKE ?
        )
      `);

      const s = `%${search}%`;

      params.push(s, s, s, s, s);
    }

    const where =
      conditions.length > 0
        ? conditions.join(' AND ')
        : undefined;

    const [data, total] = await Promise.all([
      findResidents(ds, {
        where,
        params,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),

      countResidents(ds, {
        where,
        params,
      }),
    ]);

    return successResponse({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return errorResponse(
      'فشل في جلب البيانات',
      500,
      String(error)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const body = await req.json();

    const required = [
      'nationalId',
      'firstName',
      'fatherName',
      'grandfatherName',
      'familyName',
      'gender',
      'dateOfBirth',
      'maritalStatus',
      'phoneNumber1',
    ];

    for (const field of required) {
      if (!body[field]) {
        return errorResponse(
          `الحقل ${field} مطلوب`,
          400
        );
      }
    }

    const existing = (await ds.query(
      'SELECT id FROM residents WHERE nationalId = ?',
      [body.nationalId]
    )) as any[];

    if (existing.length > 0) {
      return errorResponse(
        'رقم الهوية مسجل مسبقاً',
        409
      );
    }

    if (
      body.relationToHead !== 'head' &&
      !body.headOfHouseholdId
    ) {
      return errorResponse(
        'يجب تحديد رب الأسرة لأفراد العائلة',
        400
      );
    }

    if (
      !body.relationToHead ||
      body.relationToHead === 'head'
    ) {
      body.headOfHouseholdId = null;
      body.relationToHead = 'head';
    } else {
      const head = (await ds.query(
        'SELECT id, relationToHead FROM residents WHERE id = ?',
        [body.headOfHouseholdId]
      )) as any[];

      if (head.length === 0) {
        return errorResponse(
          'رب الأسرة غير موجود',
          404
        );
      }

      if (head[0].relationToHead !== 'head') {
        return errorResponse(
          'المحدد كرب أسرة ليس رب أسرة فعلياً',
          400
        );
      }
    }

    const result = (await ds.query(
      `INSERT INTO residents (
        nationalId,
        firstName,
        fatherName,
        grandfatherName,
        familyName,
        gender,
        dateOfBirth,
        maritalStatus,
        phoneNumber1,
        phoneNumber2,
        relationToHead,
        headOfHouseholdId,
        tentNumber,
        hasChronicDisease,
        chronicDiseaseDescription,
        hasDisability,
        disabilityType,
        isPregnant,
        isBreastfeeding,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        body.nationalId,
        body.firstName,
        body.fatherName,
        body.grandfatherName,
        body.familyName,
        body.gender,
        body.dateOfBirth,
        body.maritalStatus,
        body.phoneNumber1,
        body.phoneNumber2 || null,
        body.relationToHead,
        body.headOfHouseholdId || null,
        body.tentNumber || null,
        body.hasChronicDisease ? 1 : 0,
        body.chronicDiseaseDescription || null,
        body.hasDisability ? 1 : 0,
        body.disabilityType || null,
        body.isPregnant ? 1 : 0,
        body.isBreastfeeding ? 1 : 0,
      ]
    )) as any;

    const saved = (await ds.query(
      'SELECT * FROM residents WHERE id = ?',
      [result.insertId]
    )) as any[];

    return successResponse(
      mapRow(saved[0]),
      201
    );
  } catch (error) {
    return errorResponse(
      'فشل في إضافة المقيم',
      500,
      String(error)
    );
  }
}