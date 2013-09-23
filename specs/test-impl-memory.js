"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

var tests = [ '../test-workspace-connection', '../test-workspace',
        '../test-project' ];
var dependencies = [ 'underscore', '../test-utils', '../jscr-api',
        '../jscr-memory' ];
define([].concat(dependencies).concat(tests), function(_, Utils, JSCR) {
    var specs = _.toArray(arguments).splice(dependencies.length);
    describe('Memory API Implementation: ', function() {
        function newConnection() {
            return new JSCR.Implementation.Memory.WorkspaceConnection({});
        }
        _.each(specs, function(spec) {
            spec(newConnection);
        })
    });
})
