import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  WIDOWED = 'widowed',
  DIVORCED = 'divorced',
}

export enum RelationToHead {
  HEAD = 'head',
  SPOUSE = 'spouse',
  SON = 'son',
  DAUGHTER = 'daughter',
  FATHER = 'father',
  MOTHER = 'mother',
  BROTHER = 'brother',
  SISTER = 'sister',
  GRANDFATHER = 'grandfather',
  GRANDMOTHER = 'grandmother',
  GRANDSON = 'grandson',
  GRANDDAUGHTER = 'granddaughter',
  OTHER = 'other',
}

@Entity('residents')
export class Resident {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true, charset: 'utf8mb4' })
  nationalId!: string;

  @Column({ type: 'varchar', length: 100, charset: 'utf8mb4' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, charset: 'utf8mb4' })
  fatherName!: string;

  @Column({ type: 'varchar', length: 100, charset: 'utf8mb4' })
  grandfatherName!: string;

  @Column({ type: 'varchar', length: 100, charset: 'utf8mb4' })
  familyName!: string;

  @Column({ type: 'enum', enum: Gender })
  gender!: Gender;

  @Index()
  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({ type: 'enum', enum: MaritalStatus })
  maritalStatus!: MaritalStatus;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber1!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber2!: string | null;

  @Column({ type: 'boolean', default: false })
  hasChronicDisease!: boolean;

  @Column({ type: 'text', nullable: true, charset: 'utf8mb4' })
  chronicDiseaseDescription!: string | null;

  @Column({ type: 'boolean', default: false })
  hasDisability!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, charset: 'utf8mb4' })
  disabilityType!: string | null;

  @Column({ type: 'boolean', default: false })
  isPregnant!: boolean;

  @Column({ type: 'boolean', default: false })
  isBreastfeeding!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true, charset: 'utf8mb4' })
  tentNumber!: string | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  headOfHouseholdId!: number | null;

  @ManyToOne('Resident', 'familyMembers', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'headOfHouseholdId' })
  headOfHousehold!: Resident | null;

  @OneToMany('Resident', 'headOfHousehold')
  familyMembers!: Resident[];

  @Column({ type: 'enum', enum: RelationToHead, default: RelationToHead.HEAD })
  relationToHead!: RelationToHead;

  @OneToMany('AidRecord', 'headOfHousehold')
  aidRecords!: any[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}