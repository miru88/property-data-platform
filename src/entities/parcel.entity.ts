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

import { Source, Municipality } from './index';

@Entity('parcel')
@Unique(['municipalityId', 'sourceParcelId'])
export class Parcel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    municipalityId!: number;

    @ManyToOne(() => Municipality, { nullable: true })
    @JoinColumn({ name: 'municipalityId' })
    municipality?: Municipality;

    @Column({ nullable: false })
    sourceParcelId!: string;

    @Column({ nullable: true })
    locationId?: string;

    @Column({ nullable: true })
    siteAddress?: string;

    @Column({ nullable: true })
    stateUseCode?: string;

    @Column({ nullable: true })
    lotSizeAcres?: string;

    @Column({ nullable: true })
    unitCount?: number;

    @Column({ nullable: true })
    yearBuilt?: number;

    @Column({ type: 'jsonb', default: {} })
    extraAttributes!: object;
}
