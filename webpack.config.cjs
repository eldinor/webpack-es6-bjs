// webpack.config.cjs
const path = require("path");
const WorkerUrlPlugin = require('worker-url/plugin');
module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, "./src/index.tsx"),
  output: {
    filename: "[name].[hash:8].js",
    path: path.resolve(__dirname, "./dist"),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],

    // ! webpack5 no longer provides built-in polyfills for Node.js dependencies.
    alias: {
       "os": false,
       "child_process": false,
       "worker_threads": false
     }
  },
  plugins: [
    // add this
    new WorkerUrlPlugin(),
  ],
};