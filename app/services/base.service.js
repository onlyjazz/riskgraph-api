
/**
 * Load Core MVC Library
 */
const Core = require('dft-mvc-core');

/**
 * BaseService of application.
 *
 * NOTE Services expect correct data. Plase make sure the controller do all validation things.
 * @classdesc Service.create( ... )
 * @abstract
 */
class BaseService {

    /**
     * @constructor
     */
    constructor () {
        // application config
        this.CONFIG = Core.ApplicationFacade.instance.config;

        // logger
        this.logger = Core.ApplicationFacade.instance.logger;
    }

    /**
     * Dummy. Shuold be defined.
     * @abstract
     * @public
     */
    initialize () {
        throw new Error(`
            Please define own "initialize" method for "${this.constructor.name}"
        `);
    }

    /**
     * Service creation
     * @public
     */
    static create (a, r, g, u, m, e, n, t, s) {
        let Service = this;
        let instance = new Service(a, r, g, u, m, e, n, t, s);
        instance.initialize();
        return instance;
    }

}

/**
 * exports BaseService
 */
module.exports = BaseService;
