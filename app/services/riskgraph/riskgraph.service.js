
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
 * Project Utilities
 */
const Utils = require('../../lib/utils');

/**
 * Async operations helper
 */
const async = require('async');

/**
 * Helper module to determine data types
 */
const is = require('s-is');

/**
 * Requiring Lodash helpers module
 */
const _ = require('lodash');

/**
 * Moment operations helper
 */
const moment = require('moment');

/**
 * Require Models
 *
 * @ignore
 */
const RiskgraphModel = require('../../models/flask/riskgraphmodel');


/**
 * Business logic to collect data for alert rules processing
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class RiskgraphService extends BaseService {

    /**
     * @constructor
     */
    constructor () {
        // this
        super();

        /**
         * FLASK
         * @type {RiskgraphModel}
         */
        this.riskgraphTable = new RiskgraphModel();

    }

    /**
     * Algorithm for anomaly detection: Distance based. Single variable
     * @return {Promise} isAnomaly list
     *
     */
    callDetectors(dataObject) {
        return new Promise((resolve, reject) => {
            let locals = {};
            locals.validations = [];
            async.series([
                done => { // 1. levelOneAnomalyDetector
                    //console.log("1. levelOneAnomalyDetector");
                    this.riskgraphTable.levelOneAnomalyDetector(dataObject, (error, result) => {
                        if (error) done(`[Flask Riskgraph] levelOneAnomalyDetector error ${error}`);
                        else {
                            locals.validations = _.union(locals.validations, result);
                            done(null);
                        }
                    })
                },
                done => { // 2. levelTwoAnomalyDetector
                    //console.log("2. levelTwoAnomalyDetector");
                    this.riskgraphTable.levelTwoAnomalyDetector(dataObject, (error, result) => {
                        if (error) done(`[Flask Riskgraph] levelTwoAnomalyDetector error ${error}`);
                        else{
                            locals.validations = _.union(locals.validations, result);
                            done(null);
                        }
                    })
                },
            ], error => {
                if (error) reject(error);
                else resolve(locals.validations);
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
 * Export Alert Data Service
 */
module.exports = RiskgraphService;
