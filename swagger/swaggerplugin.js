
'use strict';

/**
 * Require Helpers
 *
 * @ignore
 */
const fs = require('fs');
const yaml = require('write-yaml');
const swaggerDoc = require('swagger-jsdoc');

/**
 * helper to determine data type
 */
const is = require('s-is');

/**
 * Universal method of authentication
 *
 *
 * @param {Object} definitions
 * @class
 */
class SwaggerPlugin {
    /**
     * @param {Object} definitions - default data
     * @constructor
     */
    constructor (options, definitions) {

        let apis = ['./app/controllers/**/*.js'];
        if (options && is.array(options.apis)) {
            apis = options.apis;
        }

        /**
         * generated object of swagger annotation
         *
         * @type {Object}
         */
        this.spec = swaggerDoc({
            // Import swaggerDefinitions
            swaggerDefinition: definitions,
            // Path to the API docs
            apis: apis
        });

        /**
         * generated file name for JSON and YAML
         *
         * @type {String}
         */
        this.swaggerFileName = options.swaggerFileName;
    }

    /**
     * Write swagger JSON file
     *
     * @returns {Promise}
     */
    createJsonFile () {
        return new Promise((resolve, reject) => {
            fs.writeFile(`./swagger/${this.swaggerFileName}.json`, JSON.stringify(this.spec, null, 4), error => {
                if (error) return reject('[Swagger JSON] It was not possible to write yaml file.');
                console.log('[Swagger JSON] Was generated at', `${this.swaggerFileName}.json`);
                resolve();
            });
        });
    }

    /**
     * Write swagger YAML file
     *
     * @returns {Promise}
     */
    createYamlFile () {
        return new Promise((resolve, reject) => {
            yaml(`./swagger/${this.swaggerFileName}.yaml`, this.spec, error => {
                if (error) return reject('[Swagger YAML] It was not possible to write yaml file.');
                console.log('[Swagger YAML] Was generated at', `${this.swaggerFileName}.yaml`);
                resolve();
            });
        });
    }


    /**
     * Declares studyCallback
     *
     * @callback createSwaggerFilesCallback
     * @param {Object} error
     * @param {FlaskStudy} data
     */

    /**
     * Generate swagger files based on controllers comments
     *
     * @param {object} options
     * @param {createSwaggerFilesCallback} callback
     */
    static createSwaggerFiles (options, callback) {

        let defDataFilePath = './flask.json';
        let opts = null;
        let callbackFn = callback;
        if (!callbackFn && is.function(options)) {
            callbackFn = options;
        } else if (is.object(options)) {
            opts = options;
        }

        if(options.defDataFilePath) defDataFilePath = options.defDataFilePath;

        try {
            let defData = require(defDataFilePath);
            // change basePath if it needed
            if(opts && opts.basePath) defData.basePath = opts.basePath;
            // initialize plugin
            let swagger = new SwaggerPlugin(opts, defData);
            Promise.all([
                swagger.createJsonFile(),
                swagger.createYamlFile(),
            ])
            .then(() => {
                callbackFn(null, swagger);
            })
            .catch(error => {
                callbackFn(error);
            });
        } catch ( error ) {
            callbackFn(error);
        }
    }

}

/**
 * export SwaggerPlugin
 */
module.exports = SwaggerPlugin;
