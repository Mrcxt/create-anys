const autoprefixer = require("autoprefixer"); // https://www.npmjs.com/package/autoprefixer
const pxToViewport = require("postcss-px-to-viewport-8-plugin"); // https://www.npmjs.com/package/postcss-px-to-viewport-8-plugin

module.exports = {
  plugins: [
    autoprefixer(),
    pxToViewport({
      viewportWidth: 375
    })
  ]
};
