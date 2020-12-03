
/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');

/**
 * Require User
 *
 * @type {UserService}
 */
const FlaskUserService = require('../services/flask/user.service');

/**
 * Helper to determine data types
 */
const is = require('s-is');

/**
 *  Base Flask API Controller
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class LoginController extends Core.Controller {

    /**
     * @description Flask Controller constructor
     *
     * @param {object} request
     * @param {object} response
     */
    constructor ( request, response ) {
        // this
        super(request, response);

        // Registering actions
        this.registerAction('authorize', 'authorize');
        this.registerAction('logout', 'logout');
    }

    /**
     * @description Pre-initialize data and event handlers
     * @param {Function} callback
     * @override
     */
    preInit (callback) {
        callback();
    }

    /**
     * @swagger
     * /auth/authorize:
     *    post:
     *      tags:
     *        - FLASK
     *      summary: User authentication
     *      description: Check user credential and generate access token
     *      consumes:
     *        - application/json
     *      produces:
     *        - application/json
     *      parameters:
     *      - in: body
     *        name: body
     *        description: User credential
     *        required: true
     *        schema:
     *          required: true
     *          properties:
     *            email:
     *              type: string
     *              example: ekalosha@gmail.com
     *            password:
     *              type: string
     *              example: '12345678'
     *      responses:
     *        '400':
     *          $ref: '#/definitions/responses/400'
     *        '404':
     *          $ref: '#/definitions/responses/404'
     *        '500':
     *          $ref: '#/definitions/responses/500'
     *        '200':
     *           description: Successful operation
     *           type: object
     *           properties:
     *              token:
     *                type: string
     *                example: eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9....
     *              expired:
     *                $ref: '#/definitions/Date'
     */
    /**
     * @description Initialize data and event handlers
     * @param {Function} callback
     * @override
     */
    authorize ( callback ) {
        // required fields
        let {email, password} = this._request.body;
        // validation {CRFService#form} => eventOID, subjectId, crfVersionOid, items
        let errorMessage = '';
        if (!email) errorMessage += (errorMessage ?',':'')+'[login]';
        if (!password) errorMessage += (errorMessage ?',':'')+'[password]';
        // validation error
        if (errorMessage) {
            errorMessage += ' parameter(s) is required.';
            return callback(new Core.Error.HTTPError(errorMessage, 400));
        }
        // business logic
        let service = new FlaskUserService();
        service
            .authentication(this._request.body)
            .then(success => {
                this.view(Core.View.jsonView(success));
                callback();
            })
            .catch(errorMessage => {
                callback(new Core.Error.HTTPError(errorMessage, 400))
            });
    }

    /**
     * @swagger
     * /auth/logout:
     *    post:
     *      tags:
     *        - FLASK
     *      summary: User logout
     *      description: Destroy session of current Flask user
     *      consumes:
     *        - application/json
     *      produces:
     *        - application/json
     *      parameters:
     *      - in: header
     *        $ref: '#/definitions/schemas/Authentication'
     *      responses:
     *        '400':
     *          $ref: '#/definitions/responses/400'
     *        '404':
     *          $ref: '#/definitions/responses/404'
     *        '500':
     *          $ref: '#/definitions/responses/500'
     *        '200':
     *           description: Successful operation
     */
    /**
     * @description Initialize data and event handlers
     * @param {Function} callback
     * @override
     */
    logout ( callback ) {
        // required fields
        let { token, authorization } = this._request.headers;
        // business logic
        let service = new FlaskUserService();
        service
            .destroySession(token || authorization)
            .then(success => {
                this.view(Core.View.jsonView(success));
                callback();
            })
            .catch(errorMessage => {
                callback(new Core.Error.HTTPError(errorMessage, 400))
            });
    }

     /**
     * @description Load view file
     * @param {Function} callback
     * @override
     */
    preLoad (callback) {
        callback();
    }

}

/**
 * Exporting Controller
 *
 * @type {Function}
 */
module.exports = LoginController;
