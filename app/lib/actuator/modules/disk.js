/**
 *  Base module
 */
const Basehealthcheck = require('./basehealthcheck');

/**
 *  Enum for possible statuses of the app and app parts
 */
const statusEnum = require('../statusenum');

/**
 * Logic for checking of the health of the HDD(SSD)
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class Disk extends Basehealthcheck {

    /**
     * Disk constructor
     *
     */
    constructor() {
        super();
        this.result = {
            inspector: 'Disk',
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
        return this.result;
    }

}

/**
 * exports Disk
 */
module.exports = Disk;
