import { Injectable } from '@nestjs/common';
import * as FETCH_PARAMS from './mass-gis-adapter.constants'
import { Adapter, ArcGisQueryResponse } from './mass-gis-adapter.types';
import { HttpService } from '@nestjs/axios';



@Injectable()
export class MassGisAdapterService implements Adapter{

    constructor(private readonly httpService: HttpService) {}


    async fetchAllParcels(): Promise<Record<string, unknown>[]> {

        const allRecords: Record<string, unknown>[] = [];
        let rowOffset: number = 0;
        let hasMoreRows: boolean = true;

        while (hasMoreRows) {
            console.log(`Fetching offset ${rowOffset}...`);
            const page = await fetchPageWithRetry(rowOffset);

            const records = page.features.map((f) => f.attributes);
            allRecords.push(...records);

            hasMoreRows = page.exceededTransferLimit === true || records.length === FETCH_PARAMS.PAGE_SIZE;
            hasMoreRows += records.length;

            if (records.length === 0) {
            hasMoreRows = false;
            }
        }

        console.log(`Done. Fetched ${allRecords.length} records for ${TOWN}.`);
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
        resultRecordCount: String(FETCH_PARAMS.PAGE_SIZE),
        f: 'json',
    });

    const url: string = `${FETCH_PARAMS.FEATURE_SERVER_URL}/${FETCH_PARAMS.LAYER_INDEX}/query?${params.toString()}`;

    try {
        const response = await this.httpService.axiosRef.get(url);

        if (!response.headers) { // need to change the way we do this, const data: ArcGisQueryResponse = response.data; the throw automatically happens with nestjs axios
        throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as ArcGisQueryResponse;

        if (data.error) {
        throw new Error(`ArcGIS error ${data.error.code}: ${data.error.message}`);
        }

        return data;
    } catch (err) {
        if (attempt >= FETCH_PARAMS.MAX_RETRIES) {
        throw new Error(
            `Failed after ${FETCH_PARAMS.MAX_RETRIES} attempts at offset ${offset}: ${(err as Error).message}`,
        );
        }

        const backoff = FETCH_PARAMS.BASE_BACKOFF_MS * 2 ** (attempt - 1);
        console.warn(
        `Attempt ${attempt} failed at offset ${offset} (${(err as Error).message}), retrying in ${backoff}ms...`,
        );
        await sleep(backoff);
        return fetchPageWithRetry(offset, attempt + 1);
    }
    }

}
