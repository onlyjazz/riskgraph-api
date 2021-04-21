
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
/**
 * Helper module to determine data types
 */
const is = require('s-is');

/**
 * Require User authentication
 *
 * @type {Authenticated}
 */
const JWTAuthorizedBase = require('../jwtauthorizedbase');

const RiskgraphService = require('../../services/riskgraph/riskgraph.service');


/**
 * Test Controller
 *
 *
 */
class RiskgraphController extends JWTAuthorizedBase {

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
                    // Find risk data
                    default: this.callDetectors(callback); break;
                    // Find risk data - v0 level-1
                    case 'level-1': this.callDetectors(callback); break
                }
                // first switch
                break;
        }
    }

    /**
     * @swagger
     *  /api/v0/level-1:
     *    post:
     *      tags:
     *         - FLASK RISKGRAPH
     *      summary: Level 1 Anomaly Detector - missing data, out-of-sequence and out-of-range-based anomalies
     *      description: Algorithm for anomaly detection. Distance based. Single variable
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
     *          $ref: '#/definitions/FlaskRiskgraphDataRequestRpc'
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
     * Algorithm for anomaly detection: Distance based. Single variable
     *
     * @param {Function} callback
     * @public
     */
    callDetectors ( callback ) {
        // required fields
        let { data } = this.request.body;
        // validation
        let errorMessage = '';
        if (!(data)) errorMessage += (errorMessage ?',':'')+'[data]';
        // validation error
        if (errorMessage) {
            errorMessage += ' parameter(s) is required.';
            return callback(new Core.Error.HTTPError(errorMessage, 400));
        }

        const riskgraphService = new RiskgraphService();
        riskgraphService.callDetectors(this.request.body)
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
module.exports = RiskgraphController;
