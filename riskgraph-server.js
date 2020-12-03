
// Using STRICT mode for ES6 features
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;

/**
 * Define virtual properties to allow proper code assign
 *
 * @typedef {object} ApplicationFacade
 * @property {HTTPServer} server
 * @property {JWTModule} jwt
 * @property {Translate} translate
 * @property {DatabaseFactory} databaseFactory
 */

/**
 *  Importing Application Facade and run the Application.
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
const applicationFacade = ApplicationFacade.instance;
applicationFacade.load('server', Core.Modules.HTTPServer);
applicationFacade.load('databaseFactory', require('./app/modules/database-factory'));
applicationFacade.load('jwt', require('./app/modules/jwt'));
applicationFacade.load('bootstrap', require('./app/bootstrap-riskgraph'));
applicationFacade.load('mongoose', require('./app/modules/mongoose'));

// Initializing all modules
applicationFacade.init();

// Running modules
applicationFacade.run();
