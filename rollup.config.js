import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default [
  {
    input: 'main.js',
    output: {
      file: 'dist/browser.js',
      format: 'amd'
    },
    exports: 'named',
    plugins: [
      nodeResolve({
        jsnext: true,
        main: true
      }),
      commonjs()
    ]
  },
  {
    input: 'main.js',
    output: {
      file: 'dist/browser-old.js',
      format: 'amd'
    },
    exports: 'named',
    plugins: [
      nodeResolve({
        jsnext: true,
        main: true
      }),
      babel({
        exclude: 'node_modules/**',
      }),
      commonjs()
    ]
  }
];
