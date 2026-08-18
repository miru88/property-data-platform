import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('adapter_type')
export class AdapterType {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({nullable: false})
    code!: string;

    @Column({nullable: false})
    name!: string;

}
