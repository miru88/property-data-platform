import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdapterType, Assessment, IngestionRun, Parcel, ParcelReject, Source } from '../entities';
import { MassGisAdapterService } from './mass-gis-adapter.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [TypeOrmModule.forFeature([
        Source,
        IngestionRun,
        Parcel,
        Assessment,
        ParcelReject,
        AdapterType]),
        HttpModule],
    providers:[MassGisAdapterService],
})
export class IngestionModule {}
