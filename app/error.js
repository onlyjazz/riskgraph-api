
// Using STRICT mode for ES6 features
"use strict";

/**
 *  Base system error
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class BaseError extends Error {

    /**
     * Error constructor
     */
    constructor (message, code) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(message, code);

        this._name = 'Error.Base';

        // Set error ID if defined
        if (this.code == null && code) {
            this.code = code;
        }
    }

    /**
     * Returns name of error type
     */
    get name () {
        return this._name;
    }

    /**
     * Rewrite basic error string representation
     *
     * @returns {string}
     * @override
     */
    toString () {
        var result = 'ERROR[' + this.name + '] ' + this.message;

        return result;
    }
}

/**
 * Exporting Module
 */
module.exports = BaseError;
