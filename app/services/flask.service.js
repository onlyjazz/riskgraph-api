/**
* Load Core MVC Library
*/
const Core = require('dft-mvc-core');

/**
 * Abstract BaseService
 *
 * @type {BaseService}
 */
const BaseService = require('./base.service');

/**
 *  Base service for Flask business logic with various EDC Database access.
 *
 *  @author Eugene A. Kalosha <ekalosha@dfusiontech.com>
 */
class FlaskService extends BaseService {

    /**
     * @constructor
     */
     constructor() {
        // this
        super();
    }

    /**
     * No initialization
     * @ignore
     */
    initialize () {
        ;
    }
}

/**
 * Export base FlaskService
 */
module.exports = FlaskService;
