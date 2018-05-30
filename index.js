// Set options as a parameter, environment variable, or rc file.
require = require("esm")(module/*, options*/);
const { default: Adapter, Cache } = require("./main.js");
Adapter.Cache = Cache;
module.exports = Adapter;
