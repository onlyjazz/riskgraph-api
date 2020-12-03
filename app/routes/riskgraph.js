
"use strict";

/**
 * Define base paths for Flask API Controllers
 *
 */
module.exports = function () {
    return {
        'all|/riskgraph/:id': 'riskgraph/riskgraph.js',
    };
};
