const babelOptions = {
  plugins: [
    "@emotion",
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
  ],
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
    [
      "@babel/preset-react",
      {
        runtime: "automatic",
      },
    ],
  ],
}
module.exports = require("babel-jest").default.createTransformer(babelOptions)
