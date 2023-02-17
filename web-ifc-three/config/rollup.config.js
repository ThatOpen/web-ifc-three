import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

export default [
{
    // UMD
    input:'src/IFCLoader.ts',
    external:['web-ifc', 'three-mesh-bvh', 'three', 'three/examples/jsm/utils/BufferGeometryUtils'],
	  output: {
      file: `dist/IFCLoader.umd.cjs`,
      format: "umd",
      name: "IFCLoader", // this is the name of the global object
      sourcemap: true,
      // Expose BufferGeometryUtils globally
      globals:{
        three:'THREE'
        ,'web-ifc':'WebIFC'
        ,'three/examples/jsm/utils/BufferGeometryUtils':'THREE.BufferGeometryUtils'
        ,'bim-fragment/geometry-utils':'geometryUtils'
        ,'bim-fragment/fragment':'fragment'
      }
    },	
	  plugins: [
      typescript({
      "tsconfig": "config/tsconfig.json"
      })
    ],
   
 },{
  input: 'src/IFCLoader.ts',
  output: [
    {
      file: 'dist/IFCLoader.js',
      format: 'esm', // ES Modules
      sourcemap: true
    }
  ],
  external: ['web-ifc', 'three-mesh-bvh', 'three', 'three/examples/jsm/utils/BufferGeometryUtils'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      "tsconfig": "config/tsconfig.json"
    })
  ],
}];
