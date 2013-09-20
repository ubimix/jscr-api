"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([ 'underscore', 'jscr-api', './TestUtils' ], function(_, API, Utils) {

    var trace = Utils.trace;

    describe('API', function() {
        it('should not be empty', function() {
            expect(API).not.toEqual(null);
        });
    });
    describe('API.normalize', function() {
        it('should add a slash at the beginning '
                + 'and remove trailing slashes', function() {
            expect(API.normalizePath('')).toEqual('/');
            expect(API.normalizePath('a')).toEqual('/a');
            expect(API.normalizePath('a/')).toEqual('/a');
            expect(API.normalizePath('/a/')).toEqual('/a');
            expect(API.normalizePath('/a')).toEqual('/a');
        });
    });

    describe('API.Class', function() {
        it('should able to create sub-classes', function() {
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
    });

    describe('API.Version', function() {
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
    });
    describe('API.WorkspaceConnection', function() {
        it('should have a connection method', function() {
            var connection = new API.WorkspaceConnection();
            expect(connection).not.toEqual(null);
            expect(connection.connect).not.toEqual(null);
            connection.connect({}, function(err, workspace) {
                expect(err).not.toEqual(null);
                expect(workspace).toEqual(null);
            })
        });
    });

    describe('API.Project', function() {
        var expectedMethods = [ 'getProjectKey', 'loadResource',
                'loadResources', 'loadResources', 'deleteResource',
                'storeResource', 'loadModifiedResources',
                'loadResourceHistory', 'searchResources' ];
        var project = new API.Project();
        _.each(expectedMethods, function(method) {
            it('should have the "' + method + '" method', function() {
                var val = project[method];
                expect(_.isFunction(val)).toEqual(true);
            })
        })
    });

})
