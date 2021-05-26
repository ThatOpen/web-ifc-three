// import { IfcAPI } from 'web-ifc/web-ifc-api';
import * as WebIFC from 'web-ifc/web-ifc-api';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import {
  FileLoader,
  Loader,
  Mesh,
  Color,
  MeshLambertMaterial,
  DoubleSide,
  Matrix4,
  BufferGeometry,
  BufferAttribute
} from 'three/build/three.module';
import { MeshBasicMaterial } from 'three';

var IfcLoader = function (manager) {
  Loader.call(this, manager);
};

var ifcAPI = new WebIFC.IfcAPI();
ifcAPI.Init();

var modelID;
var geometryByMaterials = {};
var mapFaceindexID = {};
var mapIDGeometry = {};
var highlightMaterial = new MeshBasicMaterial({
  color: 0xff0000,
  depthTest: false,
  side: DoubleSide
});
var selectedObjects = [];

var ifcIndirectPropertyMap = {
  [WebIFC.IFCRELDEFINESBYPROPERTIES]: 'RelatingPropertyDefinition',
  [WebIFC.IFCRELDEFINESBYTYPE]: 'RelatingType',
  [WebIFC.IFCRELAGGREGATES]: 'RelatedObjects',
  [WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE]: 'RelatedElements'
};

IfcLoader.prototype = Object.assign(Object.create(Loader.prototype), {
  constructor: IfcLoader,

  load: function (url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new FileLoader(scope.manager);
    loader.setPath(scope.path);
    loader.setResponseType('arraybuffer');
    loader.setRequestHeader(scope.requestHeader);
    loader.setWithCredentials(scope.withCredentials);
    loader.load(
      url,
      function (buffer) {
        try {
          onLoad(scope.parse(buffer));
        } catch (e) {
          if (onError) {
            onError(e);
          } else {
            console.error(e);
          }

          scope.manager.itemError(url);
        }
      },
      onProgress,
      onError
    );
  },

  setWasmPath: function (path) {
    ifcAPI.SetWasmPath(path);
  },

  getExpressId: function (faceIndex) {
    for (var index in mapFaceindexID) {
      if (parseInt(index) >= faceIndex) return mapFaceindexID[index];
    }
    return -1;
  },

  highlightItems: function (expressIds, scene, material = highlightMaterial) {
    this.removePreviousSelection(scene);
    expressIds.forEach((id) => {
      if (!mapIDGeometry[id]) return;
      var mesh = new Mesh(mapIDGeometry[id], material);
      mesh.renderOrder = 1;
      scene.add(mesh);
      selectedObjects.push(mesh);
      return;
    });
  },

  removePreviousSelection: function (scene) {
    if (selectedObjects.length > 0) selectedObjects.forEach((object) => scene.remove(object));
  },

  setItemsVisibility: function (expressIds, geometry, visible = false) {
    this.setupVisibility(geometry);
    var previous = 0;
    for (var current in mapFaceindexID) {
      if (expressIds.includes(mapFaceindexID[current])) {
        for (var i = previous; i <= current; i++) this.setVertexVisibility(geometry, i, visible);
      }
      previous = current;
    }
    geometry.attributes.visibility.needsUpdate = true;
  },

  setVertexVisibility: function (geometry, index, visible) {
    var isVisible = visible ? 0 : 1;
    var geoIndex = geometry.index.array;
    geometry.attributes.visibility.setX(geoIndex[3 * index], isVisible);
    geometry.attributes.visibility.setX(geoIndex[3 * index + 1], isVisible);
    geometry.attributes.visibility.setX(geoIndex[3 * index + 2], isVisible);
  },

  setupVisibility: function (geometry) {
    if (!geometry.attributes.visibility) {
      var visible = new Float32Array(geometry.getAttribute('position').count);
      geometry.setAttribute('visibility', new BufferAttribute(visible, 1));
    }
  },

  getItemProperties: function (elementID, all = false) {
    var properties = ifcAPI.GetLine(modelID, elementID);

    if (all) {
      const propSetIds = this.getAllRelatedItemsOfType(elementID, WebIFC.IFCRELDEFINESBYPROPERTIES, "RelatedObjects");
      properties.hasPropertySets = propSetIds.map((id) => ifcAPI.GetLine(modelID, id, true));

      const typeId = this.getAllRelatedItemsOfType(elementID, WebIFC.IFCRELDEFINESBYTYPE, "RelatedObjects");
      properties.hasType = typeId.map((id) => ifcAPI.GetLine(modelID, id, true));
    }

    // properties.type = properties.constructor.name;
    return properties;
  },

  getSpatialStructure: function () {
    let lines = ifcAPI.GetLineIDsWithType(modelID, WebIFC.IFCPROJECT);
    let ifcProjectId = lines.get(0);
    let ifcProject = ifcAPI.GetLine(modelID, ifcProjectId);
    this.getAllSpatialChildren(ifcProject);
    return ifcProject;
  },

  getAllSpatialChildren: function(spatialElement){
    const id = spatialElement.expressID;
    const spatialChildrenID = this.getAllRelatedItemsOfType(id, WebIFC.IFCRELAGGREGATES, "RelatingObject");
    spatialElement.hasSpatialChildren = spatialChildrenID.map((id) => ifcAPI.GetLine(modelID, id, false));
    spatialElement.hasChildren = this.getAllRelatedItemsOfType(id, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, "RelatingStructure");
    spatialElement.hasSpatialChildren.forEach(child => this.getAllSpatialChildren(child));
  },

  getAllRelatedItemsOfType: function (elementID, type, relation) {
    let lines = ifcAPI.GetLineIDsWithType(modelID, type);

    let IDs = [];
    for (let i = 0; i < lines.size(); i++) {
      let relID = lines.get(i);
      let rel = ifcAPI.GetLine(modelID, relID);
      let foundElement = false;
      const relatedItems = rel[relation];

      if (Array.isArray(relatedItems))
        relatedItems.forEach((relID) => {
          if (relID.value === elementID) {
            foundElement = true;
          }
        });
        else if (relatedItems.value === elementID) foundElement = true;

      if (foundElement) {
        var element = rel[ifcIndirectPropertyMap[type]];
        if (!Array.isArray(element)) IDs.push(element.value);
        else element.forEach(ele => IDs.push(ele.value))
      }
    }
    return IDs;
  },

  parse: (function () {
    return function (buffer) {
      var data = new Uint8Array(buffer);
      modelID = ifcAPI.OpenModel('example.ifc', data);
      return loadAllGeometry(modelID);

      function loadAllGeometry(modelID) {
        saveAllPlacedGeometriesByMaterial(modelID);
        return generateAllGeometriesByMaterial();
      }

      function getFlatMeshes(modelID) {
        var flatMeshes = ifcAPI.LoadAllGeometry(modelID);
        return flatMeshes;
      }

      function generateAllGeometriesByMaterial() {
        var { materials, geometries } = getMaterialsAndGeometries();
        var allGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
        return new Mesh(allGeometry, materials);
      }

      function getMaterialsAndGeometries() {
        var materials = [];
        var geometries = [];
        var totalFaceCount = 0;

        for (var i in geometryByMaterials) {
          materials.push(geometryByMaterials[i].material);
          var currentGeometries = geometryByMaterials[i].geometry;
          geometries.push(BufferGeometryUtils.mergeBufferGeometries(currentGeometries));

          for (var j in geometryByMaterials[i].indices) {
            var globalIndex = parseInt(j, 10) + parseInt(totalFaceCount, 10);
            mapFaceindexID[globalIndex] = geometryByMaterials[i].indices[j];
          }
          totalFaceCount += geometryByMaterials[i].lastIndex;
        }
        geometryByMaterials = {};
        return { materials, geometries };
      }

      function saveAllPlacedGeometriesByMaterial(modelID) {
        var flatMeshes = getFlatMeshes(modelID);
        for (var i = 0; i < flatMeshes.size(); i++) {
          var flatMesh = flatMeshes.get(i);
          var productId = flatMesh.expressID;
          var placedGeometries = flatMesh.geometries;
          for (var j = 0; j < placedGeometries.size(); j++) {
            savePlacedGeometryByMaterial(modelID, placedGeometries.get(j), productId);
          }
        }
      }

      function savePlacedGeometryByMaterial(modelID, placedGeometry, productId) {
        var geometry = getBufferGeometry(modelID, placedGeometry);
        geometry.computeVertexNormals();
        var matrix = getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        storeGeometryForHighlight(productId, geometry);
        saveGeometryByMaterial(geometry, placedGeometry, productId);
      }

      function storeGeometryForHighlight(productId, geometry) {
        if (!mapIDGeometry[productId]) {
          mapIDGeometry[productId] = geometry;
          return;
        }
        var geometries = [mapIDGeometry[productId], geometry];
        mapIDGeometry[productId] = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
      }

      function getBufferGeometry(modelID, placedGeometry) {
        var geometry = ifcAPI.GetGeometry(modelID, placedGeometry.geometryExpressID);
        var verts = ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
        var indices = ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
        var bufferGeometry = ifcGeometryToBuffer(verts, indices);
        return bufferGeometry;
      }

      function getMeshMatrix(matrix) {
        var mat = new Matrix4();
        mat.fromArray(matrix);
        return mat;
      }

      function ifcGeometryToBuffer(vertexData, indexData) {
        var geometry = new BufferGeometry();
        var { vertices, normals } = extractVertexData(vertexData);
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
        geometry.setIndex(new BufferAttribute(indexData, 1));
        return geometry;
      }

      function extractVertexData(vertexData) {
        var vertices = [],
          normals = [];
        var isNormalData = false;
        for (var i = 0; i < vertexData.length; i++) {
          isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i]);
          if ((i + 1) % 3 == 0) isNormalData = !isNormalData;
        }
        return { vertices, normals };
      }

      function saveGeometryByMaterial(geometry, placedGeometry, productId) {
        var color = placedGeometry.color;
        var id = `${color.x}${color.y}${color.z}${color.w}`;
        createMaterial(id, color);
        var currentGeometry = geometryByMaterials[id];
        currentGeometry.geometry.push(geometry);
        currentGeometry.lastIndex += geometry.index.count / 3;
        currentGeometry.indices[currentGeometry.lastIndex] = productId;
      }

      function createMaterial(id, color) {
        if (geometryByMaterials[id]) return;
        var col = new Color(color.x, color.y, color.z);
        var newMaterial = new MeshLambertMaterial({ color: col, side: DoubleSide });
        newMaterial.onBeforeCompile = materialHider;
        newMaterial.transparent = color.w !== 1;
        if (newMaterial.transparent) newMaterial.opacity = color.w;
        geometryByMaterials[id] = initializeTempObject(newMaterial);
      }

      function initializeTempObject(newMaterial) {
        return {
          material: newMaterial,
          geometry: [],
          indices: {},
          lastIndex: 0
        };
      }
    };
  })()
});

function materialHider(shader) {
  shader.vertexShader = `
  attribute float sizes;
  attribute float visibility;
  varying float vVisible;
${shader.vertexShader}`.replace(
    `#include <fog_vertex>`,
    `#include <fog_vertex>
    vVisible = visibility;
  `
  );
  shader.fragmentShader = `
  varying float vVisible;
${shader.fragmentShader}`.replace(
    `#include <clipping_planes_fragment>`,
    `
    if (vVisible > 0.5) discard;
  #include <clipping_planes_fragment>`
  );
}

export { IfcLoader };
