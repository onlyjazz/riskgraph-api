
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;

/**
 * Including base PG model
 *
 * @type {PGModelBase}
 */
const FlaskModelBase = require("../flaskmodelbase");

/**
 * Requiring Lodash helpers module
 */
const _ = require('lodash');

/**
 * Async operations helper
 */
const async = require('async');

/**
 * Requiring Lodash helpers module
 */
const moment = require('moment');

/**
 *  Flask riskgraph model
 *
 *  @class
 */
class FlaskRiskgraphModel extends FlaskModelBase {
    /**
     * FlaskModelBase holder constructor
     */
    constructor() {
        // this
        super();

        /**
         * Default table schema
         *
         * @type {{fields: {}, table: null}}
         */
        /*this.schema = {
            fields: {},
            table: "users",
            pk: "id"
        };*/
    }

    /**
     * @description Loop on array where k is element k in the data array
     * @param {object} dataObject - data for riskgraph
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
    levelOneAnomalyDetector ( dataObject, riskgraphCallback ) {
        let locals = {};
        locals.data = dataObject.data;
        locals.rangeData = dataObject.rangeData;
        locals.validations = [];
        async.series([
            done => { // 1. Timestamp validations
                this.timestampValidation(locals.data, (error, timestampValidationCallback) => {
                   if(error) done('[FLASK RISKGRAPH] Error timestamp validations: ' + error);
                   else {
                       locals.validations = _.union(locals.validations, timestampValidationCallback);
                       done(null);
                   }
                });
            },
            done => { // 2. Get all keys from Array of jsons
                this.geyDataKeys(locals.data, (error, geyDataKeysCallback) => {
                    if(error) done('[FLASK RISKGRAPH] Error get data keys: ' + error);
                    else {
                        locals.dataKeys = geyDataKeysCallback;
                        done(null);
                    }
                });
            },
            done => { // 3. Missing values validations
                this.missingValuesValidation(locals.data, locals.dataKeys, (error, missingValuesValidationCallback) => {
                    if(error) done('[FLASK RISKGRAPH] Error missing values validations: ' + error);
                    else {
                        locals.validations = _.union(locals.validations, missingValuesValidationCallback);
                        done(null);
                    }
                });
            },
            done => { // 4. Out of Range validations
                if(!locals.rangeData) return done(null);
                this.outOfRangeValidation(locals.data, locals.rangeData, (error, outOfRangeValidationCallback) => {
                    if(error) done('[FLASK RISKGRAPH] Error out of range validations: ' + error);
                    else {
                        locals.validations = _.union(locals.validations, outOfRangeValidationCallback);
                        done(null);
                    }
                });
            }
            ], error => {
            if (error) riskgraphCallback(error);
            else riskgraphCallback(null, locals.validations);
        });
    }

    /**
     * @description Timestamp validation
     * @param {object} data - data for riskgraph
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
     timestampValidation ( data, riskgraphCallback ) {
        let locals = [];
        async.forEachOf(data, function (row, index, nextRow) {
            //when:  value is null  return isAnomaly: ‘t’, reason: ‘Missing value’
            if (!row.timestamp) {
                //locals.push({isAnomaly: true, reason: 'Missing timestamp'});
            } else {
                //when:  Timestamp (k) < Timestamp (k-1) return  isAnomaly: ‘t’, reason: ‘Out of sequence’
                if (index > 0 && data[index - 1].timestamp && row.timestamp < data[index - 1].timestamp) {
                    locals.push({isAnomaly: true, reason: 'Out of sequence'});
                }
                //when:  Timestamp (k) invalid timestamp return isAnomaly: ‘t’, reason: ‘Invalid timestamp’
                if (!moment(row.timestamp).isValid()) {
                    locals.push({isAnomaly: true, reason: 'Invalid timestamp'});
                }
            }
            nextRow();//Callback when 1 item is finished
        }, function () {
            //This function is called when the whole forEach loop is over
            riskgraphCallback(null, locals);
        });
    };

    /**
     * @description Check missing values
     * @param {object} data - data for riskgraph
     * @param {object} dataKeys - all keys in data object
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
    missingValuesValidation ( data, dataKeys, riskgraphCallback ) {
        let validations = [];
        data.map((row, index) => {
            dataKeys.map(key => {
                //when:  value is null  return isAnomaly: ‘t’, reason: ‘Missing value’
                if (!row[key]) validations.push({isAnomaly: true, reason: 'Missing value '+key});
            });
        });
        riskgraphCallback(null, validations);
    };

    /**
     * @description Get data keys
     * @param {object} data - data for riskgraph
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
    geyDataKeys ( data, riskgraphCallback ) {
        let dataKeys = [];
        //Get all keys in data object
        Object.keys(data).map(key=> {
            dataKeys = _.union(dataKeys,Object.keys(data[key]));
        });
        riskgraphCallback(null, dataKeys);
    };

    /**
     * @description Check Out of range
     * @param {object} data - data for riskgraph
     * @param {object} rangeData - rangeData object
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
    outOfRangeValidation ( data, rangeData, riskgraphCallback ) {
        let locals = {};
        locals.validations = [];
        rangeData.map(range => {
            locals.rangeKey = Object.keys(range)[0];
            data.map((row, index) => {
                if (row[locals.rangeKey] && (row[locals.rangeKey] > range[locals.rangeKey].upperBound || row[locals.rangeKey] < range[locals.rangeKey].lowerBound))
                    locals.validations.push({isAnomaly: true, reason: 'Out of range '+locals.rangeKey});
            });
        });
        riskgraphCallback(null, locals.validations);
    };

    /**
     * @description Loop on array where k is element k in the data array
     * @param {object} dataObject - data for riskgraph
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
    levelTwoAnomalyDetector ( dataObject, riskgraphCallback ) {
        let locals = {};
        locals.data = dataObject.data;
        locals.t = dataObject.toleranceData;
        locals.validations = [];
        async.series([
            done => { // 1. Get all keys from Array of jsons
                this.geyDataKeys(locals.data, (error, geyDataKeysCallback) => {
                    if(error) done('[FLASK ANALYTICS] Error get data keys: ' + error);
                    else {
                        locals.dataKeys = geyDataKeysCallback;
                        done(null);
                    }
                });
            },
            done => { // 2. Group data by keys - create array for each key
                this.groupDataByKey(locals.data, locals.dataKeys, (error, groupDataByKeyCallback) => {
                    if(error) done('[FLASK ANALYTICS] Error grouop data by keys : ' + error);
                    else {
                        locals.groupData = groupDataByKeyCallback;
                        done(null);
                    }
                });
            },
            done => { // 3. Get Distance for each value
                locals.this = this;
                async.forEachOf(locals.groupData, function (group, index, nextGroup) {
                    locals.this.getDistanceValidation(group, locals.t[index], (error, distanceValidationCallback) => {
                        if(error) done('[FLASK ANALYTICS] Error get data distance for '+index+' values : ' + error);
                        else {
                            locals.validations = _.union(locals.validations, distanceValidationCallback);
                            nextGroup();//Callback when 1 item is finished
                        }
                    });
                }, function () {
                    //This function is called when the whole forEach loop is over
                    done(null);
                });
            },
        ], error => {
            if (error) riskgraphCallback(error);
            else riskgraphCallback(null, locals.validations);
        });
    }

    /**
     * @description Get data Distance
     * @param {object} data - data for analytics of 1 key
     * @param {array} dataKeys - all kets in data objects
     * @param {riskgraphCallback} analyticsCallback
     * @public
     */
    groupDataByKey ( data, dataKeys, riskgraphCallback ) {
        let locals = {};
        dataKeys.map(dataKey=> {
            locals[dataKey] = [];
            data.map(row=> {
                if(row[dataKey]) locals[dataKey].push({value:row[dataKey]});
            });
        });
        riskgraphCallback(null, locals);
    };

    /**
     * @description Get Distance Validation
     * @param {object} data - data for analytics of 1 key
     * @param {integer} t - tolerance
     * @param {riskgraphCallback} riskgraphCallback
     * @public
     */
    getDistanceValidation ( data, t, riskgraphCallback ) {
        //Get Distance for each data object
        //data = [{data1:1},{data1:44},{data1:55}]
        if(!t) t = 1;
        let locals = {};
        locals.maxDistance = 0;
        locals.validations = [];
        let dataDistance =  data.map(row=> {
                // Distance (k) = abs (value(k) - value(1)
                row.distance = Math.abs( data[0].value - row.value);
                // Compute maxDistance
                if( row.distance > locals.maxDistance) locals.maxDistance = row.distance;
                return row;
        });
        // midDistance = Compute cutoff = maxDistance/t
        locals.midDistance = ~~(locals.maxDistance/t);
        dataDistance.map(row=> {
            // when:  Distance(k) > cutoff return isAnomaly: ‘t’, reason: ‘Way out man’
            if(row.distance > locals.midDistance)
                locals.validations.push({isAnomaly: true, reason: 'Way out man '+row.value});
        });
        riskgraphCallback(null, locals.validations);
    };

}

// Export Model
module.exports = FlaskRiskgraphModel;
