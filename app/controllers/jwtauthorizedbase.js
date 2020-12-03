
// Using STRICT mode for ES6 features
"use strict";

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
 *  Base Mixin for private user controllers
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class JWTAuthorizedBase extends Core.Controller {

    /**
     * @description Flask Controller constructor
     *
     * @param {Object} request
     * @param {Object} response
     */
    constructor ( request, response ) {
        // this
        super(request, response);
    }

    /**
     * Pre-initialize data and event handlers
     * Restore user from token, which is mandatory and must be set in one of "Token" or "Authentication" headers
     * Otherwise Controller will thrown "401 User unauthenticated" error.
     * By default authentication is required for any inherited controller, but you can ommit it with one of two ways:
     * 1. Define "public static isSecured ()" method and disable security check for whole controller.
     * 2. In the Action definition "registerAction(actionName, methodName, isSecured = true)" set isSecured parameter to false
     *
     * @param {Function} dataReadyCallback
     * @override
     */
    preInit (dataReadyCallback) {

        // Skip security Check if it is disabled for the action
        let actionDetails = null;
        if (this.actionName && this._allowedActions[this.actionName]) {
            actionDetails = this._allowedActions[this.actionName];

            if (actionDetails.isSecured === false) {
                return dataReadyCallback();
            }
        }

        // Check secured status of the class
        // If controller is not secured - skip it
        const CurrentClass = this.constructor;
        if (!CurrentClass.isSecured()) {
            if (!actionDetails || actionDetails.isSecured !== true) {
                return dataReadyCallback();
            }
        }

        // NOTE try to find a header with token. Both of the Token and Authentication headers valid
        let {token, authorization} = this._request.headers;
        let jwtToken = token;
        if (!jwtToken && authorization) { // Verify Authorization Token
            authorization = String(authorization).trim();
            let authorizationParts = authorization.split(" ");
            if (authorizationParts) {
                if (authorizationParts.length === 1) {
                    jwtToken = authorizationParts[0];
                } else if (authorizationParts.length === 2) {
                    let tokenType = authorizationParts[0].toLowerCase();
                    if (tokenType === "bearer" || tokenType === "jwt") {
                        jwtToken = authorizationParts[1];
                    }
                }
            }
        }

        if (!jwtToken) {
            dataReadyCallback(new Core.Error.HTTPError("Authentication required.", 401));
        } else {
            let service = new FlaskUserService();
            service.restoreUser(jwtToken)
                .then(success => {
                    // NOTE authenticated user stored as "user" within nested controllers
                    this.user = success;
                    dataReadyCallback();
                })
                .catch(error => {
                    dataReadyCallback(new Core.Error.HTTPError(error, 401));
                });
        }
    }

    /**
     * Register Action handler method
     *
     * @param {String} actionName Name of the Action or full path path
     * @param {String} methodName if not set actionName used instead
     * @param {Boolean} [isSecured=null] methodName if not set actionName used instead
     * @return {object}
     */
    registerAction(actionName, methodName, isSecured = null) {
        // Registering action
        super.registerAction(actionName, methodName);

        // Set Secured Settings for
        let $actionName = this.validateActionName(actionName);
        let actionDetails = this._allowedActions[$actionName];
        actionDetails.isSecured = isSecured;

        return actionDetails;
    }

    /**
     * Defines is current controller Secured or not. By default returns "true", which means that Controller must be secured.
     *
     * @returns {boolean}
     */
    static isSecured () {
        return true;
    }

}

/**
 * Exporting Controller
 *
 * @type {Function}
 */
module.exports = JWTAuthorizedBase;
