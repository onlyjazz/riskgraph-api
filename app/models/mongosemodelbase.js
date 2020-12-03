
/**
 * native Node.js modules
 */
const assert = require('assert');

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const AbstractModel = Core.Model.AbstractModel;
const applicationFacade = Core.ApplicationFacade.instance;

/**
 * outsource
 * @ignore
 */
const is = require('s-is');

/**
 * Requiring Async library
 *
 * @type {async|exports|module.exports}
 */
const async = require('async');

/**
 * Storage for all Mongoose models within the application
 *
 * @type {Array}
 */
let listOfModel = [];

/**
 *  Abstract model. Define main collection interface.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 *  @abstract
 */
class MongooseModel extends AbstractModel {

    /**
     * MongooseModel constructor
     */
    constructor () {
        // this
        super();

        /**
         * Define mongoose types
         *
         */
        this.Types = this.mongoose.Schema.Types;

        /**
         * Default table schema
         * @see {@link: http://mongoosejs.com/docs/guide.html | Mongoose Schemas} for properties of "fields" object
         * @see {@link: http://mongoosejs.com/docs/schematypes.html | Schemas Types} for properties of "fields" object
         * @type { {fields: {}, table: null, pk: 'id'} }
         */
        this.schema = {
            fields: {},
            table: null,
            pk: "_id",

        };

        /**
         * Initialization of mongoose scheme should be called from children after overriding schema
         *
         */
        // this.init();
    }

    /**
     * Add model to list of Mongoose models which need to initialize at the run of application
     *
     *
     * @param {MongooseModel} Model
     */
    static registerModel ( Model ) {
        if ( !is.class(Model) ) {
            return applicationFacade.logger.error('[MongooseModel] Model should be a Class');
        }
        let instance = new Model();
        if ( !(instance instanceof MongooseModel) ) {
            return applicationFacade.logger.error(`[MongooseModel: ${Model.name}] Model should inherit from MongooseModel`);
        }
        listOfModel.push(Model);
    }

    /**
     * initialize all Mongoose models Schema at the application run
     *
     */
    static initialize () {
        for ( let Model of listOfModel ) {
            let instance = new Model();
            instance.init();
            applicationFacade.logger.log(`[Mongoose Schema: ${Model.name}] Was initialized successfully.`);
        }
    }

    /**
     * Get Mongoose model for current collection
     *
     * @returns {Object}
     */
    get mongooseSchema () {
        return this._mongooseSchema;
        // return applicationFacade.mongoose.connection.model(this.schema.table).schema;
    }

    /**
     * Get Mongoose model for current collection
     *
     * @returns {Object}
     * @override
     */
    get mongooseModel () {
        return this.mongooseConnection.model(this.schema.table);
    }

    /**
     * Get Mongoose connection
     *
     * @returns {Object}
     * @override
     */
    get mongooseConnection () {
        return applicationFacade.mongoose.connection;
    }

    /**
     * Get Mongoose library from module mongoose
     *
     * @returns {Object}
     * @override
     */
    get mongoose () {
        return applicationFacade.mongoose.mongoose;
    }

    /**
     * Initialize model
     *
     * @override
     */
    init () {
        // NOTE mongoose model can has only one initialization
        // for his model we should record initialization state
        if ( !this.constructor.initialized ) {
            this.createSchema(this.schema.fields, this.schema.table);
            this.constructor.initialized = true;
        }
    }

    /**
     * Wrapper for model hook
     *
     * @param {String} method - name of method schema to call
     * @param {Object} document - mongoose document
     * @private
     */
    hookWrapper ( method, document ) {
        return new Promise((resolve, reject) => {
            if ( is('function', this.schema[method]) ) {
                this.schema[method].call(this, document, (error, result) => {
                    if ( error ) return reject(error);
                    resolve(result);
                });
            } else resolve({});
        });
    }

    /**
     * Simple schema registration
     *
     */
    createSchema () {

        /**
         * Valid mongoose schema
         */
        assert.ok(
            is.object(this.schema.fields),
            `[this.schema.fields] Should contain table definition, but contain "${this.schema.fields}"`
        );

        /**
         * Mongoose collection name
         */
        assert.ok(
            is.string(this.schema.table),
            `[this.schema.table] Should contain table name, but contain "${this.schema.table}"`
        );

        try {
            /**
             * Creating Schema within mongoose
             *
             */
            let mongooseSchema = this._mongooseSchema = this.mongoose.Schema(this.schema.fields);

            // Define toJSON transformation
            mongooseSchema.options.toJSON = {
                transform: ( document, result/*, options*/) => {
                    result.id = result._id;
                    delete result._id;
                    delete result.__v;
                    return result;
                }
            };
            // NOTE mongoose on "pre" return the document as "this" and callback as first argument
            let self = this;
            // declare mongoose hooks
            // NOTE setup ability to change hooks after initialization of real mongoose models
            // INIT
            mongooseSchema.pre('init', function ( next ) {
                let document = this; // the same logic behavior as "post"
                self.hookWrapper('preInit', document).then(next.bind(null, null)).catch(next);
            });
            mongooseSchema.post('init', this.hookWrapper.bind(this, 'postInit'));
            // VALIDATE
            mongooseSchema.pre('validate', function ( next ) {
                let document = this; // the same logic behavior as "post"
                self.hookWrapper('preValidate', document).then(next.bind(null, null)).catch(next);
            });
            mongooseSchema.post('validate', this.hookWrapper.bind(this, 'postValidate'));
            // SAVE
            mongooseSchema.pre('save', function ( next ) {
                let document = this; // the same logic behavior as "post"
                self.hookWrapper('preSave', document).then(next.bind(null, null)).catch(next);
            });
            mongooseSchema.post('save', this.hookWrapper.bind(this, 'postSave'));
            // REMOVE
            mongooseSchema.pre('remove', function ( next ) {
                let document = this; // the same logic behavior as "post"
                self.hookWrapper('preRemove', document).then(next.bind(null, null)).catch(next);
            });
            mongooseSchema.post('remove', this.hookWrapper.bind(this, 'postRemove'));
            // NOTE logic about "isNew" for "post" hooks
            mongooseSchema.pre('save', function (done) { this.wasNew = this.isNew; done(); });

            /**
             * Registering Schema within mongoose
             * to get model using mongoose getter
             */
            this.mongooseConnection.model(this.schema.table, mongooseSchema);

        } catch ( exception ) {
            if (exception.name === 'OverwriteModelError') {
                // alias
                let logger = Core.ApplicationFacade.instance.logger;
                return logger.warn(`[MONGOOSE] Schema already defined for collection "${this.schema.table}" on constructor ${this.constructor.name}`);
            }
            throw exception;
        }
    }


    /**
     * Returns all items for list
     *
     * @override
     */
    getAll (callback, populate) {
        this.mongooseModel.find({}).populate(populate || '').exec((error, items) => {
            if (error != null) {
                callback(error);
            } else {
                callback(null, items);
            }
        });
    }

    /**
     * Returns one item for specified criteria
     *
     * @override
     */
    findOne (criteria, callback, populate) {
        // create cursor
        let mongoQuery = this.mongooseModel.findOne(criteria);
        // adding logic for mongoose populate array
        if ( is.array(populate) ) {
            for (let part of populate) {
                if ( is.string(part) ) {
                    mongoQuery = mongoQuery.populate(part);
                }
            }
        }
        // adding logic for mongoose populate single string
        if ( is.string(populate) ) {
            mongoQuery = mongoQuery.populate(populate);
        }
        // listen result
        mongoQuery.exec((error, item) => {
            if (error != null) return callback(error);
            return callback(null, item);
        });
    }

    /**
     * Returns one item for specified criteria
     */
    find (criteria, callback, populate) {
        this.mongooseModel.find(criteria).populate(populate || '').exec((error, items) => {
            if (error != null) {
                callback(error);
            } else {
                callback(null, items);
            }
        });
    }

    /**
     * Returns one document for specified ID
     *
     * @override
     */
    findById (id, callback, populate) {
        this.mongooseModel
            .findById(id)
            .populate(populate || '')
            .exec((error, item) => {
                if (error != null) {
                    callback(error);
                } else {
                    callback(null, item);
                }
            });
    }

    /**
     * Validating filters to meet Mongo requirements
     *
     * @param filters
     * @returns {*}
     * @override
     */
    validateFilters ( filters ) {
        return filters;
    }

    /**
     * Validating Sort to meet Mongo requirements
     *
     * @param sort
     * @returns {*}
     * @override
     */
    validateSort ( sort ) {
        if (is.string(sort)) {
            let [field, direction] = sort.split(',');
            sort = {[field]: direction.toUpperCase() === 'ASC' ? 1 : -1};
        }
        return sort;
    }

    /**
     * typedef {Object} pagination
     * @prop {Number} page - for example 0
     * @prop {Number} size - for example 10
     * @prop {String} sort - for example "name,asc"
     */
    /**
     * Returns filtered, sorted and pages list of items
     *
     * @param {Object} filters - data for filtering mongo collection
     * @param {Object} pagination <code>pagination = {page: int, size: int, sort: 'name,asc'}</code>
     * @param {Function} callback
     * @param {Array} populate
     * @override
     */
    getList ( filters, pagination, callback, populate ) {

        let paging, mongoQuery, mongoQueryCopy;
        // simple get list
        mongoQuery = this.mongooseModel.find(this.validateFilters(filters));
        // addition logic for pagination
        if ( pagination ) {
            paging = {
                page: pagination.page ? pagination.page : 0,
                size: pagination.size ? pagination.size : 1000,
            };
            // to get total
            mongoQueryCopy = this.mongooseModel.find(this.validateFilters(filters));
            // Check sort
            if ( pagination.sort)  {
                mongoQuery = mongoQuery.sort(this.validateSort(pagination.sort));
            }
            // define page
            mongoQuery = mongoQuery.limit(paging.size);
            mongoQuery = mongoQuery.skip(paging.size * paging.page);
        }
        // adding logic for mongoose populate array
        if ( is.array(populate) ) {
            for (let part of populate) {
                if ( is.string(part) ) {
                    mongoQuery = mongoQuery.populate(part);
                }
            }
        }
        // adding logic for mongoose populate single string
        if ( is.string(populate) ) {
            mongoQuery = mongoQuery.populate(populate);
        }

        // expect results
        mongoQuery.exec(( error, items ) => {
            if ( error ) return callback(error);
            if ( !pagination ) return callback(null, items);
            // NOTE execute only for "pagination"
            // get total found items
            mongoQueryCopy.count(( error, total ) => {
                if ( error ) callback(error);
                let pagination = { total, ...paging };
                callback(null, { items, pagination });
            });
        });

    }

    /**
     * Returns count of items for filters set
     *
     * @param filters
     * @param callback
     * @override
     */
    getListCount ( filters, callback ) {
        this.mongooseModel.count(filters, (error, itemsCount) => {
            callback(error, itemsCount);
        });
    }

    /**
     * Insert item to the list
     * @param {Object} details
     * @param {Function} callback
     * @override
     */
    insert ( details, callback ) {
        let ItemClass = this.mongooseModel;
        let itemObject = new ItemClass(details);
        itemObject.save(details, ( error ) => {
            if (error != null) {
                callback(error);
            } else {
                callback(null, itemObject);
            }
        });
    }

    /**
     * Update item of model
     * @param {Object} details
     * @param {Function} callback
     * @override
     */
    update ( details, callback ) {
        let ItemClass = this.mongooseModel;
        let itemObject = new ItemClass(details);
        itemObject.save(details, ( error ) => {
            if (error != null) {
                callback(error);
            } else {
                callback(null, itemObject);
            }
        });
    }

    /**
     * validation item using mongoose Schema validation
     *
     * @param {Object} details
     * @param {String} [prefix = '']
     * @returns {String | null}
     * @override
     */
    validate ( details, prefix = '' ) {
        let ItemClass = this.mongooseModel;
        let itemObject = new ItemClass(details);
        let invalid = itemObject.validateSync();
        if ( invalid && invalid.errors ) {
            let errorMessage = prefix;
            for ( let name in invalid.errors ) {
                errorMessage += invalid.errors[name].message +','
            }
            return errorMessage.replace(/,$/, '.')
        }
        return null;
    }

    /**
     * Saves item into the store
     *
     * @param itemDetails
     * @param callback
     * @override
     */
    save ( itemDetails, callback ) {
        itemDetails.save((error) => {
            if (error) return callback(error);
            callback();
        });
    }

    /**
     * Saves item into the store
     *
     * @param {Object} filter - to determine which exactly model should update
     * @param {Object} data - to update
     * @param {Function} callback
     * @override
     */
    updateItems ( filter, data, callback ) {
        this.mongooseModel.update(filter, data, (error, result) => {
            if (error) return callback(error);
            callback(null, result);
        });
    }


    /**
     * Removes specified document from the storage
     * @override
     */
    remove ( itemDetails, callback ) {
        itemDetails.remove((error) => {
            if (error) {
                return asyncCallback(error);
            }
            callback();
        });
    }

    /**
     * Removes one document with specified ID
     * @param {Number} id
     * @param {Function} callback
     * @override
     */
    removeById ( id, callback ) {
        let locals = {};
        async.series([
            asyncCallback => {
                this.findById(id, (error, item) => {
                    if (error) {
                        return asyncCallback(error);
                    }
                    locals.itemDetails = item;
                    asyncCallback();
                });
            },
            asyncCallback => {
                // Define how to delete item from
                if (locals.itemDetails != null) {
                    locals.itemDetails.remove((error) => {
                        if (error) {
                            return asyncCallback(error);
                        }
                        asyncCallback();
                    });
                } else {
                    asyncCallback();
                }
            }
        ], (error) => {
            callback(error, locals.itemDetails);
        });
    }
}

/**
 * Exporting base Model definition
 */
module.exports =  MongooseModel;
