
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;

/**
 * Project Utilities
 */
const Utils = require('../../lib/utils');

/**
 * Including base PG model
 *
 * @type {PGModelBase}
 */
const FlaskModelBase = require("../flaskmodelbase");

/**
 * Date operations helper
 */
const moment = require('moment');

/**
 *  Flask user model
 *
 *  @class
 */
class UserJWTTokenModel extends FlaskModelBase {
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
        this.schema = {
            fields: {},
            table: "user_jwt_tokens",
            pk: "id"
        };
    }

    /**
     * @typedef {object}    UserJWTToken
     * @property {number}   id
     * @property {number}   user_id
     * @property {number}   role_id
     * @property {number}   study_id
     * @property {number}   site_id
     * @property {number}   study_site_id
     * @property {string}   token_code
     * @property {string}   token
     * @property {string}   role
     * @property {string}   pg_role
     * @property {date}     created
     * @property {date}     expired
     */

    /**
     * @description Declares token callback type
     * @callback accessTokenCallback
     * @param {object} error
     * @param {UserJWTToken} access_token
     */

    /**
     * @description generate user token by his Credential
     * @param {Object} user -
     * @param {accessTokenCallback} accessTokenCallback
     * @public
     */
    createAccessToken (user, accessTokenCallback) {
        // NOTE if session of this user already exist
        /*
        this.findTokenByUser(user)
            .then(success => {
                // console.log('findTokenByUser success');
                accessTokenCallback(null, success);
            })
            .catch(error => {
                // console.log('findTokenByUser error');
                this.generateNewToken(user)
                    .then(success => {
                        // console.log('generateNewToken success');
                        accessTokenCallback(null, success);
                    })
                    .catch(error => {
                        // console.log('generateNewToken error');
                        accessTokenCallback(error, null);
                    });
            });
        */

        // Get token from Database is against oAuth/JWT protocols, we must generate new Token for each user request.
        this.generateNewToken(user)
            .then(success => {
                // console.log('generateNewToken success');
                accessTokenCallback(null, success);
            })
            .catch(error => {
                // console.log('generateNewToken error');
                accessTokenCallback(error, null);
            });
    }

    /**
     * @description generate new JWT token
     * @param {Object} user
     * @returns {Promise}
     * @private
     */
    findTokenByUser (user) {
        return new Promise((resolve, reject) => {
            let tokenQuery = 'SELECT token_code,token,expired FROM user_jwt_tokens WHERE user_id = $1';
            this.getSingleResult(tokenQuery, [user.id], (error, result) => {
                // NOTE session already exist
                if (!error && result) {
                    let token = result;
                    if (moment(new Date()).isBefore(token.expired)) {
                        resolve(token);
                    } else {
                        reject({});
                    }
                } else {
                    reject({});
                }
            });
        });
    }

    /**
     * @description generate new JWT token
     * @param {Object} user
     * @returns {Promise}
     * @private
     */
    generateNewToken (user) {
        return new Promise((resolve, reject) => {
            let date = new Date();
            date.setHours(date.getHours() + 3);
            let code = Utils.randomString(32);
            ApplicationFacade.instance.jwt.sign({sub: code, exp: date.valueOf()}, (error, jwtToken) => {
                console.log("generateNewToken error" +error);
                console.log("generateNewToken jwtToken" +jwtToken);
                if (!error && jwtToken) {
                    let accesToken = {
                        expired: date,
                        token_code: code,
                        token: jwtToken,
                        user_id: user.id,
                        role_id: user.role_id,
                        pg_role: user.pg_role,
                    };
                    this.insert(accesToken, (error, itemId) => {
                        if (!error && itemId) {
                            resolve(accesToken);
                        } else {
                            reject({});
                        }
                    });
                } else {
                    reject({});
                }
            });
        });
    }

    /**
     * @description Declares verification access token callback type
     * @callback restoreCallback
     * @param {object} error
     * @param {object} data
     */


    /**
     * @description generate user token by his Credential
     * @param {string} jwtToken -
     * @param {restoreCallback} restoreCallback
     * @public
     */
    restoreData (jwtToken, restoreCallback) {
        ApplicationFacade.instance.jwt.verify(jwtToken, (error, tokenData) => {
            if (!error && tokenData) {
                let tokenQuery = 'SELECT id,expired,user_id,pg_role FROM user_jwt_tokens WHERE token_code = $1';
                this.getSingleResult(tokenQuery, [tokenData.sub], (error, result) => {
                    if (error|| !result) return restoreCallback('[JWT Token] Failed to restore token data.');
                    restoreCallback(null, result);
                });
            } else {
                restoreCallback(error, null);
            }
        });
    }

    /**
     * @description destroy session token of user
     * @param {String} jwtToken -
     * @public
     */
    destroyTokenRecord ( jwtToken ) {
        return new Promise((resolve, reject) => {
            let sqlQuery = 'DELETE FROM user_jwt_tokens WHERE token = $1';
            this.query(sqlQuery, [jwtToken], (error, result) => {
                if ( error ) return reject(error);
                return resolve(result);
            });
        });
    }

}

// Export Model
module.exports = UserJWTTokenModel;
