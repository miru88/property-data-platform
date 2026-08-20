import { Source } from '../entities/index'

export interface Adapter {
    // fetchData(source: Source): Promise<RawSnapshot>;

}

export interface ArcGisQueryResponse {
  features: Array<{ attributes: Record<string, unknown> }>;
  exceededTransferLimit?: boolean;
  error?: { code: number; message: string };
}