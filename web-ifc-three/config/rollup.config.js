import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

export default {
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
};
