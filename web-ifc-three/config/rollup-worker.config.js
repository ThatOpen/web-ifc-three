import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/IFC/web-workers/IFCWorker.ts',
  output: [
    {
      file: 'dist/IFCWorker.js',
      format: 'esm', // ES Modules
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      "tsconfig": "config/tsconfig.json"
    })
  ],
};
