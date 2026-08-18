import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Municipality } from './municipality.entity';


@Entity('municipality_tax_data')
@Unique(['municipalityId', 'fiscalYear'])
export class MunicpalityTaxData {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({nullable: false})
    municipalityId!: number;

    @ManyToOne(() => Municipality)
    @JoinColumn({ name: "municipalityId" })    
    municipality!: Municipality;

    @Column({nullable: false})
    fiscalYear!: number;

    @Column({nullable: true})
    residentialTaxRate?: number;

    @Column({nullable: true})
    commercialTaxRate?: number;

    @Column({nullable: false})
    assessmentRatio!: number;

    @Column({nullable: false})
    rateBasis!: string;

}
