import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { State } from './state.entity';


@Entity('municipality')
export class Municipality {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    stateId!: number;

    @ManyToOne(() => State)
    @JoinColumn({ name: "stateId" })
    state!: State;

    @Column({nullable: false})
    name!: string;

}
