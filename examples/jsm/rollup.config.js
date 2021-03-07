import resolve from '@rollup/plugin-node-resolve'; // locate and bundle dependencies in node_modules (mandatory)
// import { terser } from "rollup-plugin-terser"; // code minification (optional)

export default {
  input: 'examples/jsm/web-ifc-scene.js',
  output: [
    {
      format: 'cjs',
      file: 'examples/jsm/bundle.js'
    },
  ],
  plugins: [
    resolve()
  ]
};