const path = require('path');

module.exports = {
  mode: "development",
  entry: './src/index.js',
  module: {
    rules: [
     {
       test: /\.html$/,
       use: "blaze-loader"
     }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  }
};
