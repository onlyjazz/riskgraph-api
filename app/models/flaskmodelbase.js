
"use strict";

/**
 * Initializing database factory
 */
const DatabaseFactory = require("../modules/database-factory");

/**
 * Including base PG model
 *
 * @type {PGModelBase}
 */
const PGModelBase = require("./pgmodelbase");

/**
 *  Base model for Flask business logic with the flask Database access.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class FlaskModelBase extends PGModelBase {

    /**
     * FlaskModelBase holder constructor
     */
    constructor() {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        this.environment = DatabaseFactory.ENVIRONMENT_FLASK;
    }

}

// Export base Flask Model
module.exports = FlaskModelBase;
