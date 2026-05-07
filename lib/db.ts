import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '@/entities/User';
import { Resident } from '@/entities/Resident';
import { AidRecord } from '@/entities/AidRecord';

let dataSource: DataSource | null = null;

async function initDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'resident_manager_db',
    synchronize: false,
    logging: false,
    entities: [User, Resident, AidRecord],
    charset: 'utf8mb4',
    timezone: '+00:00',
    extra: {
      decimalNumbers: true,
      connectionLimit: 10,
    },
  });

  await dataSource.initialize();
  return dataSource;
}

export async function getDataSource(): Promise<DataSource> {
  return await initDataSource();
}

export default initDataSource;