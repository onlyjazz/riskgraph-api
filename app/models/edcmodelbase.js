
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
 *  Base model for EDC business logic with various EDC Database access.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class EDCModelBase extends PGModelBase {

    /**
     * EDCModelBase holder constructor
     */
    constructor(environmentId) {
        // We must call super() in child class to have access to 'this' in a constructor
        super(environmentId);

        this.environment = DatabaseFactory.ENVIRONMENT_EDC;
    }

}

// Export base EDC Model
module.exports = EDCModelBase;
