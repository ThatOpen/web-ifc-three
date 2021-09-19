import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/IFC/web-workers/ifc-worker.ts',
  output: [
    {
      file: 'dist/IFCWorker.js',
      format: 'esm', // ES Modules
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    typescript({
      "tsconfig": "config/tsconfig.json"
    })
  ],
};
