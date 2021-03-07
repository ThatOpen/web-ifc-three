# web-ifc-three

This library is the implementation of [web-ifc](https://github.com/tomvandig/web-ifc) for [THREE.js](https://github.com/mrdoob/three.js/). This allows to parse and generate the geometry of IFC models in JavaScript, both in the browser and on a Node server. 

## Content

this project consists of the following folders:

- **src**: contains the implementation of the IfcLoader for THREE. It contains two folders, one for each alternative: 
  - **jm**: implementation in cjs (importable as <script> in the HTML).
  - **jsm**: implementation using JS modules.

- **examples**: contains two examples:
  - **jm**: implementation using IfcLoader with cjs.
  - **jsm**: implementation using IfcLoader with modules.

It should be noted that in both cases the web-ifc .WASM file will be required. This file cannot be included in the general build and has to be in a specific directory (see examples). The correct functioning of this library with compressors like uglify or terser is not yet guaranteed.
