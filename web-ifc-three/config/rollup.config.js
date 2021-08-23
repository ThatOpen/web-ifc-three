import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm', // ES Modules
      sourcemap: true
    }
  ],
  external: ['web-ifc', 'three-mesh-bvh', 'three', 'three/examples/jsm/utils/BufferGeometryUtils'],
  plugins: [
    resolve(),
    typescript({
      "tsconfig": "config/tsconfig.json"
    })
  ],
};
