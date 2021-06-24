# web-ifc-three

This library is the implementation of [web-ifc](https://github.com/tomvandig/web-ifc) for [THREE.js](https://github.com/mrdoob/three.js/). This allows to parse and generate the Three.js geometry of IFC models in JavaScript, both in the browser and on a Node server, as well as query the IFC data and override it. 

Note that you should use the IFCLoader of Three.js. Use this package only if you want to test the latest features that haven't been merged to three yet.

[Try it here!](https://ifcjs.github.io/web-ifc-three/example/)

## Content

this project consists of the following folders:

- **src**: contains the implementation of the IfcLoader for THREE.

- **examples**: contains one example of how to use the library.

It should be noted that in both cases the web-ifc .WASM file will be required. This file cannot be included in the general build and has to be in a the root folder; otherwise, you have to specify its path with `setWasmPath`. You can find a tutorial for this [here](https://agviegas.github.io/ifcjs-docs/#/guide). The correct functioning of this library with compressors like uglify or terser is not yet guaranteed.
