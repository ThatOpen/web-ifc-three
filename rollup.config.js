import resolve from '@rollup/plugin-node-resolve'; // locate and bundle dependencies in node_modules (mandatory)
// import { terser } from "rollup-plugin-terser"; // code minification (optional)
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import babel from '@rollup/plugin-babel';

export default {
  input: 'example/web-ifc-scene.js',
  output: [
    {
      format: 'cjs', // commonJS
      file: 'example/bundle.js'
    }
  ],
  plugins: [
    resolve(),
    typescript({ lib: ['es5', 'es6', 'dom'], target: 'es5' }),
    dts(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
