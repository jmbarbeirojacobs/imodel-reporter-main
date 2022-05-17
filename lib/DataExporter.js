"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataExporter = void 0;
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
const bentleyjs_core_1 = require("@bentley/bentleyjs-core");
const imodeljs_backend_1 = require("@bentley/imodeljs-backend");
const imodeljs_common_1 = require("@bentley/imodeljs-common");
const path = require("path");
const fs = require("fs");
const loggerCategory = "DataExporter";
const defaultOptions = {
    calculateMassProperties: false,
    idColumn: 0,
    idColumnIsJsonArray: false,
    dropIdColumnFromResult: false,
};
class DataExporter {
    constructor(iModelDb) {
        this._iModelDb = iModelDb;
        this._outputDir = path.join(__dirname, "..", "out");
        // initialize logging
        bentleyjs_core_1.Logger.initializeToConsole();
        bentleyjs_core_1.Logger.setLevelDefault(bentleyjs_core_1.LogLevel.Error);
        bentleyjs_core_1.Logger.setLevel(loggerCategory, bentleyjs_core_1.LogLevel.Trace);
    }
    setFolder(folder) {
        this._outputDir = path.join(__dirname, "..", "out", folder);
        if (fs.existsSync(this._outputDir)) {
            try {
                fs.rmdirSync(this._outputDir, { recursive: true });
            }
            catch (error) {
                console.error(error.message);
            }
        }
        try {
            fs.mkdirSync(this._outputDir, { recursive: true });
        }
        catch (error) {
            console.error(error.message);
        }
    }
    rowToString(statement, columnToSkip) {
        const valuesRow = [];
        const replacer = (_key, value) => (value === null) ? undefined : value;
        for (let i = 0; i < statement.getColumnCount(); i++) {
            if (i === columnToSkip) {
                continue;
            }
            const value = statement.getValue(i).value;
            valuesRow.push(JSON.stringify(value, replacer));
        }
        const outRow = valuesRow.join(";");
        return outRow;
    }
    makeHeader(header, statement, columnToSkip) {
        for (let i = 0; i < statement.getColumnCount(); i++) {
            if (i === columnToSkip) {
                continue;
            }
            header.push(statement.getValue(i).columnInfo.getAccessString());
        }
        const outHeader = header.join(";");
        return outHeader;
    }
    async calculateMassProps(ids) {
        var _a, _b, _c;
        const result = { totalCount: ids.length, volume: 0, volumeCount: 0, area: 0, areaCount: 0, length: 0, lengthCount: 0 };
        const requestContext = new imodeljs_backend_1.BackendRequestContext();
        let count = 0;
        for (const id of ids) {
            const requestProps = {
                operation: imodeljs_common_1.MassPropertiesOperation.AccumulateVolumes,
                candidates: [id],
            };
            if (count > 0 && count % 1000 === 0) {
                console.log(`Calculated ${count} mass properties: \n${JSON.stringify(result)}`);
            }
            ++count;
            const volumeProps = await this._iModelDb.getMassProperties(requestContext, requestProps);
            const volume = (_a = volumeProps.volume) !== null && _a !== void 0 ? _a : 0;
            if (volume !== 0) {
                result.volume += volume;
                result.volumeCount += 1;
            }
            requestProps.operation = imodeljs_common_1.MassPropertiesOperation.AccumulateAreas;
            const areaProps = await this._iModelDb.getMassProperties(requestContext, requestProps);
            const area = (_b = areaProps.area) !== null && _b !== void 0 ? _b : 0;
            if (area !== 0) {
                result.area += area;
                result.areaCount += 1;
            }
            requestProps.operation = imodeljs_common_1.MassPropertiesOperation.AccumulateLengths;
            const lengthProps = await this._iModelDb.getMassProperties(requestContext, requestProps);
            const length = (_c = lengthProps.length) !== null && _c !== void 0 ? _c : 0;
            if (length !== 0) {
                result.length += length;
                result.lengthCount += 1;
            }
        }
        return result;
    }
    assignDefaultOptions(options = {}) {
        return Object.assign(Object.assign({}, defaultOptions), options);
    }
    async writeQueryResultsToCsv(ecSql, fileName, options = {}) {
        const outputFileName = path.join(this._outputDir, fileName);
        const opts = this.assignDefaultOptions(options);
        await this._iModelDb.withPreparedStatement(ecSql, async (statement) => {
            await this.writeQueries(statement, outputFileName, opts);
        });
    }
    async writeQueries(statement, outputFileName, options) {
        const writeHeaders = !fs.existsSync(outputFileName);
        const writeStream = fs.createWriteStream(outputFileName, { flags: "a" });
        let ids = [];
        if (writeHeaders) {
            const header = (options.calculateMassProperties) ? ["total_count", "volume", "volume_count", "area", "area_count", "length", "length_count"] : [];
            const outHeader = this.makeHeader(header, statement, options.dropIdColumnFromResult ? options.idColumn : -1);
            writeStream.write(`${outHeader}\n`);
        }
        let rowCount = 0;
        while (bentleyjs_core_1.DbResult.BE_SQLITE_ROW === statement.step()) {
            const stringifiedRow = this.rowToString(statement, options.dropIdColumnFromResult ? options.idColumn : -1);
            if (options.calculateMassProperties === true) {
                if (options.idColumnIsJsonArray === true) {
                    ids = JSON.parse(statement.getValue(options.idColumn).getString());
                }
                else {
                    ids = [statement.getValue(options.idColumn).getId()];
                }
                const result = await this.calculateMassProps(ids);
                writeStream.write(`${result.totalCount};${result.volume};${result.volumeCount};${result.area};${result.areaCount};${result.length};${result.lengthCount};${stringifiedRow}\n`);
            }
            else {
                writeStream.write(`${stringifiedRow}\n`);
            }
            rowCount++;
            if (rowCount % 1000 === 0) {
                console.log(`${rowCount} rows processed so far`);
            }
        }
        console.log(`Written ${rowCount} rows to file: ${outputFileName}`);
        return new Promise((resolve, reject) => {
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
            writeStream.end();
        });
    }
}
exports.DataExporter = DataExporter;
//# sourceMappingURL=DataExporter.js.map