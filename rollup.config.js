import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'src/main.js',
    output: {
        file: 'dist/bundle.min.js',
        format: 'iife',
        name: 'hipbt',
        plugins: [terser()],
    },
    plugins: [json(), nodeResolve({ browser: true }), commonjs()]
}