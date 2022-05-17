"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateSourceDb = exports.prepareSourceDb = void 0;
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
const bentleyjs_core_1 = require("@bentley/bentleyjs-core");
const geometry_core_1 = require("@bentley/geometry-core");
const imodeljs_backend_1 = require("@bentley/imodeljs-backend");
const imodeljs_common_1 = require("@bentley/imodeljs-common");
const chai_1 = require("chai");
const path = require("path");
async function prepareSourceDb(sourceDb) {
    const requestContext = new imodeljs_backend_1.BackendRequestContext();
    const sourceSchemaFileName = path.join(__dirname, "assets", "TestPropsSchema-33.01.00.00.ecschema.xml");
    try {
        await sourceDb.importSchemas(requestContext, [sourceSchemaFileName]);
    }
    catch (e) {
        console.log(e);
    }
    imodeljs_backend_1.FunctionalSchema.registerSchema();
}
exports.prepareSourceDb = prepareSourceDb;
function insertSpatialCategory(iModelDb, modelId, categoryName, color) {
    const appearance = {
        color: color.toJSON(),
        transp: 0,
        invisible: false,
    };
    return imodeljs_backend_1.SpatialCategory.insert(iModelDb, modelId, categoryName, appearance);
}
function populateSourceDb(sourceDb) {
    if (imodeljs_backend_1.Platform.platformName.startsWith("win")) {
        sourceDb.embedFont({ id: 1, type: imodeljs_common_1.FontType.TrueType, name: "Arial" });
        chai_1.assert.exists(sourceDb.fontMap.getFont("Arial"));
        chai_1.assert.exists(sourceDb.fontMap.getFont(1));
    }
    // initialize project extents
    const projectExtents = new geometry_core_1.Range3d(-1000, -1000, -1000, 1000, 1000, 1000);
    sourceDb.updateProjectExtents(projectExtents);
    // insert CodeSpecs
    const codeSpecId1 = sourceDb.codeSpecs.insert("SourceCodeSpec", imodeljs_common_1.CodeScopeSpec.Type.Model);
    const codeSpecId2 = sourceDb.codeSpecs.insert("ExtraCodeSpec", imodeljs_common_1.CodeScopeSpec.Type.ParentElement);
    const codeSpecId3 = sourceDb.codeSpecs.insert("InformationRecords", imodeljs_common_1.CodeScopeSpec.Type.Model);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(codeSpecId1));
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(codeSpecId2));
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(codeSpecId3));
    // insert RepositoryModel structure
    const subjectId = imodeljs_backend_1.Subject.insert(sourceDb, imodeljs_common_1.IModel.rootSubjectId, "Subject", "Subject Description");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(subjectId));
    const sourceOnlySubjectId = imodeljs_backend_1.Subject.insert(sourceDb, imodeljs_common_1.IModel.rootSubjectId, "Only in Source");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(sourceOnlySubjectId));
    const definitionModelId = imodeljs_backend_1.DefinitionModel.insert(sourceDb, subjectId, "Definition");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(definitionModelId));
    const informationModelId = imodeljs_backend_1.InformationRecordModel.insert(sourceDb, subjectId, "Information");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(informationModelId));
    const groupModelId = imodeljs_backend_1.GroupModel.insert(sourceDb, subjectId, "Group");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(groupModelId));
    const physicalModelId = imodeljs_backend_1.PhysicalModel.insert(sourceDb, subjectId, "Physical");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(physicalModelId));
    const spatialLocationModelId = imodeljs_backend_1.SpatialLocationModel.insert(sourceDb, subjectId, "SpatialLocation", true);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(spatialLocationModelId));
    // const functionalModelId = FunctionalModel.insert(sourceDb, subjectId, "Functional");
    // assert.isTrue(Id64.isValidId64(functionalModelId));
    const documentListModelId = imodeljs_backend_1.DocumentListModel.insert(sourceDb, subjectId, "Document");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(documentListModelId));
    const drawingId = imodeljs_backend_1.Drawing.insert(sourceDb, documentListModelId, "Drawing");
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(drawingId));
    // insert DefinitionElements
    const modelSelectorId = imodeljs_backend_1.ModelSelector.insert(sourceDb, definitionModelId, "SpatialModels", [physicalModelId, spatialLocationModelId]);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(modelSelectorId));
    const spatialCategoryId = insertSpatialCategory(sourceDb, definitionModelId, "SpatialCategory", imodeljs_common_1.ColorDef.green);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(spatialCategoryId));
    const sourcePhysicalCategoryId = insertSpatialCategory(sourceDb, definitionModelId, "SourcePhysicalCategory", imodeljs_common_1.ColorDef.blue);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(sourcePhysicalCategoryId));
    const subCategoryId = imodeljs_backend_1.SubCategory.insert(sourceDb, spatialCategoryId, "SubCategory", { color: imodeljs_common_1.ColorDef.blue.toJSON() });
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(subCategoryId));
    const drawingCategoryId = imodeljs_backend_1.DrawingCategory.insert(sourceDb, definitionModelId, "DrawingCategory", new imodeljs_common_1.SubCategoryAppearance());
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(drawingCategoryId));
    // tslint:disable-next-line: max-line-length
    const spatialCategorySelectorId = imodeljs_backend_1.CategorySelector.insert(sourceDb, definitionModelId, "SpatialCategories", [spatialCategoryId, sourcePhysicalCategoryId]);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(spatialCategorySelectorId));
    const drawingCategorySelectorId = imodeljs_backend_1.CategorySelector.insert(sourceDb, definitionModelId, "DrawingCategories", [drawingCategoryId]);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(drawingCategorySelectorId));
    const auxCoordSystemProps = {
        classFullName: imodeljs_backend_1.AuxCoordSystem2d.classFullName,
        model: definitionModelId,
        code: imodeljs_backend_1.AuxCoordSystem2d.createCode(sourceDb, definitionModelId, "AuxCoordSystem2d"),
    };
    const auxCoordSystemId = sourceDb.elements.insertElement(auxCoordSystemProps);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(auxCoordSystemId));
    const toolBox = {
        classFullName: "TestPropsSchema:ToolBox",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
        bestTool: {
            name: "Hammer",
            weight: "42.42",
        },
        worstTool: {
            name: "Feather",
        },
        tools: [
            {
                name: "Saw",
                weight: "11.02",
            },
            {
                name: "Drill",
                weight: "100.1",
            },
        ],
    };
    const toolBoxId = sourceDb.elements.insertElement(toolBox);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(toolBoxId));
    const people = {
        classFullName: "TestPropsSchema:People",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
        PersonA: {
            Age: 52,
            Name: "John",
            PersonIQ: {
                Memory: 6,
                Perception: 8,
            },
        },
    };
    const peopleId = sourceDb.elements.insertElement(people);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(peopleId));
    const aspectElement = {
        classFullName: "TestPropsSchema:AspectElement",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
        Type: "AspectOwningElement",
    };
    const aspectElementId = sourceDb.elements.insertElement(aspectElement);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(aspectElementId));
    const uniqueAspect = {
        classFullName: "TestPropsSchema:TestUniqueAspect",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        element: new imodeljs_backend_1.ElementOwnsUniqueAspect(aspectElementId),
        category: spatialCategoryId,
        Diameter: 12,
    };
    sourceDb.elements.insertAspect(uniqueAspect);
    const multiAspect = {
        classFullName: "TestPropsSchema:TestMultiAspect",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        element: new imodeljs_backend_1.ElementOwnsMultiAspects(aspectElementId),
        category: spatialCategoryId,
        TextSize: 5.5,
        TextFont: "Italics",
        Color: 2,
    };
    sourceDb.elements.insertAspect(multiAspect);
    const keywordsElement = {
        classFullName: "TestPropsSchema:KeyWordsElement",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
        Offset: "FooBar",
        Count: 12,
        Limit: 10,
        Select: 10,
    };
    const keywordsElementId = sourceDb.elements.insertElement(keywordsElement);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(keywordsElementId));
    const testPhysicalType = {
        classFullName: "TestPropsSchema:TestPhysicalType",
        model: definitionModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
    };
    const testPhysicalTypeId = sourceDb.elements.insertElement(testPhysicalType);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(testPhysicalTypeId));
    const testGeometricElement3d = {
        classFullName: "TestPropsSchema:TestGeomertric3dElement",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
        typeDefinition: { id: testPhysicalTypeId, relClassName: "TestPropsSchema:TestGeomertric3dElementIsOfType" },
    };
    const testGeometricElement3dId = sourceDb.elements.insertElement(testGeometricElement3d);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(testGeometricElement3dId));
    const testGeometricElement2d = {
        classFullName: "TestPropsSchema:TestGeomertric2dElement",
        model: drawingId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: drawingCategoryId,
        typeDefinition: { id: testPhysicalTypeId, relClassName: "TestPropsSchema:TestGeomertric2dElementIsOfType" },
    };
    const testGeometricElement2dId = sourceDb.elements.insertElement(testGeometricElement2d);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(testGeometricElement2dId));
    const derivedConcreteElement = {
        classFullName: "TestPropsSchema:DerivedConcreteElement",
        model: physicalModelId,
        code: imodeljs_common_1.Code.createEmpty(),
        category: spatialCategoryId,
        Length: 20,
        Width: 10,
    };
    const derivedConcreteElementId = sourceDb.elements.insertElement(derivedConcreteElement);
    chai_1.assert.isTrue(bentleyjs_core_1.Id64.isValidId64(derivedConcreteElementId));
}
exports.populateSourceDb = populateSourceDb;
//# sourceMappingURL=iModelUtils.js.map