
"use strict";

// If NODE_ENV defined, loading environment from config folder.
var environment = "development";
if (process.env.NODE_ENV) {
    environment = process.env.NODE_ENV;
}
const envFile = __dirname + "/config/" + environment + ".json";
console.log("#### Loading environment file: " + envFile);
const config = require(envFile);

module.exports = config;
