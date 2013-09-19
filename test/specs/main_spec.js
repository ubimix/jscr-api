"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
require.config({
    paths : {
        'jscr-api' : '../../source/jscr-api',
        'jscr-memory' : '../../source/jscr-memory'
    }
});

var specs = [ './ApiTest', './MemoryApiTest' ];
require.call(require, specs);
