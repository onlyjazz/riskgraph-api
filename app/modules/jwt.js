
// Using STRICT mode for ES6 features
"use strict";

/**
 * Initialize Postgres Library
 */
const jwt = require('jsonwebtoken');

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
 * Standard libraries
 */
const util = require('util');

/**
 * File System libraries
 */
const fs = require('fs');

/**
 *  Simple JWT Module
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class JWTModule extends events.EventEmitter {

    /**
     * Database holder constructor
     */
    constructor() {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        this.logger = ApplicationFacade.instance.logger;
    }

    /**
     * Module initialization method. Autorun from Application Facade.
     */
    init () {
        // Load database configuration
        this.configure(ApplicationFacade.instance.config.items.jwt);
    }

    /**
     * Reconfigure database and reset connections
     *
     * @param config
     * @param callback
     */
    configure (config, callback) {

        this.jwtCertificate = null;
        this.jwtOptions = {
            "algorithms": "HS256,HS384"
        };
        this.jwtSignOptions = {
            "algorithm": "HS384"
        };

        if (config && config.certFile) {
            console.log("Loading JWT certificate file");
            this.jwtCertificate = fs.readFileSync(config.certFile).toString().trim();
        }

        if (config && config.certificate) {
            this.jwtCertificate = config.certificate;
        }

        if (config && config.options) {
            this.jwtOptions = config.options;
        }

        if (config && config.sign) {
            this.jwtSignOptions = config.sign;
        }

        if (!this.jwtCertificate) {
            this.logger.error("ERROR: JWT certificate is not configured. Please specify jwt.certificate or jwt.certFile in environment config.");
            throw new Error("ERROR: JWT certificate is not configured. Please specify jwt.certificate or jwt.certFile in environment config.");
        }
    }

    /**
     * JWT callback type
     *
     * @callback jwtCallback
     * @param {object} error
     * @param {object} result
     */

    /**
     * Sign Payload object and return signed token
     *
     * @param {object} payload
     * @param {jwtCallback} callback
     * @returns {string} in case of empty callback
     */
    sign (payload, callback) {
        return jwt.sign(payload, this.jwtCertificate, this.jwtSignOptions, callback);
    }

    /**
     * Verify JWT token and return result or call callback
     *
     * @param {string} token
     * @param {jwtCallback} callback
     * @returns {object} in case of empty callback
     */
    verify (token, callback) {
        return jwt.verify(token, this.jwtCertificate, this.jwtOptions, callback);
    }

}

// Export JWT Module
module.exports = JWTModule;
