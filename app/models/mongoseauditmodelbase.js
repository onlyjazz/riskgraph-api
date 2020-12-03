
/**
 * native Node.js modules
 */
const assert = require('assert');

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');

/**
 * Including base Mongo model
 *
 * @type {MongooseModel}
 */
const MongooseModelBase = require('./mongosemodelbase');

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
 *  Abstract model. Define main collection interface.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 *  @abstract
 */
class MongooseAuditModel extends MongooseModelBase {

    /**
     * MongooseModel constructor
     */
    constructor () {
        // this
        super();


        /**
         * Define storage for the temporary saving previous state of the entity
         * This storage used in the update process for comparing with new state
         * of the entity and create an audit record
         */
        this.storage = null;

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
            // UPDATE
            mongooseSchema.post('update', this.hookWrapper.bind(this, 'postUpdate'));

            mongooseSchema.pre('update', function ( next ) {
                let document = this; // the same logic behavior as "post"
                self.hookWrapper('preUpdate', document).then(next.bind(null, null)).catch(next);
            });

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
     * before updating entity we should save old version in storage
     *
     * @param {Object} document - mongoose model
     * @param {Function} callback -
     */

    savePreviousState ( document, callback ) {
        let promise = new Promise((resolve, reject) => {
            if(document._conditions && document._conditions._id) {
                this.findById(document._conditions._id, (error, result) => {
                    if(error) return reject(error);
                    resolve(result);
                });
            } else {
                resolve({});
            }
        });

        promise
            .then(result => {
                this.storage = result;
                callback();
            })
            .catch(error => {
                console.log(error);
                callback(error);
            })
    }

    createAuditRecord (  document, callback, action, trackedFields, auditTable, collectionName ) {
        let local = {
            existingData: null,
            updatedData: null,
            editorName: null
        };
        async.series([
            done => { // in creating case
                if(action != 'Creating') return done();
                if ( document.wasNew ) { // on creation
                    let entity = document.toJSON();
                    async.forEach(trackedFields ,function (field ,next) {
                        let data = {
                            study_id: entity.study_id,
                            uid: entity.id,
                            user: entity.editor_name,
                            subjectId: entity.subjectId,
                            collection_name: collectionName,
                            field_name: field,
                            action: action,
                            value_before: '',
                            value_after: entity[field],
                            event: entity.event,
                            crf: entity.crf,
                            item_title: entity.item_title,
                            item_label: entity.item_label,
                            item_variable: entity.item_variable
                        };

                        auditTable.insert(data, ( error, result ) => {
                            if ( error ) {
                                console.log('[Database Audit Log] It was not possible to create record.');
                                return next();
                            }
                            // console.log(result);
                            next();
                        });
                    }, function (error) {
                        if(error) return done(`[Database Audit Log] It was not possible to create record. ${error}`);
                        done(null);
                    });
                } else {
                    done();
                }
            },
            done => { // in deleting case
                if(action != 'Deleting') return done();
                let entity = document.toJSON();
                async.forEach(trackedFields ,function (field ,next) {
                    let data = {
                        study_id: entity.study_id,
                        uid: entity.id,
                        user: entity.editor_name,
                        subjectId: entity.subjectId,
                        collection_name: collectionName,
                        field_name: field,
                        action: action,
                        value_before: entity[field],
                        value_after: '',
                        event: entity.event,
                        crf: entity.crf,
                        item_title: entity.item_title,
                        item_label: entity.item_label,
                        item_variable: entity.item_variable
                    };

                    auditTable.insert(data, ( error, result ) => {
                        if ( error ) {
                            console.log('[Database Audit Log] It was not possible to create record.');
                            return next();
                        }
                        // console.log(result);
                        next();
                    });
                }, function (error) {
                    if(error) return done(`[Database Audit Log] It was not possible to create record. ${error}`);
                    done(null);
                });
            },
            done => { // in updating case
                if(action != 'Updating') return done();
                //if(!local.existingData || !local.existingData._id) return done('[Database Audit Log] It was not possible to get old data.');
                local.existingData = this.storage;
                if(!local.existingData || !local.existingData._id) return done();
                // get updated data
                this.findOne({_id: local.existingData._id}, (error, result) => {
                    if(error) return done(`[Database Audit Log] It was not possible to get updated data. ${error}`);
                    local.updatedData = result;
                    try {
                        local.editorName = local.updatedData.toJSON().editor_name;
                    } catch (error) {
                        return done();
                    }
                    done();
                });
            },
            done => { // prepare and insert data
                if(action != 'Updating') return done();
                // if(!local.existingData && !local.updatedData) return done('[Database Audit Log] It was not possible to get data for record creation.');
                if(!local.existingData && !local.updatedData) return done();
                async.forEach(trackedFields ,function (field ,next) {
                    let oldValue =  null;
                    let newValue = null;

                    try {
                        oldValue = JSON.stringify(local.existingData[field]);
                    } catch (error) {
                        return next();
                    }

                    try {
                        newValue = JSON.stringify(local.updatedData[field]);
                    } catch (error) {
                        return next();
                    }

                    if(!oldValue || !newValue) {
                        console.log('[Database Audit Log] Failed to compare values.');
                        return next();
                    }
                    if(!is.equal(oldValue, newValue)) {
                        // prepare data to insert
                        let data = {
                            study_id: local.existingData.study_id,
                            uid: local.existingData._id,
                            user: local.editorName,
                            subjectId: local.existingData.subjectId,
                            collection_name: collectionName,
                            field_name: field,
                            action: action,
                            value_before: local.existingData[field],
                            value_after: local.updatedData[field],
                            event: local.updatedData.event,
                            crf: local.updatedData.crf,
                            item_title: local.updatedData.item_title,
                            item_label: local.updatedData.item_label,
                            item_variable: local.updatedData.item_variable
                        };
                        // insert record
                        auditTable.insert(data, ( error, result ) => {
                            if ( error ) {
                                console.log('[Database Audit Log] It was not possible to create record.');
                                return next();
                            }
                            // console.log(result);
                            next();
                        });
                    } else {
                        return next();
                    }
                }, function (error) {
                    if(error) return done(`[Database Audit Log] It was not possible to create record. ${error}`);
                    done(null);
                });
            }
        ], error => {
            if (error) return callback(error);
            callback();
        });
    }
}

/**
 * Exporting base Model definition
 */
module.exports =  MongooseAuditModel;
