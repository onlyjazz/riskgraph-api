
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;

/**
 * Importing Application Facade
 *
 * @type {ApplicationFacade|*}
 */
const applicationFacade = ApplicationFacade.instance;

/**
 * Async operations helper
 */
const async = require('async');

/**
 * Requiring core Events module
 */
const events = require('events');

/**
 * Require UUID V1
 *
 * @type {v3}
 */
const uuid = require('uuid/v4');

/**
 * Initializing database factory
 */
const DatabaseFactory = require("../modules/database-factory");

/**
 * Common flask error
 *
 * @type {BaseError}
 */
const FlaskError = require("../error");

/**
 * Standard libraries
 */
const util = require('util');

/**
 *  Simple Database abstraction.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class PGModelBase extends Core.Model.AbstractModel {

    /**
     * DatabaseEnvironment holder constructor
     */
    constructor(environmentId) {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        this.environment = DatabaseFactory.ENVIRONMENT_FLASK;
        if (environmentId) {
            this.environmentId = environmentId;
        }
        this.database = null;

        /**
         * Default table schema
         *
         * @type {{fields: {}, table: null}}
         */
        this.schema = {
            fields: {},
            table: null,
            pk: 'id'
        };

        // Set core logger
        this.logger = applicationFacade.logger;

        this._loggingEnabled = false;
    }

    /**
     * Initialize database to run the queries
     *
     * @param callback
     */
    initDatabase(callback) {
        switch (this.environment) {
            // Initialize IDP Environment Database
            case DatabaseFactory.ENVIRONMENT_IDP:
                applicationFacade.databaseFactory.idp((error, environment) => {
                    if (error) {
                        this.logger.error("Failed to obtain IDP database");

                        return callback(error);
                    }

                    // Done step 1
                    this.database = environment;
                    callback(null, environment);
                });
                break;
            // Initialize Flask Environment Database
            case DatabaseFactory.ENVIRONMENT_FLASK:
                applicationFacade.databaseFactory.flask((error, environment) => {
                    if (error) {
                        this.logger.error("Failed to obtain Flask database");

                        return callback(error);
                    }

                    // Done step 1
                    this.database = environment;
                    callback(null, environment)
                });
                break;
            // Initialize EDC Environment Database
            case DatabaseFactory.ENVIRONMENT_EDC:
            default:
                applicationFacade.databaseFactory.edc(this.environmentId, (error, environment) => {
                    if (error) {
                        this.logger.error("Failed to obtain EDC database");

                        return callback(error);
                    }

                    // Done step 1
                    this.database = environment;
                    callback(null, environment)
                });
                break;
        }
    }

    /**
     * Execute Query and proceed with the results. At the end - free all the resources back
     *
     * @param sqlString
     * @param parameters
     * @param callback
     */
    query(sqlString, parameters, callback) {
        let local = {sqlString, parameters, callback};
        // Run sequence of 1 query and collect result
        this.run((client, sequenceDoneCallback) => {
            client.query(sqlString, parameters, (error, result) => {
                if (error) {
                    this.logger.error('[%s] Error executing query', this.environment, error.stack)

                    this.logger.error('QUERY FAILED: [%s]', local.sqlString);
                    if (callback) {
                        callback(error);
                    }
                    return sequenceDoneCallback(error);
                }

                if (callback) callback(null, result);
                sequenceDoneCallback();
            });
        });
    }

    /**
     * Lock connection by
     *
     * @param callback
     */
    lockConnection(callback) {
        this._connectionLocked = true;

        // Set connection lock and obtain Postgres client before run next portion of queries
        this.run((client, sequenceDoneCallback) => {
            sequenceDoneCallback();
        }, () => {
            this.logger.info("++++ Default Connection obtained and locked.");
            callback();
        });
    }

    /**
     * Unlock connection after come timeout
     */
    autoUnlock() {
        ;
    }

    /**
     * Unlocking connection and release current clients
     */
    unlockConnection() {
        this._connectionLocked = false;

        // Releasing database connection to the pool
        if (this.release != null) {
            try {
                this.client.release();
            } catch (exception) {
                this.logger.info(exception.message);
            }

            this.client = null;
            this.release();
            this.release = null;
        }
    }

    /**
     * Execute Job sequence and proceed with the results. At the end - free all the resources back
     *
     * @param jobSequense
     * @param callback
     */
    run(jobSequence, callback) {
        // Store locals data for the call
        let locals = {};
        async.series([
            asyncCallback => {
                this.initDatabase((error, environment) => {
                    if (error) {
                        return asyncCallback(error);
                    }

                    // Done step 1
                    if (environment) this.database = environment;
                    asyncCallback();
                });
            },
            asyncCallback => {

                if (this._connectionLocked && this.client) {
                    locals.client = this.client;
                    locals.release = this.release;

                    if (this._loggingEnabled) {
                        this.logger.info('++++ Connection lock set. Continue with existing environment.');
                    }

                    return asyncCallback();
                }

                // Release client for locked connection
                if (!this._connectionLocked && this.client) {
                    if (this._loggingEnabled) this.logger.info("++++ Releasing current client if it is defined: ", this.connectionId);
                    try {
                        this.client.release();
                    } catch (exception) {
                        if (this._loggingEnabled) this.logger.info("++++ Connection already released: ", this.connectionId);
                    }
                }

                if (!this._connectionLocked || !this.client) {
                    this.database.pool.connect((error, client, release) => {
                        // Error happened resuming operations
                        if (error) {
                            this.logger.error('Failed to obtain connection from the pool', error);
                            return asyncCallback(error);
                        }

                        if (client == null) {
                            this.logger.error("Postgres Client is undefined.");
                            return asyncCallback(new Error("Postgres Client is undefined."));
                        }

                        locals.client = client;
                        locals.release = release;
                        locals.connectionId = (this.schema && this.schema.table ? "[" + this.schema.table + "]-" : "") + uuid();


                        this.client = client;
                        this.release = release;
                        this.connectionId = locals.connectionId;

                        if (this._loggingEnabled) this.logger.info("++++ Obtained PG client from the pool: ", locals.connectionId);

                        // Done step 2
                        asyncCallback();
                    });
                } else {
                    asyncCallback()
                }
            },
            asyncCallback => {
                jobSequence(locals.client, (error) => {
                    asyncCallback(error);
                });
            }
        ], (error) => {

            if (!this._connectionLocked && locals.client) {
                // Releasing database connection
                if (this._loggingEnabled) this.logger.info("++++ Releasing PG client after non blocking query: ", locals.connectionId);

                try {
                    locals.client.release();
                } catch (exception) {
                    if (this._loggingEnabled) {
                        this.logger.info("++++ Connection already released by other thread: ", this.connectionId);
                    }
                }

                // Set connection to null
                locals.client = null;
                locals.release = null;
                this.client = null;
                this.release = null;
            }

            // Check error
            if (error) {
                // Something went wrong. Action is failed.
                if (callback) {
                    callback(error);
                }
            } else {
                // OK
                if (callback) {
                    callback(null, this);
                }
            }
        });
    }

    /**
     * Runs the query and get single result
     *
     * @param query
     * @param params
     * @param callback
     */
    getSingleResult(query, params, callback) {
        this.query(query, params, (error, result) => {
            if (error) {
                console.error('Error executing query', error.stack)

                return callback ? callback(error) : null;
            }

            /*
            if (!result.rows || !result.rows.length) {
                return callback(new FlaskError("getSingleResult: Item not found.", 404))
            }
            */

            var singleResult = result.rows && result.rows.length ? result.rows[0] : null;
            if (callback) callback(null, singleResult);
        });
    }

    /**
     * Runs the query and get list
     *
     * @param query
     * @param params
     * @param callback
     */
    getList(query, params, callback) {
        this.query(query, params, (error, result) => {
            if (error) {
                console.error('Error executing query', error.stack)

                return callback(error);
            }

            /*
            if (!result.rows || !result.rows.length) {
                return callback(new FlaskError("getSingleResult: Item not found.", 404))
            }
            */

            let list = result.rows ? result.rows : null;
            callback(null, list);
        });
    }


    /**
     * Runs the query and get single-field result
     *
     * @param query
     * @param params
     * @param callback
     */
    getScalar(query, params, callback) {
        this.query(query, params, (error, result) => {
            if (error) {
                console.error('Error executing query', error.stack)

                return callback(error);
            }

            if (!result.rows || !result.rows.length) {
                return callback()
            }

            callback(null, result.rows[0][result.fields[0].name]);
        });
    }

    /**
     * Build Where string to safe use in the queries
     *
     * @param itemsMap
     * @returns {{}}
     */
    static buildWhereParams(itemsMap, startIndex) {
        let result = {};
        let fieldsArray = [];
        let valuesArray = [];
        let index = startIndex ? startIndex : 0;
        for (let field in itemsMap) {
            fieldsArray.push(field + "=$" + (++index));
            valuesArray.push(itemsMap[field]);
        }

        result.where = fieldsArray.join(" AND ");
        result.values = valuesArray;

        return result;
    }

    /**
     * Helper for data insert
     *
     * @param itemsMap
     * @param callback
     */
    insert(itemsMap, callback) {
        this._insert(this.schema.table, itemsMap, callback);
    }

    /**
     * Helper for data insert
     *
     * @param table
     * @param itemsMap
     * @param callback
     */
    _insert(table, itemsMap, callback) {
        let fields;
        let fieldsArray = [];
        let valuesArray = [];
        let values$Array = [];
        let index = 0;
        for (let field in itemsMap) {
            fieldsArray.push(field);
            valuesArray.push(itemsMap[field]);
            values$Array.push("$" + (++index));
        }
        fields = fieldsArray.join(", ");
        let sqlQuery = util.format("INSERT INTO %s (%s) VALUES(%s) RETURNING %s;", table, fields, values$Array.join(", "), (this.schema.pk ? this.schema.pk : "id"));
        this.query(sqlQuery, valuesArray, (error, result) => {
            if (error) {
                console.error('Error inserting data', error.stack)

                return callback(error);
            }

            callback(null, result.rows[0][result.fields[0].name]);
        });
    }

    /**
     * Helper for data update
     *
     * @param itemsMap
     * @param callback
     */
    update(itemsMap, where, parameters, callback) {
        if (typeof parameters == "function") {
            this._update(this.schema.table, itemsMap, (this.schema.pk ? this.schema.pk : "id") + "=$1", where, parameters);
        } else {
            this._update(this.schema.table, itemsMap, where, parameters, callback);
        }
    }

    /**
     * Helper for data update
     *
     * @param table
     * @param itemsMap
     * @param callback
     */
    _update(table, itemsMap, where, parameters, callback) {
        let fields;
        let fieldsArray = [];
        let valuesArray = parameters ? parameters.slice() : [];
        let index = parameters ? parameters.length : 0;
        for (let field in itemsMap) {
            fieldsArray.push(field + "=$" + (++index));
            valuesArray.push(itemsMap[field]);
        }
        fields = fieldsArray.join(", ");
        let sqlQuery = util.format("UPDATE %s SET %s WHERE %s", table, fields, where);
        this.query(sqlQuery, valuesArray, (error, result) => {
            if (error) {
                console.error('Error updating data', error.stack)

                return callback(error);
            }

            callback(null, result.rowCount);
        });
    }

    /**
     * Runs the query and get single result. Return Error if no result found.
     *
     * @param query
     * @param params
     * @param callback
     */
    getExistingSingleResult(query, params, callback) {
        this.query(query, params, (error, result) => {
            if (error) {
                console.error('Error executing query', error.stack)

                return callback(error);
            }

            if (!result.rows || !result.rows.length) {
                return callback(new FlaskError("getSingleResult: Item not found.", 404))
            }

            callback(null, result.rows[0]);
        });
    }

    /**
     * Find all items which are valid for the filters
     *
     * @param sqlQuery
     * @param params
     * @param pagination
     * @param callback
     */
    getListPaged(sqlQuery, params, pagination, callback) {
        // sqlQuery = util.format("SELECT * FROM %s WHERE %s", this.schema.table, where);
        let size = (pagination && pagination.size > 0) ? Number(pagination.size) : 20;
        let offset = (pagination && pagination.page >= 0) ? Number(pagination.page) * size : 0;
        let sort = (pagination && pagination.sort) ? pagination.sort : '';

        if (!params) params = [];
        let paramsNum = params && params.length ? params.length : 0;
        if (sort) {
            let _sort = sort.split(',');
            let parameter = _sort[0] || '';
            let direction = (_sort[1] && _sort[1].search(/desc/gmi) != -1) ? 'DESC' : 'ASC';
            sqlQuery += ` ORDER BY ${parameter} ${direction} `;
        }

        if (size) {
            sqlQuery += ' LIMIT $' + (++paramsNum);
            params[paramsNum - 1] = size;
        }

        if (offset) {
            sqlQuery += ' OFFSET $' + (++paramsNum);
            params[paramsNum - 1] = offset;
        }

        this.query(sqlQuery, params, (error, result) => {
            if (error) {
                console.error('Error filtering data', error.stack)

                return callback(error);
            }

            callback(null, result.rows ? result.rows : []);
        });
    }

    getPaginatedList(sqlQuery, params, pagination) {
        return new Promise((resolve, reject) => {
            let local = {
                items: [],
                pagination: {
                    page: pagination && pagination.page ? pagination.page : 0,
                    size: pagination && pagination.size ? pagination.size : 20,
                    total: 0
                }
            };
            async.series([
                done => { // get count
                    this.query(sqlQuery, params, (error, results) => {
                        if (error) return reject('[Paginated List] ' + error || ' It was not possible to get count of entities.');
                        local.pagination.total = Number(results.rowCount);
                        done();
                    });
                },
                done => { // get list
                    this.getListPaged(sqlQuery, params, pagination, (error, results) => {
                        if (error) return reject('[Paginated List] ' + error || 'It was not possible to get list of entities.');
                        local.items = results;
                        done();
                    });
                },
            ], error => {
                if (error) return reject(error);
                resolve(local);
            });
        });

    }



    /**
     * Find all items which are valid for the filters
     *
     * @param where
     * @param params
     * @param callback
     */
    find(where, params, callback) {
        let sqlQuery = util.format("SELECT * FROM %s WHERE %s", this.schema.table, where);
        this.query(sqlQuery, params, (error, result) => {
            if (error) {
                console.error('Error filtering data', error.stack);

                return callback(error);
            }

            callback(null, result.rows ? result.rows : []);
        });
    }

    /**
     * Returns one item for specified criteria
     *
     * @override
     */
    findOne (criteria, callback, populate) {
        let queryDetails = PGModelBase.buildWhereParams(criteria);
        let sqlQuery = util.format("SELECT * FROM %s WHERE %s", this.schema.table, queryDetails.where);
        this.getSingleResult(sqlQuery, queryDetails.values, (error, result) => {
            if (error) {
                console.error('Database Error when trying to find item. ', error.stack);

                return callback(error);
            }

            callback(null, result);
        });
    }

    /**
     * Returns one item for specified criteria
     *
     * @override
     */
    delete (criteria, callback) {
        let queryDetails = PGModelBase.buildWhereParams(criteria);
        let sqlQuery = util.format("DELETE FROM %s WHERE %s", this.schema.table, queryDetails.where);
        this.query(sqlQuery, queryDetails.values, (error, result) => {
            if (error) {
                console.error('Database Error when trying to find item. ', error.stack);

                return callback(error);
            }

            callback(null, result);
        });
    }


    /**
     * Returns one document for specified ID
     *
     * @override
     */
    findById (id, callback, populate) {
        let sqlQuery = util.format("SELECT * FROM %s WHERE %s", this.schema.table, this.schema.pk + "=$1");
        this.getSingleResult(sqlQuery, [id], (error, result) => {
            if (error) {
                console.error('Database Error when trying to find item by ID: ', error.stack)

                return callback(error);
            }

            callback(null, result);
        });
    }


}

// Export Postgre Client Abstraction
module.exports = PGModelBase;
