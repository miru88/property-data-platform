import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { State, Municipality, AdapterType, Source } from './index';

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
