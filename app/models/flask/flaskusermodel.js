
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
 *  Flask user model
 *
 *  @class
 */
class FlaskUserModel extends FlaskModelBase {
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
            table: "users",
            pk: "id"
        };
    }

    /**
     * @typedef {object}    FlaskUserModel
     * @property {number}   id
     * @property {string}   email
     * @property {string}   password
     * @property {string}   first_name
     * @property {string}   last_name
     * @property {string}   edc_username
     * @property {string}   pg_role
     * @property {number}   role_id
     * @property {number}   edc_role_id
     * @property {number}   owner_user_id
     * @property {boolean}  account_active
     * @property {date}     last_login
     * @property {date}     created
     * @property {date}     modified
     */

    /**
     * @description Declares user callback type
     * @callback userCallback
     * @param {object} error
     * @param {object} user
     */


    /**
     * @description get user by id
     * @param {String} login - email or login users
     * @param {userCallback} userCallback
     * @public
     */
    getUserByLogin ( login, userCallback ) {
        // TODO should add "login" or "username" column for third party authentication as using SAML 2.0
        let userQuery = 'SELECT * FROM users WHERE email = $1 OR edc_username = $2';
        this.getSingleResult(userQuery, [login, login], userCallback);
    }


    /**
     * @description get user by id
     * @param {number} id -
     * @param {userCallback} userCallback
     * @public
     */
    getUserById (id, userCallback) {
        let userQuery = 'SELECT * FROM users WHERE id = $1';
        this.query(userQuery, [id], (error, result) => {
            if (!error && result && result.rows && result.rows[0]) {
                return userCallback(null, result.rows[0]);
            }
            userCallback(error||'Could not find user', null);
        });
    }

    /**
     * get user role list
     *
     * @param callback
     */
    getUserRoleList(callback) {
        let sqlQuery = "SELECT * FROM roles WHERE 1=1";
        this.query(sqlQuery, [], (error, result) => {
            callback(error, (result && result.rows ? result.rows : []));
        });
    }

}

// Export Model
module.exports = FlaskUserModel;
