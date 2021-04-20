
"use strict";

/**
 * Define base paths for Flask API Controllers
 *
 */
module.exports = function () {
    return {
        'all|/api/v0/:id': 'riskgraph/riskgraph.js',
        'all|/api/v1/:id': 'riskgraph/omdena.js',
    };
};
