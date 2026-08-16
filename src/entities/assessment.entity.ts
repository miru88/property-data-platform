import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Parcel , IngestionRun } from './index';

@Entity('assessment')
@Unique(['parcelId', 'fiscalYear'])
export class Assessment {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: false })
    parcelId!: number;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcelId' })
    parcel!: Parcel;

    @Column({ nullable: false })
    fiscalYear!: number;

    @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
    assessedTotal?: number;

    @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
    assessedLand?: number;

    @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
    assessedBuilding?: number;

    @Column({ nullable: true })
    ownerName?: string;

    @Column({ nullable: true })
    ownerAddress?: string;

    @Column({ nullable: false })
    ingestionRunId!: number;

    @ManyToOne(() => IngestionRun)
    @JoinColumn({ name: 'ingestionRunId' })
    ingestionRun!: IngestionRun;

}