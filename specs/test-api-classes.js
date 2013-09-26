"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([ 'underscore', // 
'../jscr-api', '../test-utils' ], function(_, API, Utils) {

    var trace = Utils.trace;

    function testPathNormalization() {
        it('should add a slash ' + 'at the beginning '
                + 'and remove trailing slashes', function() {
            expect(API.normalizePath('')).toEqual('');
            expect(API.normalizePath('/')).toEqual('');
            expect(API.normalizePath('a')).toEqual('a');
            expect(API.normalizePath('a/')).toEqual('a');
            expect(API.normalizePath('/a/')).toEqual('a');
            expect(API.normalizePath('/a')).toEqual('a');
            expect(API.normalizePath('a/b')).toEqual('a/b');
            expect(API.normalizePath('a/b/')).toEqual('a/b');
            expect(API.normalizePath('/a/b')).toEqual('a/b');
            expect(API.normalizePath('/a/b/')).toEqual('a/b');
        });
    }

    function testClassCreation() {
        it('should be able to create sub-classes', function() {
            var initialized = false;
            var Cls = API.newClass({
                initialize : function() {
                    initialized = true;
                },
                sayHello : function() {
                    return 'Hello';
                }
            });
            expect(Cls).not.toEqual(null);
            expect(Cls.prototype.sayHello).not.toEqual(null);
            expect(initialized).toEqual(false);
            var obj = new Cls();
            expect(initialized).toEqual(true);
            expect(obj.sayHello).not.toEqual(null);
            var text = obj.sayHello();
            expect(text).toEqual('Hello');
        });
    }

    function testVersions() {
        it('should be able to transform a simple object in a versioned one',
                function() {
                    var obj = {
                        timeout : 1235
                    }
                    var test = API.version(obj);
                    expect(test['getVersionId']).not.toBe(undefined);
                    expect(test['getTimestamp']).not.toBe(undefined);
                    expect(test.getVersionId()).not.toEqual('123');
                    expect(test.getTimestamp()).not.toBe(123);
                });
        it('should be able to return versionId and timestamp fields',
                function() {
                    var obj = {
                        timestamp : 1235,
                        versionId : 'hello'
                    }
                    var test = API.version(obj);
                    expect(test.getVersionId()).toEqual('hello');
                    expect(test.getTimestamp()).toBe(1235);
                });
    }

    describe('Basic API classes', function() {
        describe('API.Class', testClassCreation);
        describe('API.Version', testVersions);
        describe('API.normalize', testPathNormalization);
    })
})
