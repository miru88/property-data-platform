import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Parcel } from './index';


@Entity('sale')
@Unique(['parcelId', 'saleDate', 'salePrice'])
export class Sale {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: false })
    parcelId!: number;

    @ManyToOne(() => Parcel)
    @JoinColumn({ name: 'parcelId' })
    parcel!: Parcel;

    @Column({nullable: true})
    saleDate?: Date;

    @Column({nullable: true})
    salePrice?: number

    @Column({nullable: true})
    bookPage?: string;


}
