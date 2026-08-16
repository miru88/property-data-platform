/**
 * Fetches MassGIS assessor parcel data for one town via the ArcGIS REST API.
 * Handles: pagination, geometry-off to avoid timeouts, retry/backoff for
 * transient failures. Data is an annual/periodic snapshot, not real-time.
 *
 * Verified endpoint (as of Aug 2026, confirmed against mass.gov directly):
 *   https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Property_Tax_Parcels/FeatureServer
 *
 * Confirmed field names (from MassGIS's official Digital Parcel Standard):
 *   PROP_ID, LOC_ID, CITY, SITE_ADDR, OWNER1, OWN_ADDR, LAND_VAL, BLDG_VAL,
 *   TOTAL_VAL, FY, LOT_SIZE, LS_DATE, LS_PRICE, USE_CODE, YEAR_BUILT,
 *   BLD_AREA, UNITS, ZONING
 */

const FEATURE_SERVER_URL =
  'https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Property_Tax_Parcels/FeatureServer';
const LAYER_INDEX = 0; // confirm against {FEATURE_SERVER_URL}/layers if results look wrong

const TOWN = 'EVERETT'; // swap per adapter config later

const PAGE_SIZE = 1000;
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 1000;

interface ArcGisQueryResponse {
  features: Array<{ attributes: Record<string, unknown> }>;
  exceededTransferLimit?: boolean;
  error?: { code: number; message: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPageWithRetry(
  offset: number,
  attempt = 1,
): Promise<ArcGisQueryResponse> {
  const params = new URLSearchParams({
    where: `CITY='${TOWN}'`,
    outFields:
      'PROP_ID,LOC_ID,CITY,SITE_ADDR,OWNER1,OWN_ADDR,LAND_VAL,BLDG_VAL,TOTAL_VAL,FY,LOT_SIZE,LS_DATE,LS_PRICE,USE_CODE,YEAR_BUILT,BLD_AREA,UNITS,ZONING',
    returnGeometry: 'false',
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
    f: 'json',
  });

  const url = `${FEATURE_SERVER_URL}/${LAYER_INDEX}/query?${params.toString()}`;

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

async function fetchAllParcels(): Promise<Record<string, unknown>[]> {
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching offset ${offset}...`);
    const page = await fetchPageWithRetry(offset);

    const records = page.features.map((f) => f.attributes);
    allRecords.push(...records);

    hasMore = page.exceededTransferLimit === true || records.length === PAGE_SIZE;
    offset += records.length;

    if (records.length === 0) {
      hasMore = false;
    }
  }

  console.log(`Done. Fetched ${allRecords.length} records for ${TOWN}.`);
  return allRecords;
}

async function main() {
  const records = await fetchAllParcels();

  const fs = await import('fs/promises');
  const outPath = `massgis-${TOWN.toLowerCase()}-${Date.now()}.json`;
  await fs.writeFile(outPath, JSON.stringify(records, null, 2));
  console.log(`Wrote snapshot to ${outPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
