import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './index.js',
  output: {
    name: "Runner",
    file: 'dist/runner.js',
    format: 'esm'
  },
  plugins: []
};
