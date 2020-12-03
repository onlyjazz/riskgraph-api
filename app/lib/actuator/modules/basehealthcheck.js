/**
 * Basehealthcheck
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class Basehealthcheck {

    /**
     * Basehealthcheck constructor
     *
     */
    constructor() {
        this.initialized = false;
        this.result = {
            inspector: '',
            data: {
                status: '',
                details: {}
            }
        }
    }

    async checkHealth() {
        throw new Error("[Basehealthcheck] Module checkHealth is not redefined!");
    }

    /**
     * module initialization
     *
     * @return {Promise}
     */
    async initialize(application) {
        let moduleName = this.result && this.result.inspector ? this.result.inspector : 'Module';
        console.log(`## [Actuator ${moduleName} INIT] Initialization...`);
        this.application = application;
        this.initialized = true;
        console.log(`## [Actuator ${moduleName} INIT] Was initialized successfully.`);
    }

    static instance() {
        return new this();
    }
}

/**
 * exports Basehealthcheck
 */
module.exports = Basehealthcheck;
