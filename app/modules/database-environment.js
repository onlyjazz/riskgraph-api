
"use strict";

/**
 * Initialize Postgres Library
 */
const {Pool, Client} = require('pg');

/**
 * Requiring core Events module
 */
const events = require('events');

/**
 * Requiring Lodash helpers module
 */
const _ = require('lodash');


/**
 *  Simple Database abstraction.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class DatabaseEnvironment extends events.EventEmitter {

    /**
     * DatabaseEnvironment holder constructor
     */
    constructor(config) {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        if (config != null) {
            this.config = config;
        }
    }

    set config(value) {
        this._config = value;
    }

    get config() {
        return this._config
    }

    get pool() {
        return this._pool;
    }

    /**
     * Initialize Database Pool
     *
     * @param options
     * @param callback
     */
    initPool (options, callback) {
        this._pool = this.createPool(options, callback);
    }

    /**
     * Create pool and test simple connection
     *
     * @param options
     * @param callback
     * @returns {PG.Pool}
     */
    createPool (options, callback) {

        var defaultOptions = {
            connectionString: null,
            max: 20, // Set max 20 clients for connection pool of authorization client
            idleTimeoutMillis: 120000,
            connectionTimeoutMillis: 30000,
        };
        var connectionOptions = _.merge(defaultOptions, options);

        var result = new Pool(connectionOptions);

        // The pool with emit an error on behalf of any idle clients
        // it contains if a backend error or network partition happens
        result.on('error', (error, client) => {
            // this.connected = false;
            console.error('Unexpected error on idle client', error)
        });

        // Trying simple connection to Postgres
        result.connect((error, client, release) => {
            // Error happened resuming operations
            if (error) {
                console.error('Failed to obtain connection from the pool', error);
                return callback(error);
            }

            if (client == null) {
                console.error("Postgres Client is undefined.");
                return callback(new Error("Postgres Client is undefined."));
            }

            client.query('SELECT $1::text as name', ['CONNECT SUCCESS'], (error, result) => {
                if (error) {
                    if (callback != null) {
                        callback(error);
                    }
                    return console.error('Error executing query', error.stack)
                }

                console.log("#### PostgreSQL: " + result.rows[0].name);

                // Releasing connection to the pool
                release();

                callback(null, result);
            })
        });

        return result;
    }
}

// Export DatabaseEnvironment
module.exports = DatabaseEnvironment;
