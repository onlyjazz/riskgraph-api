/**
 *  Base module
 */
const Basehealthcheck = require('./basehealthcheck');

/**
 *  Enum for possible statuses of the app and app parts
 */
const statusEnum = require('../statusenum');

/**
 * Logic for checking of the health of the PostgreSQL DB
 *
 * @author Rivka Rot <rivkar@flaskdata.io>
 */
class Posgresql extends Basehealthcheck {

    /**
     * Posgresql constructor
     *
     */
    constructor() {
        super();
        this.result = {
            inspector: 'PostgreSQL',
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
    checkHealth() {
        return new Promise((resolve, reject) => {
            this.application.databaseFactory.flask((error, flask) => {
                if(error) {
                    delete this.result.data.details.test;
                    this.result.data.status = statusEnum.DOWN;
                    this.result.data.details.error = error;
                    return reject(error);
                }

                if(flask || flask.pool) {
                    flask.pool.query('SELECT $1::text as name', ['CONNECT SUCCESS'], (error, result) => {
                        if (error) {
                            console.error('Error executing query', error.stack)
                            delete this.result.data.details.test;
                            this.result.data.status = statusEnum.DOWN;
                            this.result.data.details.error = error;
                            return resolve(this.result);
                        }
                        delete this.result.data.details.error;
                        this.result.data.status = statusEnum.UP;
                        this.result.data.details.test = result.rows[0].name;
                        return resolve(this.result);
                    })
                } else {
                    delete this.result.data.details.test;
                    this.result.data.status = statusEnum.DOWN;
                    this.result.data.details.error = 'flask.pool is not exist';
                    resolve(this.result);
                }
            });
        })
    }
}

/**
 * exports Posgresql
 */
module.exports = Posgresql;
