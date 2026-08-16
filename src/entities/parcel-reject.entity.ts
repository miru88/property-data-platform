import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Unique
} from 'typeorm';

import { IngestionRun } from './index';

@Entity('parcel_reject')
export class ParcelReject {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({nullable: false})
    injestionRunId!: number;

    @ManyToOne(() => IngestionRun, {nullable: false})
    @JoinColumn({name: 'injestionRunId'})
    injestionRun!: IngestionRun;

}
