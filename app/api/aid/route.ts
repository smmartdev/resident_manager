// app/api/aid/route.ts
import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  parseIntParam,
} from '@/lib/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();
    const { searchParams } = req.nextUrl;

    const page = parseIntParam(searchParams.get('page'), 1);
    const pageSize = parseIntParam(searchParams.get('pageSize'), 20);
    const headId = searchParams.get('headId');
    const aidType = searchParams.get('aidType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const conditions: string[] = [];
    const params: any[] = [];

    if (headId) {
      conditions.push('a.headOfHouseholdId = ?');
      params.push(headId);
    }

    if (aidType) {
      conditions.push('a.aidType = ?');
      params.push(aidType);
    }

    if (fromDate) {
      conditions.push('a.aidDate >= ?');
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push('a.aidDate <= ?');
      params.push(toDate);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const offset = (page - 1) * pageSize;

    const [rowsRaw, countRaw] = await Promise.all([
      ds.query(
        `SELECT a.*, h.firstName as h_firstName, h.fatherName as h_fatherName,
                h.familyName as h_familyName, h.nationalId as h_nationalId,
                h.tentNumber as h_tentNumber
         FROM aid_records a
         LEFT JOIN residents h ON h.id = a.headOfHouseholdId
         ${where}
         ORDER BY a.aidDate DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),

      ds.query(
        `SELECT COUNT(*) as cnt
         FROM aid_records a
         ${where}`,
        params
      ),
    ]);

    const rows = rowsRaw as any[];
    const countResult = countRaw as any[];

    const data = rows.map((r: any) => ({
      ...r,
      headOfHousehold: r.h_firstName
        ? {
            id: r.headOfHouseholdId,
            firstName: r.h_firstName,
            fatherName: r.h_fatherName,
            familyName: r.h_familyName,
            nationalId: r.h_nationalId,
            tentNumber: r.h_tentNumber,
          }
        : null,
    }));

    const total = parseInt(countResult[0].cnt);

    return successResponse({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return errorResponse(
      'فشل في جلب سجلات المساعدات',
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
      'headOfHouseholdId',
      'aidType',
      'aidDate',
      'source',
    ];

    for (const field of required) {
      if (!body[field]) {
        return errorResponse(`الحقل ${field} مطلوب`, 400);
      }
    }

    const head = (await ds.query(
      'SELECT id, relationToHead FROM residents WHERE id = ?',
      [body.headOfHouseholdId]
    )) as any[];

    if (head.length === 0) {
      return errorResponse('رب الأسرة غير موجود', 404);
    }

    if (head[0].relationToHead !== 'head') {
      return errorResponse(
        'يجب ربط المساعدة برب الأسرة فقط',
        400
      );
    }

    const result = (await ds.query(
      `INSERT INTO aid_records
       (headOfHouseholdId, aidType, amount, aidDate, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        body.headOfHouseholdId,
        body.aidType,
        body.amount || null,
        body.aidDate,
        body.source,
        body.notes || null,
      ]
    )) as any;

    const saved = (await ds.query(
      'SELECT * FROM aid_records WHERE id = ?',
      [result.insertId]
    )) as any[];

    return successResponse(saved[0], 201);
  } catch (error) {
    return errorResponse(
      'فشل في تسجيل المساعدة',
      500,
      String(error)
    );
  }
}