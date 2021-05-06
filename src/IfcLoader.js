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

var IfcLoader = function (manager) {
  Loader.call(this, manager);
};

var ifcAPI = new IfcAPI();
ifcAPI.Init();

var modelID;
var geometryByMaterials = {};

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

  getObjectGUID(mesh, materialIndex, faceIndex) {
    var materialID = mesh.material[materialIndex]._ifcID;
    var currentIndex = faceIndex * 3 - mesh.geometry.groups[materialIndex].start;
    var indices = Object.keys(geometryByMaterials[materialID]);
    if (currentIndex < 0 || currentIndex > indices[indices.length - 1]) return -1;
    if (currentIndex <= indices[0]) return geometryByMaterials[materialID][indices[0]];
    for (var i = 0; i < indices.length; i++)
      if (indices[i] <= currentIndex && indices[i + 1] > currentIndex)
        return geometryByMaterials[materialID][indices[i + 1]];
    return -1;
  },

  setObjectMaterial(mesh, faceIndex, newMaterial) {
    return -1;
  },

  parse: (function () {
    return function (buffer) {
      var data = new Uint8Array(buffer);
      modelID = ifcAPI.OpenModel('example.ifc', data);
      return loadAllGeometry(modelID);

      function loadAllGeometry(modelID) {
        var flatMeshes = getFlatMeshes(modelID);
        saveAllPlacedGeometriesByMaterial(modelID, flatMeshes);
        return generateAllGeometriesByMaterial();
      }

      function getFlatMeshes(modelID) {
        var flatMeshes = ifcAPI.LoadAllGeometry(modelID);
        return flatMeshes;
      }

      function generateAllGeometriesByMaterial() {
        var { materials, geometries } = getMaterialsAndGeometries();
        var geometry = BufferGeometryUtils.mergeBufferGeometries(geometries, true);
        var mesh = new Mesh(geometry, materials);
        console.log(geometryByMaterials);
        console.log(mesh);
        return mesh;
      }

      function getMaterialsAndGeometries() {
        var materials = [];
        var geometries = [];
        for (var i in geometryByMaterials) {
          materials.push(geometryByMaterials[i].material);
          var currentGeometries = geometryByMaterials[i].geometry;
          geometries.push(BufferGeometryUtils.mergeBufferGeometries(currentGeometries));
          geometryByMaterials[i] = geometryByMaterials[i].indices;
        }
        return { materials, geometries };
      }

      function saveAllPlacedGeometriesByMaterial(modelID, flatMeshes) {
        for (var i = 0; i < flatMeshes.size(); i++) {
          var placedGeometries = flatMeshes.get(i).geometries;
          for (var j = 0; j < placedGeometries.size(); j++) {
            savePlacedGeometryByMaterial(modelID, placedGeometries.get(j));
          }
        }
      }

      function savePlacedGeometryByMaterial(modelID, placedGeometry) {
        var geometry = getBufferGeometry(modelID, placedGeometry);
        geometry.computeVertexNormals();
        var matrix = getMeshMatrix(placedGeometry.flatTransformation);
        geometry.applyMatrix4(matrix);
        saveGeometryByMaterial(geometry, placedGeometry);
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

      function saveGeometryByMaterial(geometry, placedGeometry) {
        var color = placedGeometry.color;
        var id = `${color.x}${color.y}${color.z}${color.w}`;
        if (!geometryByMaterials[id]) createMaterial(id, color);
        geometryByMaterials[id].geometry.push(geometry);
        geometryByMaterials[id].lastIndex += geometry.attributes.position.count;
        var lastIndex = geometryByMaterials[id].lastIndex;
        geometryByMaterials[id].indices[lastIndex] = placedGeometry.geometryExpressID;
      }

      function createMaterial(id, color) {
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
