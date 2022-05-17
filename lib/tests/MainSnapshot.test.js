"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
const chai_1 = require("chai");
const fs = require("fs");
const path = require("path");
const imodeljs_backend_1 = require("@bentley/imodeljs-backend");
const DataExporter_1 = require("../DataExporter");
const iModelUtils_1 = require("./iModelUtils");
describe("DataExporter.test.ts", () => {
    let sourceDbFile = "";
    let sourceDb;
    let userdata;
    before(async () => {
        await imodeljs_backend_1.IModelHost.startup();
        sourceDbFile = path.join(__dirname, "TestiModel.bim");
        if (fs.existsSync(sourceDbFile))
            fs.unlinkSync(sourceDbFile);
        sourceDb = imodeljs_backend_1.SnapshotDb.createEmpty(sourceDbFile, { rootSubject: { name: "TestIModel" } });
        await iModelUtils_1.prepareSourceDb(sourceDb);
        iModelUtils_1.populateSourceDb(sourceDb);
        sourceDb.saveChanges();
    });
    after(async () => { await imodeljs_backend_1.IModelHost.shutdown(); });
    it("CSV files are correctly generated from imodel", async () => {
        const exporter = new DataExporter_1.DataExporter(sourceDb);
        userdata = require("./assets/TestQueries.json");
        exporter.setFolder(userdata.folder);
        const outFiles = ["2dElements", "3dElements", "class", "schema", "volumeForGroupIds", "volumeForSingleIds"].map((file) => `${file}.csv`);
        for (const querykey of Object.keys(userdata.queries)) {
            const aQuery = userdata.queries[querykey];
            const fileName = `${aQuery.store !== undefined ? aQuery.store : querykey}.csv`;
            await exporter.writeQueryResultsToCsv(aQuery.query, fileName, aQuery.options);
        }
        const outDir = path.join(__dirname, "..", "..", "out", userdata.folder);
        chai_1.expect(imodeljs_backend_1.IModelJsFs.existsSync(outDir)).to.equal(true);
        chai_1.expect(imodeljs_backend_1.IModelJsFs.readdirSync(outDir)).to.have.members(outFiles);
    });
    describe("Default options for query", () => {
        it("Should assign default values to query options, if options are not provided", () => {
            const exporter = new DataExporter_1.DataExporter(sourceDb);
            const options = exporter["assignDefaultOptions"]();
            chai_1.expect(options.calculateMassProperties).is.false;
            chai_1.expect(options.idColumn).is.equal(0);
            chai_1.expect(options.idColumnIsJsonArray).is.false;
            chai_1.expect(options.dropIdColumnFromResult).is.false;
        });
        it("Should not assign default values to already defined options", () => {
            const exporter = new DataExporter_1.DataExporter(sourceDb);
            const options = {
                calculateMassProperties: true,
                idColumn: 15,
                idColumnIsJsonArray: true,
                dropIdColumnFromResult: true,
            };
            const opts = exporter["assignDefaultOptions"](options);
            chai_1.expect(opts.calculateMassProperties).is.true;
            chai_1.expect(opts.idColumn).to.equal(15);
            chai_1.expect(opts.idColumnIsJsonArray).is.true;
            chai_1.expect(opts.dropIdColumnFromResult).is.true;
        });
    });
    describe("Volume calculation", () => {
        it("Should return zero instead of undefined if object doesn't have volume", async () => {
            const exporter = new DataExporter_1.DataExporter(sourceDb);
            const ids = ["0x2b"]; // Id of existing 2D Geometry element from the test iModel.
            const results = await exporter["calculateMassProps"](ids);
            chai_1.expect(results.volume).is.equal(0);
        });
    });
});
//# sourceMappingURL=MainSnapshot.test.js.map