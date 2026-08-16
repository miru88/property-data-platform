import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { State, Municipality, AdapterType } from './index';

@Entity('source')
export class Source {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    stateId!: number;    

    @ManyToOne(() => State)
    @JoinColumn({ name: "stateId" })
    state!: State;

    @Column({ nullable: true })
    municipalityId?: number;

    @ManyToOne(() => Municipality, { nullable: true })
    @JoinColumn({ name: 'municipalityId' })
    municipality?: Municipality;

    @Column()
    adapterTypeId!: number;

    @ManyToOne(() => AdapterType, { nullable: false })
    @JoinColumn({ name: 'adapterTypeId' })
    adapterType!: AdapterType;

    @Column({ type: 'jsonb', default: {} })
    config!: object;

    @Column({nullable: false, default: true})
    isActive!: boolean;


}
