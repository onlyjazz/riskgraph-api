/**
 * Load Core MVC Library
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;

/**
 * Project Utilities
 */
const Utils = require('../../lib/utils');

/**
 * Requiring Lodash helpers module
 */
const _ = require('lodash');

/**
 * Helper module to determine data types
 */
const is = require('s-is');

/**
 * Abstract FlaskService
 *
 * @type {FlaskService}
 */
const FlaskService = require('../flask.service');

/**
 * Require Helpers
 *
 * @ignore
 */
const http = require('http');
const {URL} = require('url');
const {Buffer} = require('buffer');
const async = require('async');
const bcrypt = require('bcryptjs');
const moment = require('moment');

/**
 * Flask User Model
 * @type {FlaskUserModel}
 */
const FlaskUserModel = require('../../models/flask/flaskusermodel');

/**
 * JWT Token Model
 *
 * @type {UserJWTTokenModel}
 */
const UserJWTTokenModel = require('../../models/flask/userjwttokenmodel');

/**
 * User Customer Model
 *
 * @type {UserCustomersModel}
 */
const FlaskUserCustomerModel = require('../../models/flask/usercustomersmodel');

/**
 *  Base service for Flask User business logic with various EDC Database access.
 *
 *  @author Eugene A. Kalosha <ekalosha@dfusiontech.com>
 */
class UserService extends FlaskService {

    /**
     * @constructor
     */
    constructor() {
        // this
        super();


        /**
         * FLASK
         * @type {FlaskUserModel}
         */
        this.userTable = new FlaskUserModel();

        /**
         * FLASK
         * @type {UserJWTTokenModel}
         */
        this.userJWTTokensTable = new UserJWTTokenModel();

        /**
         * FLASK
         * @type {FlaskUserCustomerModel}
         */
        this.userCustomerTable = new FlaskUserCustomerModel();

    }

    /**
     * destroy session JWT token
     *
     *
     * @param {String} token
     * @returns {Promise}
     */
    destroySession ( token ) {
        return new Promise((resolve, reject) => {
            this.userJWTTokensTable
                .destroyTokenRecord(token)
                .then(resolve.bind(null, {message: 'OK'}))
                .catch(error => {
                    reject('Logout failed!');
                });
        });
    }

    /**
     * Universal method of authentication
     *
     *
     * @param {Object} loginData - may contain email and password fields
     * @returns {Promise}
     */
    authentication ({email, password}) {
        return new Promise((resolve, reject) => {
            // declare workaround data
            let local = {
                user: null,
                token: null,
                userCustomer: false,
            };
            async.series([
                done => { // local.user
                    this.userTable.getUserByLogin(email, (error, result) => {
                        if (error || !result) return done('User or password invalid.');
                        local.user = result;
                        done();
                    });
                },
                done => { // local.userCustomer
                    this.userCustomerTable.customerByUserId(local.user.id,  (error, result) => {
                        if (error || !result) return done('User or password invalid.');
                        local.userCustomer = result;
                        done();
                    });
                },
                done => { // authentication on FLASK
                    if ( local.userCustomer /*props to detect the authentication type*/ ) {
                        this.flaskAuthentication(local.user, password)
                            .then(success => {
                                local.token = success;
                                done();
                            })
                            .catch(done);
                    }
                },
                done => { // authentication using third party IDP Service
                    done();
                    // if ( local.userCustomer /*props to detect the authentication type*/ ) {
                    //     this.IDPAuthentication({email, password}, local.userCustomer)
                    //         .then(success => {
                    //             local.token = success;
                    //             done();
                    //         })
                    //         .catch(done);
                    // }
                },
            ], error => {
                if (error || !local.token) {
                    return reject('User or password invalid.');
                } else resolve(local.token);
            });
        });
    }

    /**
     * authentication using third party IDP Service based on SAML 2.0
     * customer which has authentication service may define it data
     * to provide ability authenticate using sso service of customer
     *
     * @param {Object} loginData
     * @param {UserCustomer} customer
     * @returns {Promise}
     */
    IDPAuthentication ({email, password}, customer ) {
        return new Promise((resolve, reject) => {
            // TODO SSO service should has endpoint for API authentication
            // NOTE prepare body to send to third party IDP Service
            let body = JSON.stringify({
                email,
                password,
                grant_type: password,
                // username: 'sajera',
                // client_id: 'sajera-test',
                // email: 'allsajera@gmail.com',
                privateKey: 'MIIEpAIBAAKCAQEAujyMme6hgPPZSfBJuh0809wCJIgl2v1mLNWC57j6Fm+2HcpOzooG+84iPoO1wojfoHtRkE0jtXx/Kb+uZaiV+oEmylbYQa8Z+QsGl5IyuGfMcjGBTHf7YIz+8zYJnhkuiVvQ8seZ1EeeaJkj66zoAo1T/1lVMknP0OyxfhsBmzk9wOzZIKXqFEOC4732fisWLEWhlr2HOFSRNU/RH9QostFJHHY9n4tzANTg9D8cnhEthp1UKxi24MdUwmc1eYDUIB7MVJfiA2gL4xwCHlG1vbYk7qnIpmll7dTu52uQSLv04LD1oC6vqbd/7GFtn4BiixUGHgLfiuiOqU6BU0/GiQIDAQABAoIBAEzLSu7uh4o1AxSKENy90adKwVdvDK0QcGFsaV5D2FwIFICUO4rPP7H1fglpJjnhVtVGBIwMQv1DKOx+LdudeLqjJuuog+QR4BPhiAZYMrH3m0Y7Q6XUk8NsYHTJg429tILPaYmy5Ku0HI3lF/rGgaULwec5Xvgtl5P/BfGKEU9/xr86aJKDXb3Y1TMU+kw6UkNO3Bt93Mug2MgO7rYGCwy8ng2At60xoYTXBN1w+6KtlI1aukJ8M99sW/V4umIN47OQK7BKCenYs5tK1foh375bQu4jWKaM1T/jffSE3S5HCp0igF5yMVvdinLPKc1Ne6FF3sIt3aRXzShmM2aM4AECgYEA5Q2o5JgTxOB0PFhi/EuTsmul73yKRQsaG1totOpsf0fTc2g8r95l0sWROJwZdVqFEC0SyNzb++LtFh0s/xRnH3eYthKY6nQB/8mhl73zop1LuuM9ggLJwUYDsqAgdSL2r76uN7EOBojufOa9pZ/pL6sIQCO3G8IrE150HIdW18ECgYEA0CVizSea7xSs/ftEuLVaBL27vdOgT0X02TIxxQJuxn4rDTvkBQ8d6Hf2asPbcz2zTXHzW5Z5cwmsNiPlCDc/ix1YxmBoNfhCc+LtmI7TJNumky6t10s0+nmBh9XkoRrRT7P/u/RogZZC9wt1vIM8LDfLS5XWc7wbvkizBo04YMkCgYEA32Q0HUZIuZGjK5uUZrWbBb9BZdGT1QSf4KCE/TVIvdYiXwMBdRC1RBxVpt1vYun2rrEXCfmFPyOx0QiBcwHGFYWB1clLhBXCQWK4DBNBQ46fZlTsDxmDBdGwF41eOn/wEbUpmr0+jZcM6ZnsylSsi0YGVO/ATP1RH6HWImDIjMECgYAsxA2mz+DLkKfQDA1wqFhO8ruBDRXKVuJdICWCGI7Yk+QQeZQF3oVxLPPLbIozE88PVfWf+hHuwuLN1hR5GuDIu6wPJkbjbJxmLiUpjXYt1CvUNdLfneYsBJvuKft9BraDrNPQibU8QaPvXACbZaI4ZFuNyxEPXSKeXyZZv1+juQKBgQDK/t/wxhaaM3Fs8QJC/vDw35Zr+M4wTWHeJu1FEiq09RX+fKF1Dyg7Zi30G4g59FWKAXQ2mpVtmPp5ABVh3+YMAgCtfrkO3tCsBF+7S0JRH2PPs0BEIpyQrboxLjrDm+CE4/Er1ZsGB0OtD+pn6dxGe1N3NU5Je1QBjvrqUHdYPw==',
                certificate: 'MIICpTCCAY0CBgFh4fZXTDANBgkqhkiG9w0BAQsFADAWMRQwEgYDVQQDDAtzYWplcmEtdGVzdDAeFw0xODAzMDExNDI2MTNaFw0yODAzMDExNDI3NTNaMBYxFDASBgNVBAMMC3NhamVyYS10ZXN0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAujyMme6hgPPZSfBJuh0809wCJIgl2v1mLNWC57j6Fm+2HcpOzooG+84iPoO1wojfoHtRkE0jtXx/Kb+uZaiV+oEmylbYQa8Z+QsGl5IyuGfMcjGBTHf7YIz+8zYJnhkuiVvQ8seZ1EeeaJkj66zoAo1T/1lVMknP0OyxfhsBmzk9wOzZIKXqFEOC4732fisWLEWhlr2HOFSRNU/RH9QostFJHHY9n4tzANTg9D8cnhEthp1UKxi24MdUwmc1eYDUIB7MVJfiA2gL4xwCHlG1vbYk7qnIpmll7dTu52uQSLv04LD1oC6vqbd/7GFtn4BiixUGHgLfiuiOqU6BU0/GiQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQBrKSc1rjI9yRS13y4HmP7f3Q6MDg9iQfYuahbb952qH0tQy2VuDwi74JpSevz2PNvg7d44piBad8mSg2SukXk1940BB/jPlqCpZ62+bQap0bNTu0OIDnnbW8R+UWW/laqJH247F9uEeUsn7+7cbEWsmc8qzVaOg2eMDw+UgegBWuAzDAdkA4cCtN3/jZMEBuIOQXBFjqwx1aoF6zTeJhKK5OnUiYDg02KXPqzkkyXaounFMr5jQmtF5LQmbCJQO9rZYEdp9WYyugPPDkSwOSgykpEqWsKU0N4Whr30mIovCYUZOluYgEIPs5ZwNtfk3kRMc2v3sBSO9rdQYlpAmGuu',

            });
            // NOTE prepare url example
            let { port, pathname, hostname } = new URL('http://localhost:8080/saml-test');
            // NOTE format request options
            let options = {
                port,
                pathname,
                hostname,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                }
            };
            // declare workaround data
            let local = {
                token: null,
                ssoAnswer: null,
                ssoAnswerBody: null,
                ssoAnswerParsed: null,
            };
            async.series([
                done => { // local.ssoAnswer && local.ssoAnswerBody => send request to third party IDP Service of users customer
                    // NOTE create request
                    let request = http.request(options, response => {
                        let body = '';
                        response.setEncoding('utf8');
                        response.on('data', chunk => body+=chunk);
                        response.on('error', done);
                        response.on('end', () => {
                            local.ssoAnswer = response;
                            local.ssoAnswerBody = body;
                            done();
                        });
                    });
                    // handle error
                    request.on('error', done);
                    // write body
                    request.write(body);
                    // send
                    request.end();
                },
                done => { // local.ssoAnswerParsed => try to parse answer
                    // TODO parse body
                    // TODO parse headers
                    // TODO format local.ssoAnswerParsed
                },
                done => { // local.token => generate JWT token
                    done('3 step');
                },
            ], error => {
                if (error || !local.token) return reject(error||'[SSO] Authorization failed!');
                resolve(local.token);
            });
        });
    }

    /**
     * authentication using flask user based on JWT tokens
     *
     *
     * @param {FlaskUserModel} user
     * @param {String} password
     * @returns {Promise}
     */
    flaskAuthentication ( user, password ) {
        return new Promise((resolve, reject) => {
            // declare workaround data
            let local = {
                equal: false,
                token: null,
            };
            async.series([
                done => { // local.equal => check user password
                    // NOTE within PHP crypt used different prefix bytes. To have ability to compare password need to replace first bytes.
                    let fixPHPcryptPass = user.password.replace('$2y$', '$2a$');
                    bcrypt.compare(String(password), fixPHPcryptPass, (error, result) => {
                        if (error) return done(error);
                        if (!result) {
                            return done('Password does not match for user');
                        }
                        local.equal = true;
                        done();
                    });
                },
                done => { // local.token => generate JWT token
                    if (local.equal) {
                        this.userJWTTokensTable.createAccessToken(user, (error, result) => {
                            if (error) return done(error);
                            if (!result) {
                                return done('Failed to generate JWT Token.');
                            }
                            local.token = {
                                token: result.token,
                                expired: result.expired,
                            };
                            done();
                        });
                    }
                }
            ], error => {
                if (error || !local.token) {
                    console.log('#### Authorization Error. User: [%s]. Message: [%s]', user.email, error);
                    return reject('[Flask] Authorization failed !');
                }
                resolve(local.token);
            });
        });
    }

    /**
     * Restore user using authentication token
     *
     *
     * @param {String} token
     * @returns {Promise}
     */
    restoreUser ( token ) {
        return new Promise((resolve, reject) => {
            // TODO restore user using third party IDP Service
            // declare workaround data
            let local = {
                user: null,
                expired: false,
                tokenData: null,
            };
            async.series([
                done => { // local.tokenData => restore token data
                    this.userJWTTokensTable.restoreData(token, (error, result) => {
                        if (error || !result) {
                            return done('[JWT Token] It was not possible to restore token data.');
                        }
                        local.tokenData = result;
                        done();
                    });
                },
                done => { // local.expired => verify expiration date of token
                    if (moment(new Date()).isAfter(local.tokenData.expired)) {
                        local.expired = true;
                        return done('[JWT Token] Token expired. Please invalidate it.');
                    }
                    done();
                },
                done => { // local.user => restore user
                    this.userTable.getUserById(local.tokenData.user_id, (error, result) => {
                        if (error || !result) return done('[User] It was not possible to restore user data.');
                        local.user = result;
                        done();
                    });
                },
                done => { // local.user => restore user

                    if (!local.user)  return done();

                    this.userCustomerTable.customerByUserId(local.tokenData.user_id, (error, result) => {
                        if (error || !result) return done('[User] It was not possible to get customer data.');

                        local.user.customer_id = result.customer_id;
                        done();
                    });
                },
            ], error => {
                if (error || !local.user) return reject(error||'Flask authorization failed!');
                resolve(local.user);
            });
        });
    }


    /**
     * No initialization
     * @ignore
     */
    initialize () {
        // ...
    }
}

/**
 * Export base UserService
 */
module.exports = UserService;
