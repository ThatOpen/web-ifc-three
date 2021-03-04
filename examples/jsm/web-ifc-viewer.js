import { Init3DView, scene } from './web-ifc-scene';
import { IFCLoader } from '../../src/jsm/IfcLoader';



window.InitWebIfcViewer = async () => {
  // const fileInput = document.getElementById('finput');
  // fileInput.addEventListener('change', fileInputChanged);
  Init3DView();
  const ifcLoader = new IFCLoader();
  ifcLoader.load('./rac_basic_sample_project.ifc', (geometry) => scene.add(geometry));
};

// async function fileInputChanged() {
//   let fileInput = document.getElementById('finput');
//   if (fileInput.files.length == 0) return console.log('No files selected!');
//   const file = fileInput.files[0];
//   const reader = getFileReader(fileInput);
//   reader.readAsArrayBuffer(file);
// }

// function getFileReader(fileInput) {
//   var reader = new FileReader();
//   reader.onload = () => {
//     const data = getData(reader);
//     LoadModel(data);
//     fileInput.value = '';
//   };
//   return reader;
// }

// function getData(reader) {
//   const data = new Uint8Array(reader.result);
//   return data;
// }

// function LoadModel(data) {

// }
