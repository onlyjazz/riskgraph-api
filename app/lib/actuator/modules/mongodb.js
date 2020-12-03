/**
 *  Base module
 */
const Basehealthcheck = require('./basehealthcheck');

/**
 *  Enum for possible statuses of the app and app parts
 */
const statusEnum = require('../statusenum');

/**
 * Logic for checking of the health of the MongoDB DB
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class Mongodb extends Basehealthcheck {

    /**
     * Database constructor
     *
     */
    constructor() {
        super();
        this.result = {
            inspector: 'MongoDB',
            data: {
                status: statusEnum.UP,
                details: {}
            }
        }
    }

    /**
     * check the health of the current target
     *
     * @return {Promise}
     */
    async checkHealth() {
        const readyState = await this.application.mongoose.connection.readyState;
        if(readyState) {
            this.result.data.status = statusEnum.UP;
            this.result.data.details.readyState = readyState;
        } else {
            this.result.data.status = statusEnum.DOWN;
            this.result.data.details.readyState = readyState;
        }
        return this.result;
    }
}

/**
 * exports Mongodb
 */
module.exports = Mongodb;
