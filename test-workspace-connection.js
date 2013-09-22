"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ 'underscore', //
'jscr-api/jscr-api', // 
'jscr-api/test-utils' ],

function(_, API, Utils) {
    return function(newConnection) {
        describe('API.WorkspaceConnection', function() {

            it('should have all methods defined by the API', function() {
                var connection = newConnection();
                Utils.checkMethods(connection, 'connect');
            });

            it('should be able to create a new workspace', function() {
                var connection = newConnection();
                expect(connection).not.toEqual(null);
                expect(connection.connect).not.toEqual(null);
                var promise = connection.connect();
                expect(promise).not.toEqual(null);
                promise.then(function(workspace) {
                    expect(err).toEqual(null);
                    expect(workspace).not.toEqual(null);
                })
            });
        });
    }
});