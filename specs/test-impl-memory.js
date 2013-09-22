"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

var tests = [ 'jscr-api/test-workspace-connection', 'jscr-api/test-workspace',
        'jscr-api/test-project' ];
var dependencies = [ 'underscore', 'jscr-api/test-utils', 'jscr-api/jscr-api',
        'jscr-api/jscr-memory' ];
define([].concat(dependencies).concat(tests), function(_, Utils, API) {
    var specs = _.toArray(arguments).splice(dependencies.length);
    describe('Memory API Implementation: ', function() {
        function newConnection() {
            return new API.Implementation.Memory.WorkspaceConnection({});
        }
        _.each(specs, function(spec) {
            spec(newConnection);
        })
        console.log('Finished')
    });
})
