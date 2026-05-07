import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index
} from 'typeorm';

export enum AidType {
  CASH = 'cash',
  FOOD = 'food',
  MEDICAL = 'medical',
  CLOTHING = 'clothing',
}

@Entity('aid_records')
export class AidRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'int' })
  headOfHouseholdId!: number;

  @ManyToOne('Resident', 'aidRecords', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'headOfHouseholdId' })
  headOfHousehold!: any;

  @Column({ type: 'enum', enum: AidType })
  aidType!: AidType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount!: number | null;

  @Index()
  @Column({ type: 'date' })
  aidDate!: Date;

  @Column({ type: 'varchar', length: 255, charset: 'utf8mb4' })
  source!: string;

  @Column({ type: 'text', nullable: true, charset: 'utf8mb4' })
  notes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}