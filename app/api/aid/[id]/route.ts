// app/api/aid/[id]/route.ts
import { NextRequest } from 'next/server';
import { getDataSource } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ds = await getDataSource();

    const rows = (await ds.query(
      `SELECT a.*, h.firstName as h_firstName, h.familyName as h_familyName
       FROM aid_records a
       LEFT JOIN residents h ON h.id = a.headOfHouseholdId
       WHERE a.id = ?`,
      [id]
    )) as any[];

    if (rows.length === 0) {
      return errorResponse('سجل المساعدة غير موجود', 404);
    }

    return successResponse(rows[0]);
  } catch (error) {
    return errorResponse('فشل في جلب البيانات', 500, String(error));
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ds = await getDataSource();
    const body = await req.json();

    const existing = (await ds.query(
      'SELECT * FROM aid_records WHERE id = ?',
      [id]
    )) as any[];

    if (existing.length === 0) {
      return errorResponse('سجل المساعدة غير موجود', 404);
    }

    const cur = existing[0];

    await ds.query(
      `UPDATE aid_records
       SET aidType=?, amount=?, aidDate=?, source=?, notes=?
       WHERE id=?`,
      [
        body.aidType ?? cur.aidType,
        body.amount ?? cur.amount,
        body.aidDate ?? cur.aidDate,
        body.source ?? cur.source,
        body.notes ?? cur.notes,
        id,
      ]
    );

    const updated = (await ds.query(
      'SELECT * FROM aid_records WHERE id = ?',
      [id]
    )) as any[];

    return successResponse(updated[0]);
  } catch (error) {
    return errorResponse('فشل في تحديث المساعدة', 500, String(error));
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ds = await getDataSource();

    const existing = (await ds.query(
      'SELECT id FROM aid_records WHERE id = ?',
      [id]
    )) as any[];

    if (existing.length === 0) {
      return errorResponse('سجل المساعدة غير موجود', 404);
    }

    await ds.query('DELETE FROM aid_records WHERE id = ?', [id]);

    return successResponse({
      message: 'تم حذف سجل المساعدة بنجاح',
    });
  } catch (error) {
    return errorResponse('فشل في حذف المساعدة', 500, String(error));
  }
}