import { IFCLoader } from '../dist/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
    BufferGeometry,
    MeshLambertMaterial
} from 'three';
import {
    IFCCURTAINWALL,
    IFCDOOR,
    IFCFURNISHINGELEMENT,
    IFCPLATE,
    IFCPROJECT,
    IFCWINDOW
} from 'web-ifc';

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

AnimationLoop();

//Setup IFC Loader
const ifcMeshes = [];
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

async function loadIFC(changed) {
    var ifcURL = URL.createObjectURL(changed.target.files[0]);
    const mesh = await ifcLoader.loadAsync(ifcURL);
    ifcMeshes.push(mesh);
    scene.add(mesh);
}

const closer = document.getElementById('close-button');
closer.onclick = () => {
    ifcLoader.close(0, scene);
};

//Setup object picking

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;

function castRay(event) {
    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(ifcMeshes);
}

const preselectMaterial = new MeshLambertMaterial({
    color: 0xffccff,
    transparent: true,
    opacity: 0.5,
    depthTest: false
});

let previousPreSelection;
let preselecteModel;

function preselectItem(event) {
    const intersected = castRay(event);
    if (intersected.length) {
        const item = intersected[0];

        if (previousPreSelection == item.faceIndex) return;
        previousPreSelection = item.faceIndex;

        const id = ifcLoader.getExpressId(item.object.geometry, item.faceIndex);
        const modelID = item.object.modelID;

        if (preselecteModel != undefined && preselecteModel != modelID)
            ifcLoader.removeSubset(preselecteModel, scene, preselectMaterial);
        preselecteModel = modelID;

        ifcLoader.createSubset({
            scene,
            modelID,
            ids: [id],
            removePrevious: true,
            material: preselectMaterial
        });
    }
}

const selectMaterial = new MeshLambertMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.4,
    depthTest: false
});

let previousSelection;
let selectedModel;

function selectItem(event) {
    const intersected = castRay(event);
    if (intersected.length) {
        const item = intersected[0];

        if (previousSelection == item.faceIndex) return;
        previousSelection = item.faceIndex;

        const id = ifcLoader.getExpressId(item.object.geometry, item.faceIndex);
        const modelID = item.object.modelID;

        if (selectedModel != undefined && selectedModel != modelID)
            ifcLoader.removeSubset(selectedModel, scene, selectMaterial);
        selectedModel = modelID;

        ifcLoader.createSubset({
            scene,
            modelID,
            ids: [id],
            removePrevious: true,
            material: selectMaterial
        });

        const a = performance.now();
        const props = ifcLoader.getItemProperties(modelID, id);
        const psets = ifcLoader.getPropertySets(modelID, id);
        props.propertySets = psets;
        console.log("Get properties: ", performance.now() - a);
        console.log(props);
    }
}

threeCanvas.ondblclick = getSpatialChildren;
threeCanvas.onmousemove = preselectItem;

function getSpatialChildren(event) {
    // const ifcProjectID = ifcLoader.getAllItemsOfType(0, IFCPROJECT, false)[0];
    // const ifcProject = { expressID: ifcProjectID, hasChildren: [], hasSpatialChildren: [] };
    // ifcLoader.getAllSpatialChildren(0, ifcProject, false, true);
    // console.log(ifcProject.hasSpatialChildren);

    const a = performance.now();
    const tree = ifcLoader.getSpatialStructure(0, false);
    console.log(tree);
    console.log("Spatial tree: ", performance.now() - a);

    selectItem(event);
}

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
