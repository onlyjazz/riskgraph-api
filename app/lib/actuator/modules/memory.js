/**
 *  Base module
 */
const Basehealthcheck = require('./basehealthcheck');

/**
 *  Enum for possible statuses of the app and app parts
 */
const statusEnum = require('../statusenum');

/**
 * Logic for checking of the health of the RAM
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class Memory extends Basehealthcheck {

    /**
     * Memory constructor
     *
     */
    constructor() {
        super();
        this.result = {
            inspector: 'Memory',
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
        this.result.data.details = process.memoryUsage();
        return this.result;
    }
}

/**
 * exports Memory
 */
module.exports = Memory;
