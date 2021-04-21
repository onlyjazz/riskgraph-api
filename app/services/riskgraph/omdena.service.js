
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
     * Level 1 Anomaly Detector - Typing, missing data, out-of-sequence and out-of-range-based anomalies
     * @return {Promise} isAnomaly list
     *
     */
    level1(dataObject) {
        return new Promise((resolve, reject) => {
            let locals = {};
            locals.result = {};
            locals.result.data = [];
            async.series([
                done => { // 1. build result
                    locals.result.endpoint = dataObject.endpoint;
                    locals.result.score = Math.floor(Math.random() * 100);
                    async.forEachLimit(dataObject.data, 1, function (item, nextItem) {
                        let isAnomalyData = item;
                        isAnomalyData.isAnomaly = (Math.random() < 0.5);
                        locals.result.data.push(isAnomalyData);
                        nextItem();

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
     * Level 1 Anomaly Detector - Typing, missing data, out-of-sequence and out-of-range-based anomalies
     * @return {Promise} isAnomaly list
     *
     */
    level2(dataObject) {
        return new Promise((resolve, reject) => {
            let locals = {};
            locals.result = {};
            locals.result.data = [];
            async.series([
                done => { // 1. build result
                    locals.result.endpoint = dataObject.endpoint;
                    locals.result.score = Math.floor(Math.random() * 100);
                    async.forEachLimit(dataObject.data, 1, function (item, nextItem) {
                        let isAnomalyData = item;
                        isAnomalyData.isAnomaly = (Math.random() < 0.5);
                        locals.result.data.push(isAnomalyData);
                        nextItem();

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
     * Level 1 Anomaly Detector - Typing, missing data, out-of-sequence and out-of-range-based anomalies
     * @return {Promise} isAnomaly list
     *
     */
    level3(dataObject) {
        return new Promise((resolve, reject) => {
            let locals = {};
            locals.result = {};
            locals.result.data = [];
            async.series([
                done => { // 1. build result
                    locals.result.endpoint = dataObject.endpoint;
                    locals.result.score = Math.floor(Math.random() * 100);
                    async.forEachLimit(dataObject.data, 1, function (item, nextItem) {
                        let isAnomalyData = item;
                        isAnomalyData.isAnomaly = (Math.random() < 0.5);
                        locals.result.data.push(isAnomalyData);
                        nextItem();

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
