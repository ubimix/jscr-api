"use strict"
var tests = [ './TestWorkspaceConnection', './TestWorkspace', './TestProject' ];

var dependencies = [ 'underscore', './TestUtils', 'jscr-memory' ];
define([].concat(dependencies).concat(tests),

function(_, Utils, API) {
    // All arguments after dependencies are tests specifications.
    // Use them to run tests.
    var specs = [];
    for ( var i = dependencies.length; i < arguments.length; i++) {
        specs.push(arguments[i]);
    }

    var pos = dependencies.length;
    describe('Memory API Implementation: ', function() {
        function newConnection() {
            return new API.Implementation.Memory.WorkspaceConnection({});
        }
        _.each(specs, function(spec) {
            spec(newConnection);
        })
    });
})
