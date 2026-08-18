import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Municipality } from './municipality.entity';


@Entity('state')
export class State {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({unique: true, nullable: false})
    code!: string;

    @Column({nullable: false})
    name!: string;


    @OneToMany(() => Municipality, (municipality) => municipality.state)
    municipalities!: Municipality[];

}
