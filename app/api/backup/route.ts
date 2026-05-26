import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getDataSource } from '@/lib/db';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  try {
    const ds = await getDataSource();

    // Export all tables as JSON
    const [residents, aidRecords] = await Promise.all([
      ds.query('SELECT * FROM residents') as Promise<any[]>,
      ds.query('SELECT * FROM aid_records') as Promise<any[]>,
    ]);

    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      database: process.env.DB_NAME || 'resident_manager_db',
      tables: {
        residents,
        aid_records: aidRecords,
      },
      counts: {
        residents: residents.length,
        aid_records: aidRecords.length,
      },
    };

    const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في إنشاء النسخة الاحتياطية', detail: String(error) },
      { status: 500 }
    );
  }
}