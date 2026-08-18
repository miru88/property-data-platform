import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';

import { Source } from './index';
@Entity('source_field')
@Unique(['sourceId','fieldId'])
export class SourceField {

    @PrimaryGeneratedColumn()
    id!: number;    

    @Column()
    sourceId!: number;

    @ManyToOne(() => Source)
    @JoinColumn({ name: "sourceId" })
    source!: Source;

    @Column({nullable: false})
    fieldId!: string;

    @Column({nullable: false, default: false})
    isMapped!: boolean;

    @Column({ type: 'timestamptz', nullable: false })
    firstSeenAt!: Date;
}
