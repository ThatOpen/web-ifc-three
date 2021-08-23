// noinspection JSUnusedGlobalSymbols

import resolve from '@rollup/plugin-node-resolve'; // locate and bundle dependencies in node_modules (mandatory)

export default {
  input: 'src/main.js',
  output: [
    {
      format: 'cjs',
      file: 'bundle.js'
    },
  ],
  plugins: [
    resolve()
  ]
};