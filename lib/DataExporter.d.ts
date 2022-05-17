import { IModelDb } from "@bentley/imodeljs-backend";
export interface Options {
    calculateMassProperties: boolean;
    idColumn: number;
    idColumnIsJsonArray: boolean;
    dropIdColumnFromResult: boolean;
}
export declare class DataExporter {
    private _iModelDb;
    private _outputDir;
    constructor(iModelDb: IModelDb);
    setFolder(folder: string): void;
    private rowToString;
    private makeHeader;
    private calculateMassProps;
    private assignDefaultOptions;
    writeQueryResultsToCsv(ecSql: string, fileName: string, options?: Partial<Options>): Promise<void>;
    private writeQueries;
}
//# sourceMappingURL=DataExporter.d.ts.map