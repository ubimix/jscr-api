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

    function TestPromise() {
        this.counter = -1;
        this.promises = [];
    }
    _.extend(TestPromise.prototype, {
        test : function(promise) {
            var stack = new Error().stack;
            var that = this;
            if (that.counter < 0)
                that.counter = 1;
            else
                that.counter++;
            that.promises.push(promise);
            return promise.fail(function(error) {
                that.handleError(error, stack);
            }).fin(function() {
                that.counter--;
                return true;
            });
        },
        waitsForFinish : function(timeout) {
            var that = this;
            timeout = timeout || 1000;
            waitsFor(function() {
                return that.counter == 0;
            }, "Operations should be finished in " + timeout + ' ms', timeout);
        },
        handleError : function(error, stack) {
            console.log('ERROR!', error, stack)
        }
    });

    function testPromise(promise) {
        var finished = false;
        promise.fin(function() {
            finished = true;
        }).done();
        waitsFor(function() {
            return finished;
        }, "Operations should be finished in the 750ms", 750);
    }

    function checkMethods(obj) {
        var expectedMethods = _.toArray(arguments).slice(1);
        _.each(expectedMethods, function(method) {
            var val = obj[method];
            if (!_.isFunction(val)) {
                throw new Error('Method "' + method + '" expected');
            }
        })
        return true;
    }

    return {
        trace : trace,
        TestPromise : TestPromise,
        testPromise : testPromise,
        checkMethods : checkMethods
    }
})
