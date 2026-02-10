const path = require("node:path");

/** @type {import("next").NextConfig} */
module.exports = {
  typedRoutes: true,
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname, "..", ".."),
  },
};
