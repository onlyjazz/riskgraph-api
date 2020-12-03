/**
 *  Native NodeJS module for paths processing
 */
const path = require('path');

/**
 *  Enum for possible statuses of the app and app parts
 */
const statusEnum = require('./statusenum');

/**
 * Logic for checking of the health of the application and application parts
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */

class Actuator {

    /**
     * Actuator constructor
     *
     * @param application - instance of the app
     * @param server - instance of the http server
     */
    constructor(application, server) {
        if(!application) throw new Error('[Actuator INIT] application is required...');
        if(!server) throw new Error('[Actuator INIT] server is required...');
        this.application = application;
        this.server = server;

        this.initialized = false;
        this.configured = false;

        this.defaultEndpoint = '/health';
        this.defaultInspectorsList = ['mongo', 'postgres'];

        this.inspectors = [];

        this.result = {
            status: statusEnum.UP,
            environment: process.env.NODE_ENV,
            details: {}
        }
    }

    /**
     * check the health of the all parts of the app using inspectors
     *
     * @return {Promise}
     */
    checkHealth() {
        return new Promise((resolve, reject) => {

            let queue = this.inspectors.map(async (inspector, index) => {
                if(inspector.checkHealth && inspector.initialized) {
                    try {
                        let result = await inspector.checkHealth();
                        if(result && result.inspector) {
                            this.result.details[result.inspector] = result.data;
                        }
                    } catch(error) {
                        if(error) return reject(error);
                    }

                }
            })

            Promise.all(queue)
                .then(success => {
                    resolve(JSON.stringify(this.result, null, 4));
                })
                .catch(error => {
                    console.log('promiseall', error);
                    reject(error);
                });
        })
    }

    /**
     * initialization of the all modules (inspectors)
     *
     * @return {Promise}
     */
    initModules() {
        return new Promise((resolve, reject) => {

        let queue = this.inspectors.map(async inspector => {
            if(inspector.initialize && !inspector.initialized) await inspector.initialize(this.application);
        })

        Promise.all(queue)
            .then(success => {
                resolve();
            })
            .catch(error => {
                reject(error);
            });
        })
    }


    /**
     * configuration of the Actuator instance
     * @param {String} endpoint
     * @param {Array} inspectors - array of inspectors to check health of app parts (item: string | class)
     * @return {Promise}
     */
    config(endpoint, inspectors) {
        return new Promise((resolve, reject) => {
            if (!endpoint) endpoint = this.defaultEndpoint;
            this.endpoint = endpoint;

            if (!inspectors) inspectors = this.defaultInspectorsList;

            let queue = inspectors.map(async inspector => {
                let instance;
                if (typeof inspector === 'string') {
                    try {
                        instance = require(path.join(__dirname, '/modules/', inspector)).instance();
                        this.inspectors.push(instance);
                    } catch (error) {
                        console.error(`## [Actuator INIT] ${error}`);
                    }
                } else if (inspector instanceof Function) {
                    try {
                        instance = new inspector();
                        this.inspectors.push(instance);
                    } catch (error) {
                        console.error(`## [Actuator INIT] ${error}`);
                    }
                }
            })

            Promise.all(queue)
                .then(success => {
                    this.configured = true;
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
        })
    }

    /**
     * initialization of the Actuator instance
     *
     */
    initialize() {
        if(!this.configured) throw Error('## [Actuator INIT] The actuator must be configured before initialization. Use the actuator.config([endpoint], [inspectors]');
        let self = this;
        console.log('## [Actuator INIT] Initialization...');
        this.initModules()
            .then(success => {
                this.server.use(this.endpoint, function(req, res, next) {
                    res.set({"Content-Type": "application/json"})
                    self.checkHealth()
                        .then(success => {
                            res.status(200).send(success);
                        })
                        .catch(error => {
                            res.status(500).send({error: error.stack ? error.stack : error});
                        })

                });
                this.initialized = true;
                console.log('## [Actuator INIT] Was initialized successfully.');
            })
            .catch(error => {
                console.error(`## [Actuator INIT] ${error}`);
            });
    }

}

/**
 * exports Actuator
 */
module.exports = Actuator;
