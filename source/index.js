"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ './jscr-api', './jscr-memory' ], function(API) {
    return API;
})
