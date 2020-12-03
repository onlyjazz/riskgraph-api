
"use strict";

/**
 * Load Core MVC Library
 */
const Core = require('dft-mvc-core');
const ApplicationFacade = Core.ApplicationFacade;

/**
 *  Profiler Utils
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class Profiler {

    /**
     * Generate start point based on the current timestamp
     *
     * @param  {String} name
     * @returns {EntryPoint}
     */
    static start (name) {
        let result = new EntryPoint(name);

        return result;
    }

    /**
     * Log current entry point
     *
     * @param {EntryPoint} entryPoint
     */
    static log (entryPoint) {
        if (entryPoint) {
            ApplicationFacade.instance.logger.info(entryPoint.buildMessage());
        }
    }

    /**
     * Log current entry point
     *
     * @param {EntryPoint} entryPoint
     */
    static debug (entryPoint) {
        if (entryPoint && ApplicationFacade.instance.config.items.environment && ApplicationFacade.instance.config.items.environment.mode === 'DEVELOPMENT') {
            ApplicationFacade.instance.logger.debug(entryPoint.buildMessage());
        }
    }
}

/**
 * Entry Point for Profiler
 */
class EntryPoint {
    /**
     * Default entry point constructor
     *
     * @param name
     */
    constructor (name) {

        /**
         * @type {boolean}
         */
        this.isClosed = false;

        /**
         * @type {Date}
         */
        this.start = new Date();

        /**
         * @type {string}
         */
        this.uid = this.start.getMilliseconds() + "-" + (EntryPoint.COUNTER++);

        /**
         * @type {Date}
         */
        this.end = null;

        /**
         * @type {Number}
         */
        this.duration = null;

        this.name = name;
    }

    /**
     * Close current Entry point
     */
    close () {
        if (!this.isClosed) {
            this.end = new Date();
            this.duration = this.end.getTime() - this.start.getTime();
            this.isClosed = true;
        }
    }

    /**
     * Build message for entry point
     *
     * @returns {string}
     */
    buildMessage () {
        this.close();

        let durationSec = this.duration / 1000;
        let result = '## PROFILER [' + this.name + '][' + this.uid + '] duration: ' + (durationSec.toFixed(3));

        return result;
    }
}

EntryPoint.COUNTER = 1;

module.exports = Profiler;