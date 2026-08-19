export interface Adapter {
    getTowns(): Promise<string[]>;
}