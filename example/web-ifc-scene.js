import { IFCLoader } from '../dist/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import Stats from '../node_modules/stats.js/src/Stats';
import {
    Scene,
    Color,
    WebGLRenderer,
    PerspectiveCamera,
    Mesh,
    DirectionalLight,
    AmbientLight,
    Raycaster,
    Vector2,
    MeshLambertMaterial, MeshPhongMaterial
} from 'three';

//Scene
const scene = new Scene();
scene.background = new Color(0x8cc7de);

//Renderer
const threeCanvas = document.getElementById('threeCanvas');
const renderer = new WebGLRenderer({ antialias: true, canvas: threeCanvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Camera
const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
let controls = new OrbitControls(camera, renderer.domElement);

//Lights
const directionalLight1 = new DirectionalLight(0xffeeff, 0.8);
directionalLight1.position.set(1, 1, 1);
scene.add(directionalLight1);
const directionalLight2 = new DirectionalLight(0xffffff, 0.8);
directionalLight2.position.set(-1, 0.5, -1);
scene.add(directionalLight2);
const ambientLight = new AmbientLight(0xffffee, 0.25);
scene.add(ambientLight);

//Window resize support
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//Monitoring
const stats = new Stats();
stats.showPanel(0);
stats.dom.style.cssText = 'position:absolute;top:1rem;left:1rem;z-index:1;';
document.body.appendChild(stats.dom);

//Animation
function AnimationLoop() {
    stats.begin();
    controls.update();
    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(AnimationLoop);
}

const ifcLoader = new IFCLoader();
ifcLoader.ifcManager.setupThreeMeshBVH(computeBoundsTree, disposeBoundsTree, acceleratedRaycast);

AnimationLoop();

//Setup IFC Loader
const ifcModels = [];
(function readIfcFile() {
    const input = document.querySelector('input[type="file"]');
    if (!input) return;
    input.addEventListener(
        'change',
        (changed) => {
            loadIFC(changed);
        },
        false
    );
})();

const preselectMaterial = new MeshLambertMaterial({
    color: 0xffccff,
    transparent: true,
    opacity: 0.5,
    depthTest: false
});

const selectMaterial = new MeshLambertMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.4,
    depthTest: false
});

async function loadIFC(changed) {
    var ifcURL = URL.createObjectURL(changed.target.files[0]);
    const ifcModel = await ifcLoader.loadAsync(ifcURL);
    ifcModels.push(ifcModel);
    ifcModel.mesh.material = [new MeshLambertMaterial({transparent: true, opacity: 0.1})];
    scene.add(ifcModel.mesh);
}

const closer = document.getElementById('close-button');
closer.onclick = () => {
    const ifcModel = ifcModels.pop();
    ifcModel.close(0, scene);
};

//Setup object picking

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;

function castRay(event) {
    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const geometries = ifcModels.map(model => model.mesh);
    return raycaster.intersectObjects(geometries);
}

let previousPreselectedFace;
let previousPreselection;

function preselectItem(event) {
    const intersected = castRay(event);
    if (intersected.length) {
        const item = intersected[0];

        if (previousPreselectedFace == item.faceIndex) return;
        previousPreselectedFace = item.faceIndex;

        const modelID = item.object.modelID;
        const ifcModel = ifcModels.find(model => model.modelID == modelID);
        if(!ifcModel) return;
        const id = ifcModel.getExpressId(item.object.geometry, item.faceIndex);

        if (previousPreselection != undefined && previousPreselection.modelID != modelID)
            previousPreselection.removeSubset(scene, preselectMaterial);
        previousPreselection = ifcModel;

        ifcModel.createSubset({
            scene,
            ids: [id],
            removePrevious: false,
        })
    }
}

let previousSelectedFace;
let previousSelection;

function selectItem(event) {
    const intersected = castRay(event);
    if (intersected.length) {
        const item = intersected[0];

        if (previousSelectedFace == item.faceIndex) return;
        previousSelectedFace = item.faceIndex;


        const modelID = item.object.modelID;
        const ifcModel = ifcModels.find(model => model.modelID == modelID);
        if(!ifcModel) return;
        const id = ifcModel.getExpressId(item.object.geometry, item.faceIndex);

        if (previousSelection != undefined && previousSelection.modelID != modelID)
            previousSelection.removeSubset(scene, preselectMaterial);
        previousSelection = ifcModel;

        const tree = ifcModel.getSpatialStructure();
        console.log(tree);

        ifcModel.createSubset({
            scene,
            ids: [id],
            removePrevious: true,
            material: selectMaterial
        });

        const props = ifcModel.getItemProperties(id);
        const psets = ifcModel.getPropertySets(id);
        props.propertySets = psets;
        console.log(props);
    }
}

threeCanvas.ondblclick = selectItem;
threeCanvas.onmousemove = preselectItem;

// let ifcProject;
// let current = 0;

// let activeMeshes = [];

// function highlightFloor(){
//     if(!ifcProject) ifcProject = ifcLoader.getSpatialStructure(0);
//     const floors = ifcProject.hasSpatialChildren[0].hasSpatialChildren[0].hasSpatialChildren;
//     if(current >= floors.length) current = 0;
//     const currentFloor = floors[current];
//     const items = currentFloor.hasChildren;

//     activeMeshes = [];
//     const currentMesh = ifcLoader.createSubset({
//         scene,
//         modelID: 0,
//         ids: items,
//         removePrevious: true,
//     });
//     console.log(currentMesh.geometry);
//     activeMeshes.push(currentMesh);

//     current++;

//     ifcLoader.removeSubset(scene, highlightMaterial);
// }
