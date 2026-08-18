import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {  Source } from './index';

@Entity('source_schedule')
export class SourceSchedule {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    sourceId!: number;

    @ManyToOne(() => Source)
    @JoinColumn({ name: "sourceId" })
    source!: Source;

    @Column({ nullable: false })
    dayOfMonth!: number;

    @Column({ nullable: false })
    hour!: number;

    @Column({ nullable: false, default: 0 })
    minute!: number





}
