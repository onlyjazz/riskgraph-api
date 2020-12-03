
/**
 * Including base FLASK model
 *
 * @type {PGModelBase}
 */
const FlaskModelBase = require("../flaskmodelbase");

/**
 * Async operations helper
 */
// const async = require('async');

/**
 * Date operations helper
 */
// const moment = require('moment');

/**
 *  Implement FLASK table "user_customers".
 *
 *  @author Eugene A. Kalosha <ekalosha@dfusiontech.com>
 */
class UserCustomersModel extends FlaskModelBase {

    /**
     * StudyModel holder constructor
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
            table: "user_customers",
            pk: "id"
        };
    }

    /**
     * @typedef {object} UserCustomer
     * @property {Number} id
     * @property {Number} user_id
     * @property {Number} customer_id
     * @property {Date} created
     * @property {Date} updated
     */

    /**
     * Declares UserCustomer callback type
     *
     * @callback successCallback
     * @param {object} error
     * @param {UserCustomer} data
     */

    /**
     * Get user customer by user id
     *
     * @param {number} user_id
     * @param {successCallback} callback
     */
    customerByUserId ( user_id, callback ) {
        let sqlQuery = 'SELECT * FROM user_customers WHERE user_id = $1';
        this.getSingleResult(sqlQuery, [user_id], callback);
    }

    /**
     * Get record by user_id and customer_id
     *
     * @param {number} user_id
     * @param {number} customer_id
     * @param {successCallback} callback
     */
    getRecordByUserIdCustomerId  ( user_id, customer_id, callback ) {
        let sqlQuery = 'SELECT * FROM user_customers WHERE user_id = $1 and customer_id = $2';
        this.getSingleResult(sqlQuery, [user_id, customer_id], callback);
    }

}

// Export UserCustomersModel
module.exports = UserCustomersModel;
