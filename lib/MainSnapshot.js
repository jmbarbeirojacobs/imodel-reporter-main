"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainSnapshot = void 0;
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
const bentleyjs_core_1 = require("@bentley/bentleyjs-core");
const imodeljs_backend_1 = require("@bentley/imodeljs-backend");
const DataExporter_1 = require("./DataExporter");
const fs = require("fs");
async function mainSnapshot(process) {
    try {
        let userdata;
        const fileName = process.argv[2];
        const json = process.argv[3];
        await imodeljs_backend_1.IModelHost.startup();
        if (fileName === undefined) {
            console.error("Filename not provided");
            return;
        }
        if (!fs.existsSync(fileName)) {
            console.error(`Could not find the iModel at location '${fileName}'`);
            return;
        }
        if (json === undefined) {
            userdata = require("../queries/example.json");
        }
        else {
            userdata = require(json);
        }
        const sourceDbFile = fileName;
        const sourceDb = imodeljs_backend_1.SnapshotDb.openFile(sourceDbFile);
        const exporter = new DataExporter_1.DataExporter(sourceDb);
        exporter.setFolder(userdata.folder);
        for (const querykey of Object.keys(userdata.queries)) {
            const aQuery = userdata.queries[querykey];
            const outFileName = `${aQuery.store !== undefined ? aQuery.store : querykey}.csv`;
            await exporter.writeQueryResultsToCsv(aQuery.query, outFileName, aQuery.options);
        }
        sourceDb.close();
    }
    catch (error) {
        console.error(`${error.message} \n ${error.stack}`);
    }
    finally {
        await imodeljs_backend_1.IModelHost.shutdown();
    }
}
exports.mainSnapshot = mainSnapshot;
// invoke main if MainSnapshot.js is being run directly
if (require.main === module) {
    (async () => {
        if (process.argv.length < 3)
            throw new Error("Please provide valid arguments: npm run start:snapshot <file path> <query.json>");
        await mainSnapshot(process);
    })().catch((err) => {
        var _a;
        if (err instanceof bentleyjs_core_1.BentleyError)
            process.stderr.write(`Error: ${err.name}: ${err.message}`);
        else
            process.stderr.write(`Unknown error: ${err.message}`);
        process.exit((_a = err.errorNumber) !== null && _a !== void 0 ? _a : -1);
    });
}
//# sourceMappingURL=MainSnapshot.js.map