import { IfcAPI } from 'web-ifc/web-ifc-api';
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

var ifcAPI = new IfcAPI();
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
var selectedObject = undefined;

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

  getIfcItemInformation: function (expressID) {
    return ifcAPI.GetLine(modelID, expressID);
  },

  setWasmPath(path) {
    ifcAPI.SetWasmPath(path);
  },

  getExpressId(faceIndex) {
    for (var index in mapFaceindexID) {
      if (parseInt(index) >= faceIndex) return mapFaceindexID[index];
    }
    return -1;
  },

  selectItem(faceIndex, scene) {
    for (var index in mapFaceindexID) {
      if (parseInt(index) >= faceIndex) {
        var id = mapFaceindexID[index];
        var mesh = new Mesh(mapIDGeometry[id], highlightMaterial);
        mesh.renderOrder = 1;
        scene.add(mesh);
        if (selectedObject) scene.remove(selectedObject);
        selectedObject = mesh;
        return id;
      }
    }
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
        newMaterial._ifcID = id;
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

export { IfcLoader };
