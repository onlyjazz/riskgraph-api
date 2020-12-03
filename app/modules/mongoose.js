
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationEvent = Core.ApplicationEvent;
const applicationFacade = Core.ApplicationFacade.instance;

/**
 * Outsource library for mongodb
 */
const mongoose = require('mongoose');


/**
 *  Simple Database abstraction.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class Mongoose {
    /**
     * Database holder constructor
     */
    constructor () {

        this.mongoose = mongoose;

        mongoose.Promise = Promise;
    }

    init () {
        // mongoose configuration
        let { flaskMongo: { connectionString, connectionOptions } } = applicationFacade.config.items.database;
        // alias
        let logger = Core.ApplicationFacade.instance.logger;
        // record connection
        let connection = this.connection = mongoose.createConnection(connectionString, connectionOptions);

        // Handling connect event
        connection.on('connected', () => {
            logger.info('#### Successfully connected to MongoDB server');
            applicationFacade.emit(ApplicationEvent.MONGO_CONNECTED);
            applicationFacade.emit(ApplicationEvent.DATABASE_CONNECTED);
        });

        // Handling error event
        connection.on('error', () => {
            logger.error('#### Failed to connect to MongoDB server');
        });

        // Handling disconnect event
        connection.on('disconnected', () => {
            logger.warn('#### Warning application disconnected from the MongoDB server');
        });

        // If the Node process ends, close the Mongoose connection
        process.on('SIGINT', () => {
            connection.close(() => {
                logger.error('#### [SIGINT] Mongoose default connection disconnected through application termination');
                process.exit(0);
            });
        });
    }

}

/**
 * Export Mongoose Factory
 */
module.exports = Mongoose;
