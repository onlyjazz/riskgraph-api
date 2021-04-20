
"use strict";

/**
 * Define base paths for Flask API Controllers
 *
 */
module.exports = function () {
    return {
        'post|/auth/:action': 'authcontroller.js',
        'all|/api/v0/:id': 'riskgraph/riskgraph.js',
        'all|/api/v1/:id': 'riskgraph/omdena.js',
    };
};
