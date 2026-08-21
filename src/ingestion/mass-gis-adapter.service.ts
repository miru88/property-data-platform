import { Injectable } from '@nestjs/common';
import * as MASS_GIS_CONSTANTS from './mass-gis-adapter.constants'
import { Adapter, ArcGisQueryResponse } from './mass-gis-adapter.types';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { Municipality, Source, State } from '../entities';



@Injectable()
export class MassGisAdapterService implements Adapter{

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(Municipality)
        private readonly municipalityRepository: Repository<Municipality>,
        @InjectRepository(State)
        private readonly stateRepository: Repository<State>,
        @InjectRepository(Source)
        private readonly sourceRepository: Repository<Source>) {}

    public async attemptDataPull(): Promise<void> {

        const massachusetts: State | null = await this.stateRepository.findOneBy({name: Equal(MASS_GIS_CONSTANTS.MASSACHUSETTS)});

        if(massachusetts) {
            const townNames: string[] = massachusetts.municipalities.map((municipality: Municipality) =>  municipality.name);

            for(let townName of townNames) {
                await this.fetchAllParcels(townName);
            }
        }
        else {
            throw new Error('State not found, fetching aborted.')
        }


    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async fetchAllParcels(townName: string): Promise<Record<string, unknown>[]> {

        const allRecords: Record<string, unknown>[] = [];
        let rowOffset: number = 0;
        let hasMoreRows: boolean = true;

        while (hasMoreRows) {
            console.log(`Fetching offset ${rowOffset}...`);
            const page: ArcGisQueryResponse = await this.fetchPageWithRetry(rowOffset, 0, townName);

            const records: Record<string, unknown>[] = page.features.map((f) => f.attributes);
            allRecords.push(...records);

            hasMoreRows = page.exceededTransferLimit === true || records.length === MASS_GIS_CONSTANTS.PAGE_SIZE;
            rowOffset += records.length;

            if (records.length === 0) {
            hasMoreRows = false;
            }
        }

        console.log(`Done. Fetched ${allRecords.length} records for ${townName}.`);
        return allRecords;
    }

    async fetchPageWithRetry(
        offset: number,
        attempt: number = 1,
        townName: string,
        ): Promise<ArcGisQueryResponse> {
    
        const params: URLSearchParams = new URLSearchParams({
            where: `CITY='${townName}'`,
            outFields: '*',
            returnGeometry: 'false',
            resultOffset: String(offset),
            resultRecordCount: String(MASS_GIS_CONSTANTS.PAGE_SIZE),
            f: 'json',
        });

        const url: string = `${MASS_GIS_CONSTANTS.FEATURE_SERVER_URL}/${MASS_GIS_CONSTANTS.LAYER_INDEX}/query?${params.toString()}`;

        try {
            const response: axios.AxiosResponse<any, any, {}, any> = await this.httpService.axiosRef.get(url);
            const data: ArcGisQueryResponse = response.data;
            return data;
        } catch (err) {

            if (attempt >= MASS_GIS_CONSTANTS.MAX_RETRIES) {

                throw new Error(`Failed after ${MASS_GIS_CONSTANTS.MAX_RETRIES} attempts at offset ${offset}: ${(err as Error).message}`);

            }

            const backoff: number = MASS_GIS_CONSTANTS.BASE_BACKOFF_MS * 2 ** (attempt - 1);

            console.warn(`Failed at offset ${offset}: ${(err as Error).message}`);
            
            await this.sleep(backoff);
            return this.fetchPageWithRetry(offset, attempt + 1, townName);
        }
    }

}
