import { Injectable } from '@nestjs/common';
import * as FETCH_PARAMS from '../constants/fetchParams.constants'
import { Adapter } from '../interfaces/adapter.interface';



interface ArcGisQueryResponse {
  features: Array<{ attributes: Record<string, unknown> }>;
  exceededTransferLimit?: boolean;
  error?: { code: number; message: string };
}

const FEATURE_SERVER_URL: string =
  'https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Property_Tax_Parcels/FeatureServer';

@Injectable()
export class MassGisAdapterService implements Adapter{

    constructor() {}

    private async getTowns(): Promise<string[]> {
        
        


        return [];
    }

    private async fetchPageWithRetry(offset: number, attempt: number = 1): Promise<ArcGisQueryResponse> {
    const params = new URLSearchParams({
        where: `CITY='${TOWN}'`,
        outFields:
        'PROP_ID,LOC_ID,CITY,SITE_ADDR,OWNER1,OWN_ADDR,LAND_VAL,BLDG_VAL,TOTAL_VAL,FY,LOT_SIZE,LS_DATE,LS_PRICE,USE_CODE,YEAR_BUILT,BLD_AREA,UNITS,ZONING',
        returnGeometry: 'false',
        resultOffset: String(offset),
        resultRecordCount: String(FETCH_PARAMS.PAGE_SIZE),
        f: 'json',
    });

    const url = `${FEATURE_SERVER_URL}/${FETCH_PARAMS.LAYER_INDEX}/query?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as ArcGisQueryResponse;

        if (data.error) {
        throw new Error(`ArcGIS error ${data.error.code}: ${data.error.message}`);
        }

        return data;
    } catch (err) {
        if (attempt >= MAX_RETRIES) {
        throw new Error(
            `Failed after ${MAX_RETRIES} attempts at offset ${offset}: ${(err as Error).message}`,
        );
        }

        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        console.warn(
        `Attempt ${attempt} failed at offset ${offset} (${(err as Error).message}), retrying in ${backoff}ms...`,
        );
        await sleep(backoff);
        return fetchPageWithRetry(offset, attempt + 1);
    }
    }

}
