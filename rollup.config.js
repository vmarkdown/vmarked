// import babel from 'rollup-plugin-babel';
import { uglify } from "rollup-plugin-uglify";

export default {
    input: 'src/index.js',
    plugins: [
        // babel({
        //
        // })
        // uglify()
    ],
    output: {
        exports: 'default',
        file: './dist/vmarked.js',
        format: 'umd',
        name: 'vmarked'
    }
};