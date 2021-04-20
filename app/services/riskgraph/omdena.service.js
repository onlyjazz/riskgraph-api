
/**
 * MVC Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;
/**
 * Abstract BaseService
 *
 * @type {BaseService}
 */
const BaseService = require('../base.service');

/**
 * Async operations helper
 */
const async = require('async');

/**
 * Require Models
 *
 * @ignore
 */
//const RiskgraphModel = require('../../models/flask/riskgraphmodel');


/**
 * Business logic to Omdena models
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class OmdenaService extends BaseService {

    /**
     * @constructor
     */
    constructor () {
        // this
        super();

    }

    /**
     * Algorithm for anomaly detection: Distance based. Single variable
     * @return {Promise} isAnomaly list
     *
     */
    level1(dataObject) {
        return new Promise((resolve, reject) => {
            let locals = {};
            locals.result = {};
            locals.result.data = {};
            locals.result.data.result = [];
            async.series([
                done => { // 1. build result
                    locals.result.endpoint = dataObject.endpoint;
                    locals.result.score = Math.floor(Math.random() * 100);
                    locals.result.data.timestamp = dataObject.data.timestamp;
                    async.forEachLimit(Object.keys(dataObject.data), 1, function (key, nextKey) {
                        if (key == 'timestamp') nextKey();
                        else {
                            let isAnomalyData = {};
                            isAnomalyData[key] = dataObject.data[key];
                            isAnomalyData.isAnomaly = (Math.random() < 0.5);
                            locals.result.data.result.push(isAnomalyData);
                            nextKey();
                        }
                    }, function () {
                        done(null);
                    });
                },
            ], error => {
                if (error) reject(error);
                else resolve(locals.result);
            });
        });
    }

     /**
     * No initialization
     * @ignore
     */
    initialize () {
        ;
    }
}

/**
 * Export OmdenaService
 */
module.exports = OmdenaService;
