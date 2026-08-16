import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Source } from './index';

enum IngestionRunStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

@Entity('ingestion_run')
export class IngestionRun {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    sourceId!: number;

    @ManyToOne(() => Source)
    @JoinColumn({ name: "sourceId" })
    source!: Source;

    @Column({type: 'enum', enum: IngestionRunStatus})
    status!: IngestionRunStatus;

    @CreateDateColumn({nullable: false})
    startedAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    finishedAt?: Date;

    @Column({ nullable: true })
    rawSnapshotKey?: string;

    @Column({ nullable: false })
    recordsSeen!: number;

    @Column({ nullable: false })
    recordsUpserted!: number;

    @Column({ nullable: false })
    recordsRejected!: number;

    @Column({ type: 'jsonb', default: {} })
    errorDetail!: object;


}
