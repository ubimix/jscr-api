"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ 'underscore', 'q' ], function(_, Q) {

    function printTrace() {
        // console.log.apply(this, arguments);
    }

    function trace(name, f) {
        return function() {
            printTrace('[enter:' + name + ']');
            try {
                return f.apply(this, arguments);
            } finally {
                printTrace('[exit:' + name + ']');
            }
        }
    }

    function testPromise(promise) {
        var finished = false;
        promise.fin(function() {
            finished = true;
        }).done();
        waitsFor(function() {
            return finished;
        }, "Operations should be finished in the 750ms", 750);
    }

    return {
        trace : trace,
        testPromise : testPromise
    }
})
