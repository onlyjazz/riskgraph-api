
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');

/**
 * Require User authentication
 *
 * @type {Authenticated}
 */
const JWTAuthorizedBase = require('../jwtauthorizedbase');

const OmdenaService = require('../../services/riskgraph/omdena.service');


class OmdenaController extends JWTAuthorizedBase {

    /**
     * @description Flask Controller constructor
     *
     * @param {object} request
     * @param {object} response
     */
    constructor (request, response) {
        super(request, response);
    }

    /**
     * Initialize CRUD actions
     *
     * @param {Function} callback
     * @abstract
     */
    load ( callback ) {
        // extract variables
        let {url, method, params: {id}} = this.request;
        // Apply corresponding items depending on the HTTP method
        switch (method) {
            // unsupported method
            default:
                callback(new Core.Error.HTTPError(`[Method: ${method}] Method is not supported for ${url}`, 400)); break;
            // different endpoints
            case 'POST':
                switch (id) {
                    // Call omdena API
                    default: this.level1(callback); break;
                    // Call omdena API - v1 level-1
                    case 'level-1': this.level1(callback); break
                    // Call omdena API - v1 level-2
                    case 'level-2': this.level2(callback); break
                    // Call omdena API - v1 level-3
                    case 'level-3': this.level3(callback); break
                }
                // first switch
                break;
        }
    }

    /**
     * @swagger
     *  /api/v1/level-1:
     *    post:
     *      tags:
     *         - FLASK OMDENA
     *      summary: Level 1 Anomaly Detector - Typing, missing data, out-of-sequence and out-of-range-based anomalies
     *      description: Level 1 Anomaly Detector - Typing, missing data, out-of-sequence and out-of-range-based anomalies
     *      consumes:
     *          - application/json
     *      produces:
     *          - application/json
     *      parameters:
     *      - in: header
     *        $ref: '#/definitions/schemas/Authentication'
     *      - in: body
     *        name: body
     *        description: Data Object
     *        required: true
     *        schema:
     *          $ref: '#/definitions/OmdenaV1Level1DataRequestRpc'
     *      responses:
     *        '400':
     *          $ref: '#/definitions/responses/400'
     *        '401':
     *          $ref: '#/definitions/responses/401'
     *        '404':
     *          $ref: '#/definitions/responses/404'
     *        '500':
     *          $ref: '#/definitions/responses/500'
     *        '200':
     *          description: Successful operation
     */
    /**
     * Anomaly Detector - single and multivariate anomaly detection
     *
     * @param {Function} callback
     * @public
     */
    level1 ( callback ) {
        // required fields
        let { data, endpoint, ranges } = this.request.body;
        // validation
        let errorMessage = '';
        if (!(data)) errorMessage += (errorMessage ?',':'')+'[data]';
        if (!(endpoint)) errorMessage += (errorMessage ?',':'')+'[endpoint]';
        if (!(ranges)) errorMessage += (errorMessage ?',':'')+'[ranges]';
        // validation error
        if (errorMessage) {
            errorMessage += ' parameter(s) is required.';
            return callback(new Core.Error.HTTPError(errorMessage, 400));
        }

        const omdenaService = new OmdenaService();
        omdenaService.level1(this.request.body)
            .then(success => {
                this.view(Core.View.jsonView(success));
                callback();
            })
            .catch(error => {
                callback(new Core.Error.HTTPError(error, 400));
            });
    }

    /**
     * @swagger
     *  /api/v1/level-2:
     *    post:
     *      tags:
     *         - FLASK OMDENA
     *      summary: Level 2 Anomaly Detection - single variable anomalies, for example dose
     *      description: Level 2 Anomaly Detection - single variable anomalies. Endpoint can be a SUBJID, device, site,  visit, CRF, PI described by a GUID. Metadata m can be an object.
     *      consumes:
     *          - application/json
     *      produces:
     *          - application/json
     *      parameters:
     *      - in: header
     *        $ref: '#/definitions/schemas/Authentication'
     *      - in: body
     *        name: body
     *        description: Data Object
     *        required: true
     *        schema:
     *          $ref: '#/definitions/OmdenaV1Level2DataRequestRpc'
     *      responses:
     *        '400':
     *          $ref: '#/definitions/responses/400'
     *        '401':
     *          $ref: '#/definitions/responses/401'
     *        '404':
     *          $ref: '#/definitions/responses/404'
     *        '500':
     *          $ref: '#/definitions/responses/500'
     *        '200':
     *          description: Successful operation
     */
    /**
     * Anomaly Detector - single and multivariate anomaly detection
     *
     * @param {Function} callback
     * @public
     */
    level2 ( callback ) {
        // required fields
        let { data, endpoint, models } = this.request.body;
        // validation
        let errorMessage = '';
        if (!(data)) errorMessage += (errorMessage ?',':'')+'[data]';
        if (!(endpoint)) errorMessage += (errorMessage ?',':'')+'[endpoint]';
        if (!(models)) errorMessage += (errorMessage ?',':'')+'[models]';
        // validation error
        if (errorMessage) {
            errorMessage += ' parameter(s) is required.';
            return callback(new Core.Error.HTTPError(errorMessage, 400));
        }

        const omdenaService = new OmdenaService();
        omdenaService.level2(this.request.body)
            .then(success => {
                this.view(Core.View.jsonView(success));
                callback();
            })
            .catch(error => {
                callback(new Core.Error.HTTPError(error, 400));
            });
    }

    /**
     * @swagger
     *  /api/v1/level-3:
     *    post:
     *      tags:
     *         - FLASK OMDENA
     *      summary: Level 3 Anomaly Detection - multivariate anomalies  for example anomalies on patient dose and age
     *      description: Level 3 Anomaly Detection - multivariate anomalies  for example anomalies on patient dose and age. Endpoint can be a SUBJID, device, site,  visit, CRF, PI described by a GUID. Metadata m can be an object.
     *      consumes:
     *          - application/json
     *      produces:
     *          - application/json
     *      parameters:
     *      - in: header
     *        $ref: '#/definitions/schemas/Authentication'
     *      - in: body
     *        name: body
     *        description: Data Object
     *        required: true
     *        schema:
     *          $ref: '#/definitions/OmdenaV1Level3DataRequestRpc'
     *      responses:
     *        '400':
     *          $ref: '#/definitions/responses/400'
     *        '401':
     *          $ref: '#/definitions/responses/401'
     *        '404':
     *          $ref: '#/definitions/responses/404'
     *        '500':
     *          $ref: '#/definitions/responses/500'
     *        '200':
     *          description: Successful operation
     */
    /**
     * Anomaly Detector - single and multivariate anomaly detection
     *
     * @param {Function} callback
     * @public
     */
    level3 ( callback ) {
        // required fields
        let { data, endpoint, models } = this.request.body;
        // validation
        let errorMessage = '';
        if (!(data)) errorMessage += (errorMessage ?',':'')+'[data]';
        if (!(endpoint)) errorMessage += (errorMessage ?',':'')+'[endpoint]';
        if (!(models)) errorMessage += (errorMessage ?',':'')+'[models]';
        // validation error
        if (errorMessage) {
            errorMessage += ' parameter(s) is required.';
            return callback(new Core.Error.HTTPError(errorMessage, 400));
        }

        const omdenaService = new OmdenaService();
        omdenaService.level3(this.request.body)
            .then(success => {
                this.view(Core.View.jsonView(success));
                callback();
            })
            .catch(error => {
                callback(new Core.Error.HTTPError(error, 400));
            });
    }

}

/**
 * Exporting Controller
 *
 * @type {Function}
 */
module.exports = OmdenaController;
