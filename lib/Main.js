"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const bentleyjs_core_1 = require("@bentley/bentleyjs-core");
const ElectronBackend_1 = require("@bentley/electron-manager/lib/ElectronBackend");
const imodeljs_backend_1 = require("@bentley/imodeljs-backend");
const imodeljs_common_1 = require("@bentley/imodeljs-common");
const itwin_client_1 = require("@bentley/itwin-client");
const DataExporter_1 = require("./DataExporter");
const readline = require("readline");
async function signIn() {
    const config = {
        clientId: "imodeljs-electron-samples",
        redirectUri: "http://localhost:3000/signin-callback",
        scope: "openid email profile organization imodelhub context-registry-service:read-only product-settings-service urlps-third-party offline_access",
    };
    const client = new ElectronBackend_1.ElectronAuthorizationBackend();
    await client.initialize(config);
    return new Promise((resolve, reject) => {
        imodeljs_backend_1.NativeHost.onUserStateChanged.addListener((token) => {
            if (token !== undefined) {
                resolve(token);
            }
            else {
                reject(new Error("Failed to sign in"));
            }
        });
        client.signIn().catch((err) => reject(err));
    });
}
async function getBriefcase(requestContext, request) {
    var _a, _b, _c, _d;
    const briefcaseId = 0;
    const fileName = (_a = request.fileName) !== null && _a !== void 0 ? _a : imodeljs_backend_1.BriefcaseManager.getFileName({ briefcaseId, iModelId: request.iModelId });
    const asOf = (_b = request.asOf) !== null && _b !== void 0 ? _b : imodeljs_common_1.IModelVersion.latest().toJSON();
    const changeset = await imodeljs_backend_1.BriefcaseManager.changesetFromVersion(requestContext, imodeljs_common_1.IModelVersion.fromJSON(asOf), request.iModelId);
    const args = {
        localFile: fileName,
        checkpoint: {
            requestContext,
            contextId: request.contextId,
            iModelId: request.iModelId,
            changeSetId: changeset.id,
            changesetIndex: changeset.index,
        },
        onProgress: request.onProgress,
    };
    await imodeljs_backend_1.CheckpointManager.downloadCheckpoint(args);
    const fileSize = (_d = (_c = imodeljs_backend_1.IModelJsFs.lstatSync(fileName)) === null || _c === void 0 ? void 0 : _c.size) !== null && _d !== void 0 ? _d : 0;
    const response = {
        fileName,
        briefcaseId,
        iModelId: request.iModelId,
        contextId: request.contextId,
        changeSetId: args.checkpoint.changeSetId,
        changesetIndex: args.checkpoint.changesetIndex,
        fileSize,
    };
    return response;
}
async function main(process) {
    var _a, _b, _c;
    try {
        await imodeljs_backend_1.IModelHost.startup();
        const accessToken = await signIn();
        let userdata;
        const json = process.argv[2];
        if (json === undefined) {
            userdata = require("../queries/example.json");
        }
        else {
            userdata = require(json);
        }
        const url = new URL(userdata.url.toLowerCase());
        const projectId = (_a = url.searchParams.get("projectid")) !== null && _a !== void 0 ? _a : "";
        const iModelId = (_b = url.searchParams.get("imodelid")) !== null && _b !== void 0 ? _b : "";
        const changeSetId = (_c = url.searchParams.get("changesetid")) !== null && _c !== void 0 ? _c : "";
        const version = changeSetId === "" ? imodeljs_common_1.IModelVersion.latest() : imodeljs_common_1.IModelVersion.asOfChangeSet(changeSetId);
        const guidRegex = new RegExp("[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}");
        if (!guidRegex.test(projectId) || !guidRegex.test(iModelId)) {
            console.error("Error in parsing url from query");
            return;
        }
        // If this function returns non-zero, the download is aborted.
        const progressTracking = (loaded, total) => {
            const percent = loaded / total * 100;
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`Downloaded: ${percent.toFixed(2)} %`);
            return 0;
        };
        console.log(`Started opening iModel (projectId=${projectId}, iModelId=${iModelId}, changeSetId=${changeSetId})`);
        const requestContext = new itwin_client_1.AuthorizedClientRequestContext(accessToken);
        const requestNewBriefcaseArg = { contextId: projectId, iModelId, asOf: version.toJSON(), briefcaseId: 0, onProgress: progressTracking };
        const briefcaseProps = await getBriefcase(requestContext, requestNewBriefcaseArg);
        requestContext.enter();
        const iModelDb = await imodeljs_backend_1.BriefcaseDb.open(requestContext, briefcaseProps);
        requestContext.enter();
        console.log("\nFinished opening iModel");
        const exporter = new DataExporter_1.DataExporter(iModelDb);
        exporter.setFolder(userdata.folder);
        for (const querykey of Object.keys(userdata.queries)) {
            console.log(`Executing query for ${querykey}`);
            const aQuery = userdata.queries[querykey];
            const fileName = `${aQuery.store !== undefined ? aQuery.store : querykey}.csv`;
            await exporter.writeQueryResultsToCsv(aQuery.query, fileName, aQuery.options);
        }
        iModelDb.close();
    }
    catch (error) {
        console.error(`${error.message}\n${error.stack}`);
    }
    finally {
        await imodeljs_backend_1.IModelHost.shutdown();
    }
}
exports.main = main;
if (require.main === module) {
    (async () => {
        await main(process);
    })().catch((err) => {
        var _a;
        if (err instanceof bentleyjs_core_1.BentleyError)
            process.stderr.write(`Error: ${err.name}: ${err.message}`);
        else
            process.stderr.write(`Unknown error: ${err.message}`);
        process.exit((_a = err.errorNumber) !== null && _a !== void 0 ? _a : -1);
    });
}
//# sourceMappingURL=Main.js.map