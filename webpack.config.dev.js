// webpack.config.dev.js
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    app: path.resolve(__dirname, "src", "index.jsx"),
  },
  output: {
    filename: "assets/app.js",
    path: path.resolve(__dirname),
    publicPath: "",
  },
  devtool: "inline-source-map",
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "assets/app.css" }),
    new CopyPlugin({
      patterns: [
        { from: "assets/iframe.html", to: "assets/iframe.html" },
        { from: "manifest.json", to: "manifest.json" },
      ],
    }),
  ],
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
  },
};
