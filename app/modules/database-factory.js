
// Using STRICT mode for ES6 features
"use strict";

/**
 * Initialize Postgres Library
 */
const {Pool, Client} = require('pg');

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;


/**
 * Async operations helper
 */
const async = require('async');

/**
 * Requiring core Events module
 */
const events = require('events');

/**
 * Requiring Lodash helpers module
 */
const _ = require('lodash');

/**
 * Database Enviroment Class
 *
 * @type {Database}
 */
const DatabaseEnvironment = require('./database-environment');

/**
 * Standard libraries
 */
const util = require('util');

/**
 *  Simple Database abstraction.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class DatabaseFactory extends events.EventEmitter {

    /**
     * Database holder constructor
     */
    constructor() {
        // We must call super() in child class to have access to 'this' in a constructor
        super();
    }

    /**
     * Module initialization method. Autorun from Application Facade.
     */
    init () {
        // Load database configuration
        this.configure(ApplicationFacade.instance.config.items.database);
    }

    /**
     * Reconfigure database and reset connections
     *
     * @param config
     * @param callback
     */
    configure (config, callback) {
        this.ENVIRONMENTS = {};
        this._FLASK = null; // Concrete Flask Environment
        this._config = config; // Factory configuration

        // Create EDC Environments Map
        this._edcMap = {};
        for (let i in config.edc) {
            let environment = config.edc[i];
            if (environment && environment.studyUID) {
                this._edcMap[environment.studyUID] = environment;
            }
            if (environment && environment.uid) {
                this._edcMap[environment.uid] = environment;
            }
        }
    }

    /**
     * Initialize Flask IDP connection pool, which is alias for flask at this moment.
     *
     * @param callback
     */
    idp (callback) {
        this.flask(callback);
    }

    /**
     * Initialize Flask Database connection pool
     *
     * @param callback
     */
    flask (callback) {
        if (this._FLASK != null) {
            callback(null, this._FLASK);

            return;
        }

        var environmentInstance = new DatabaseEnvironment();
        this._FLASK = environmentInstance;
        environmentInstance.initPool(this._config.flask, (error) => {
            if (error) {
                console.error("#### [%s] FAILED. Resuming operations.", 'Flask');
                return callback(error);
            } else {
                console.log("#### [%s] CONNECTED", 'Flask');
            }

            callback(null, this._FLASK);
        });
    }

    /**
     * Initialize EDC Environment with some specific Study Unique ID
     *
     * @param edcUid
     * @param callback
     * @returns {*}
     */
    edc (edcUid, callback = (function () {}) ) {

        if (this.ENVIRONMENTS[edcUid] != null) {
            callback(null, this.ENVIRONMENTS[edcUid]);

            return this.ENVIRONMENTS[edcUid];
        }

        console.log("Initializing Environment: ", edcUid);

        if (!edcUid || this._edcMap == null || this._edcMap[edcUid] == null) {
            console.error("Requested environment [%s] not configured.", edcUid);

            callback(new Error(util.format("Requested environment [%s] not configured.", edcUid)));

            return null;
        }

        var environmentInstance = new DatabaseEnvironment(this._edcMap[edcUid]);
        this.ENVIRONMENTS[edcUid] = environmentInstance;
        console.log("## [%s] Connecting to EDC database.", edcUid);
        environmentInstance.initPool(this._edcMap[edcUid], (error) => {
            if (error) {
                console.error("#### [%s] FAILED. Resuming operations.", edcUid);
                return callback(error);
            } else {
                console.log("#### [%s] CONNECTED", edcUid);
            }

            callback(null, this.ENVIRONMENTS[edcUid]);
        });

        // Return new Environment Instance
        return this.ENVIRONMENTS[edcUid];
    }

    /**
     * Initialize EDC Environment with some specific Study Unique ID
     *
     * @param name
     * @param callback Function (flask, edc)
     * @returns {*}
     */
    environment (name, callback) {

        let locals = {};
        async.series([
            asyncCallback => {
                this.flask((error, environment) => {
                    if (error) {
                        return asyncCallback(error);
                    }

                    locals.flask = environment;
                    asyncCallback();
                });
            },
            asyncCallback => {
                this.edc(name, (error, environment) => {
                    if (error) {
                        return asyncCallback(error);
                    }

                    locals.edc = environment;
                    asyncCallback();
                });
            }
        ], (error) => {
            if (error) {
                // Something went wrong. Action is failed.
                console.error("#### [%s] Failed to initialize environment. Resuming operations.", name);
                return callback(error);
            }

            // Finalization
            return callback(null, locals.flask, locals.edc);
        });
    }

}

/**
 * Environment types
 *
 * @type {{}}
 * @private
 */
DatabaseFactory.ENVIRONMENT_FLASK = 'FLASK';
DatabaseFactory.ENVIRONMENT_IDP = 'IDP';
DatabaseFactory.ENVIRONMENT_EDC = 'EDC';

// Export database
module.exports = DatabaseFactory;
