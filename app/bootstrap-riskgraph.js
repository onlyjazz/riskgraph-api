
// Using STRICT mode for ES6 features
"use strict";

/**
 * Load Core MVC Library and Application Facade
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;
const ApplicationBootstrap = Core.Bootstrap;
const HTTPServer = Core.Modules.HTTPServer;
const MongooseBaseModel = require('./models/mongosemodelbase');
const path = require('path');
/**
 * Importing Application Facade
 *
 * @type {ApplicationFacade|*}
 */
const applicationFacade = ApplicationFacade.instance;

/**
 * Importing Swagger Plugin
 *
 * @type {SwaggerPlugin|*}
 */
const SwaggerPlugin = require('../swagger/swaggerplugin');

/**
 * Module to check health of the app
 *
 * @type {Actuator}
 */
const Actuator = require('./lib/actuator');


/**
 * Require Async operations helper
 *
 * @type {exports|module.exports}
 */
const async = require("async");

/**
 * Require base express namespace
 *
 * @type {*|createApplication}
 */
const express = require("express");

/**
 * Require CORS headers helper
 *
 * @type {exports|module.exports}
 */
const cors = require("cors");

/**
 *  Web Init Module
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class WebInitModule extends ApplicationBootstrap {

    /**
     * HTTP Server constructor
     */
    constructor () {
        // We must call super() in child class to have access to 'this' in a constructor
        super();

        // Apply Express HTTP CORS support and default Early-bird middlewares.
        applicationFacade.once(HTTPServer.HTTPServerEvents.BEFORE_INIT_HTTP_MIDDLEWARE, (event) => {
            let corsOptions = {
                origin: (req, callback) => {
                    callback(null, '*'); // Allow any origin urls
                },
                methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Token', 'edc'],
                exposedHeaders: ['Content-Range', 'X-Content-Range'],
            };
            let httpServerInstance = event.target;
            // httpServerInstance.application.options('*', cors(corsOptions));
            httpServerInstance.application.use(cors(corsOptions));

            // Trying to safely initialize swagger
            this.initSwagger();
            this.initActuator().then((error, success) => {if(error) console.log(error)});

            // Increasing request entity size to 50mb
            let bodyParser = require('body-parser');
            httpServerInstance.application.use(bodyParser.json({type: 'application/json', limit: '50mb'}));
        });
        // applicationFacade.emit(HTTPServer.HTTPServerEvents.BEFORE_INIT_HTTP_MIDDLEWARE, {target: this});
    }

    /**
     * Initialize server application
     */
    init () {

        // Inherit bindings to parents initialization
        super.init();
        const defaultPort = 5562;
        const defaultHost = '::'
        // Inherit bindings to parents initialization
        if (process.env.PORT) {
            applicationFacade.config.items.server.port = process.env.PORT;
        } else {
            applicationFacade.config.items.server.port = defaultPort;
        }
        if (process.env.HOST) {
            applicationFacade.config.items.server.host = process.env.HOST;
        } else {
            applicationFacade.config.items.server.host = defaultHost;
        }

        this.initActuator().then((error, success) => {if(error) console.log(error)});

        // Inherit bindings to parents initialization
        super.init();

        // Add middleware to verify/check request and assign req.edc if exists
        applicationFacade.server.application.use(WebInitModule.prepare);

        this._logger.log('[WebInitModule] Init server application');

        // Loading module routes
        applicationFacade.server.loadRoutesFromFile('/app/routes/riskgraph.js');
    };

    /**
     * Running module
     */
    run () {
        this._logger.log('[WebInitModule] Run Bootstrap module');
        // initialize Mongoose schemas
        MongooseBaseModel.initialize();

        // Set Bigger Timeout for the server
        applicationFacade.server.server.timeout = 600000;
    };

    /**
     * Bootstrapping module
     */
    bootstrap () {
        super.bootstrap();

        this._logger.log('[WebInitModule] Bootstraping Module: ', this.name);
    };

    /**
     * Extract EDC from the request
     *
     * @param req
     * @param res
     * @param next
     */
    static prepare(req, res, next) {
        // Trying to find EDC database ID in the headers
        let environment = req.headers.edc;

        if (environment == null) {
            // Trying to find EDC database ID in the query
            environment = req.query.edc;
        }

        if (environment == null) {
            // Trying to find EDC database ID in the body
            environment = req.body.edc;
        }

        if (environment) {
            req.edc = environment;
        }

        next();
    }

    /**
     * Initialize swagger within main application thread if it is allowed in the config
     */
    initSwagger() {
        const config = applicationFacade.config.items;

        if (applicationFacade.config.items.swagger && applicationFacade.config.items.swagger.enabled) {
            const middleware = require('swagger-express-middleware');
            const application = applicationFacade.server.application;

            // prepare annotation for swagger API
            let options = {};
            options.apis = [
                './app/controllers/swaggerdefinitions.js',
                './app/controllers/**/*.js',
            ];
            options.defDataFilePath = './riskgraph.json';
            // determine the base path for swagger in proxying case
            options.basePath = config && config.riskgraphSwaggerBasePath ? config.analyticsSwaggerBasePath : null;
            // determine the name of the swagger files
            options.swaggerFileName = 'auto_swagger_riskgraph';
            SwaggerPlugin.createSwaggerFiles(options, (error, result) => {
                if (error || ! result) {
                    console.error('[Swagger INIT] It was not possible to generate swagger files.', error);
                }
                // prepare file path
                // yamlFileName || jsonFileName
                let pathToAnnotation = path.join('swagger', `${result.swaggerFileName}.yaml`);
                middleware(pathToAnnotation, application, (error, middleware) => {
                    console.log('[Swagger INIT] Was initialized successfully.');
                    // Add all the Swagger Express Middleware, or just the ones you need.
                    // NOTE: Some of these accept optional options (omitted here for brevity)
                    application.use('/swagger', express.static(__dirname + '/../swagger/ui'));
                    application.use(
                        middleware.metadata(),
                        middleware.files({
                            apiPath: "/swagger.json"
                        }),
                        middleware.parseRequest(),
                        middleware.validateRequest(),
                        middleware.mock()
                    );
                });
            });

        }
    }

    async initActuator () {
        const actuator = new Actuator(applicationFacade, applicationFacade.server.application);
        await actuator.config('/health', ['postgresql', 'mongodb', 'disk', 'memory'])
        await actuator.initialize();
    }

}

module.exports = WebInitModule;
