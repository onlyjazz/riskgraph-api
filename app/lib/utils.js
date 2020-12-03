
"use strict";

const crypto = require('@trust/webcrypto')

/**
 *  Common Utils
 *
 *  @author Rivka Rot <rivkar@flaskdata.io>
 */
class Utils {

    /**
     * Build random string of defined length
     *
     * @param length
     * @returns {string}
     */
    static randomString (length = 7) {

        let result = "";
        let pattern = /[a-zA-Z0-9]/;

        let iteration = 0;
        while (result.length < length) {
            // Get Cryptographically Safe Random Bytes
            let randomByte = crypto.getRandomValues(new Uint8Array(1));

            // Get Char from the defined set of chars
            let char = String.fromCharCode(randomByte);

            // Test is char allowed
            if(pattern.test(char)) {
                result += char;
            }

            iteration++;
        }

        return result;
    }
}

module.exports = Utils;