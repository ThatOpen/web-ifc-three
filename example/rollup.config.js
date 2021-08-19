// noinspection JSUnusedGlobalSymbols

import resolve from '@rollup/plugin-node-resolve'; // locate and bundle dependencies in node_modules (mandatory)

export default {
  input: 'example/src/main.js',
  output: [
    {
      format: 'cjs',
      file: 'example/bundle.js'
    },
  ],
  plugins: [
    resolve()
  ]
};