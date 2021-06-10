import { IFCLoader } from '../dist/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from '../node_modules/stats.js/src/Stats';
import {
    Scene,
    Color,
    WebGLRenderer,
    PerspectiveCamera,
    BoxGeometry,
    MeshPhongMaterial,
    Mesh,
    DirectionalLight,
    AmbientLight,
    Raycaster,
    Vector3,
    Vector2,
    BufferGeometry
} from 'three';
import { IFCDOOR, IFCSLAB, IFCWALLSTANDARDCASE } from 'web-ifc';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

// Add the extension functions
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

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
            var ifcURL = URL.createObjectURL(changed.target.files[0]);
            ifcLoader.load(ifcURL, (mesh) => {
                mesh.geometry.computeBoundsTree();
                ifcMeshes.push(mesh);
                scene.add(mesh);
            });
        },
        false
    );
})();

//Setup object picking
let previous = {};
const resetDisplayState = { r: 0, g: 0, b: 0, a: 1, h: 0 };

const raycaster = new Raycaster();
raycaster.firstHitOnly = true;

function selectObject(event) {

    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersected = raycaster.intersectObjects(ifcMeshes);

    if (intersected.length) {
        // if (previous.id != -1)
        //     ifcLoader.setItemsDisplay(previous.modelID, [previous.id], resetDisplayState, scene);

        // const item = ifcLoader.pickItems(intersected);
        const item = intersected[0];
        if(previous == item.faceIndex) return;
        previous = item.faceIndex;

        const modelID = item.object.modelID;
        const id = ifcLoader.getExpressId(modelID, item.faceIndex);

        ifcLoader.pickItem(modelID, id, scene);

        // const ifcProject = ifcLoader.getSpatialStructure(modelID, true);
        // console.log(ifcProject);

        // const properties = ifcLoader.getItemProperties(modelID, id);
        // console.log(properties);

        // const psets = ifcLoader.getPropertySets(modelID, id);
        // console.log(psets);




        // const transparent = { r: 0, g: 0, b: 1, a: 0.02, h: 1 };
        // ifcLoader.setModelDisplay(modelID, transparent, scene);

        // const doors = ifcLoader.getAllItemsOfType(modelID, IFCDOOR);
        // const red = { r: 1, g: 0, b: 0, a: 1, h: 1 };
        // ifcLoader.setItemsDisplay(modelID, doors, red, scene);




        // const transparent = { r: 0, g: 0, b: 1, a: 0.02, h: 1 };
        // ifcLoader.setModelDisplay(modelID, transparent, scene);

        // const normalDisplay = { r: 0, g: 0, b: 0, a: 1, h: 0 };
        // const ifcProject = ifcLoader.getSpatialStructure(modelID, false);
        // const firstFloor = ifcProject.hasSpatialChildren[0].hasSpatialChildren[0].hasSpatialChildren[0];
        // const items = firstFloor.hasChildren;
        // ifcLoader.setItemsDisplay(modelID, items, normalDisplay, scene);
    }
}

threeCanvas.ondblclick = selectObject;
