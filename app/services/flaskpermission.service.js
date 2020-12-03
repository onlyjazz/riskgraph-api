/**
* Load Core MVC Library
*/
const Core = require('dft-mvc-core');

/**
 * Require Helpers
 *
 * @ignore
 */
const async = require('async');

/**
 * Helper to determine data types
 */
const is = require('s-is');

/**
 * Abstract BaseService
 *
 * @type {BaseService}
 */
const FlaskService = require('./flask.service');

/**
 * Require Models
 *
 * @ignore
 */
const FlaskStudyModel = require('../models/flask/studymodel');

/**
 *  Base service for Flask business logic with various EDC Database access.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class FlaskPermissionService extends FlaskService {

    /**
     * @constructor
     */
     constructor() {
        // this
        super();

        /**
         * FLASK
         * @type {FlaskStudyModel}
         */
        this.flaskStudyTable = new FlaskStudyModel();
    }

    /**
     * No initialization
     * @ignore
     */
    initialize () {
        ;
    }

    /**
     * check Permissions By Study Id method
     *
     *
     * @param {FlaskUserModel} user
     * @param {Number} studyId - studyId unique identifier of study
     * @returns {Promise}
     */
    checkPermissionsByStudyId ( user, studyId ) {
        return new Promise((resolve, reject) => {
            // declare workaround data
            let local = {
                userStudies: null,
                result: false
            };
            if(user.cron) {
                local.result = true;
                return resolve(local.result);
            }
            let select = 'SELECT s.id AS study_id, s.brief_title AS brief_title, s.unique_protocolid AS unique_protocolid FROM studies s ';
            async.series([
                done => { // get all studies
                    if(!user) return done('[Check User Permission] user is not exist');
                    if(!is.countable(studyId)) return done('[Check User Permission] study_id is not exist');
                    if ( user.role_id !== 1 ) return done(); // user not a admin
                    let sqlQuery = select+'';
                    this.flaskStudyTable.query(sqlQuery, [], ( error, result ) => {
                        if (error || !result) return done('[Studies] It was not possible to get User Studies.');
                        local.userStudies = result.rows;
                        done();
                    });
                },
                done => { // get all customer studies
                    if ( local.userStudies || user.role_id !== 2 ) return done(); // user not a customer admin
                    let sqlQuery = select+'RIGHT JOIN user_customers uc ON uc.customer_id = s.customer_id WHERE uc.user_id= $1';
                    this.flaskStudyTable.query(sqlQuery, [user.id], ( error, result ) => {
                        if (error || !result) return done('[Studies] It was not possible to get User Studies.');
                        local.userStudies = result.rows;
                        done();
                    });
                },
                done => { // get user study
                    if ( local.userStudies ) return done();
                    let sqlQuery = select+`INNER JOIN user_studies us ON s.id = us.study_id WHERE us.user_id= $1`;
                    this.flaskStudyTable.query(sqlQuery, [user.id], ( error, result ) => {
                        if (error || !result) return done('[Studies] It was not possible to get User Studies.');
                        local.userStudies = result.rows;
                        done();
                    });
                },
                done => { // check permission
                    if ( !local.userStudies || local.userStudies.length == 0) return done();
                    for(let i = 0; i < local.userStudies .length; i++) {
                        if(local.userStudies [i].study_id && local.userStudies [i].study_id == studyId) {
                            local.result = true;
                        }
                    }
                    done();
                }
            ], error => {
                if (error) return reject(error || '[Studies] It was not possible to get User Studies.');
                // console.log(studyId+' '+local.result);
                resolve(local.result);
            });
        });
    }
}

/**
 * Export base FlaskService
 */
module.exports = FlaskPermissionService;
