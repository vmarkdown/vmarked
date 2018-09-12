const path = require('path');

module.exports = {
    mode: 'none',
    entry:{
        vmarked: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: "umd",
        library: "vmarked"
    },
    module:{
        rules:[
            {
                test:/\.md$/,
                loader:'text-loader'
            }
        ]
    },
};
