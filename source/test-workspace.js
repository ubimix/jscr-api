"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ 'underscore', 'q', 'jscr-api/jscr-api', 'jscr-api/test-utils' ],

function(_, Q, API, Utils) {
    return function(newConnection) {
        var trace = Utils.trace;
        describe('API.Workspace', function() {

            it('should have all methods defined by the API', function() {
                var connection = newConnection();
                Utils.testPromise(connection.connect().then(
                        function(workspace) {
                            Utils.checkMethods(workspace, 'loadProject',
                                    'loadProjects', 'deleteProject');
                        }));
            });

            it('should be able to create a new project', function() {
                var finished = false;
                var workspace = null;
                var projectName = 'test';
                var connection = newConnection();
                Utils.testPromise(connection.connect()
                //
                .then(function(ws) {
                    workspace = ws;
                    expect(workspace).not.toEqual(null);
                    return workspace.loadProject(projectName, {
                        create : false
                    });
                })
                //
                .then(function(project) {
                    expect(project).toEqual(null);
                })
                //
                .then(function() {
                    return workspace.loadProject(projectName, {
                        create : true
                    });
                })
                //
                .then(function(project) {
                    expect(project).not.toEqual(null);
                    var control = API.normalizePath(projectName);
                    expect(project.getProjectKey()).toEqual(control);
                })
                //
                .fail(function(err) {
                    console.log(err);
                }));
            })

            function testNoProjects(projects, projectNames) {
                expect(projects).not.toEqual(null);
                expect(projects.length).toEqual(projectNames.length);
                _.each(projects, function(project) {
                    expect(project).toEqual(null);
                })
            }
            function testProjects(projects, projectNames) {
                expect(projects).not.toEqual(null);
                expect(projects.length).toEqual(projectNames.length);
                for ( var i = 0; i < projects.length; i++) {
                    var project = projects[i];
                    var control = API.normalizePath(projectNames[i]);
                    var test = project.getProjectKey();
                    expect(test).toEqual(control);
                }
            }

            it('should be able to list existing projects', function() {

                var workspace = null;
                var projectNames = [ 'test1', 'test2', 'test3', 'test4' ];
                var connection = newConnection();

                // Connect
                Utils.testPromise(connection.connect().then(function(ws) {
                    workspace = ws;
                })
                // Try to load non-existing projects
                .then(function() {
                    return Q.all(_.map(projectNames, function(name) {
                        return workspace.loadProject(name, {
                            create : false
                        })
                    }));
                })
                // Check that no projects were loaded
                .then(function(projects) {
                    testNoProjects(projects, projectNames);
                })
                // Create projects
                .then(function() {
                    return Q.all(_.map(projectNames, function(name) {
                        return workspace.loadProject(name, {
                            create : true
                        })
                    }));
                })
                // Test created projects
                .then(function(projects) {
                    testProjects(projects, projectNames);
                })
                // Re-load projects with create flag equal to false;
                .then(function() {
                    return Q.all(_.map(projectNames, function(name) {
                        return workspace.loadProject(name, {
                            create : false
                        })
                    }));
                })
                // Test loaded projects
                .then(function(projects) {
                    testProjects(projects, projectNames);
                }));
            })

            //
            it('should be able to create and delete projects', function() {
                var projectNames = [ 'test1', 'test2', 'test3', 'test4' ];
                var workspace = null;
                var connection = newConnection();
                // Connect
                Utils.testPromise(connection.connect()
                // Create projects
                .then(function(ws) {
                    workspace = ws;
                    return Q.all(_.map(projectNames, function(name) {
                        return workspace.loadProject(name, {
                            create : true
                        })
                    }));
                })
                // Test created projects
                .then(function(projects) {
                    testProjects(projects, projectNames);
                    return Q.all(_.map(projectNames, function(name) {
                        return workspace.deleteProject(name);
                    }));
                })
                // Check delete results that for try to re-load all deleted
                // projects
                .then(function(results) {
                    expect(results.length).toEqual(projectNames.length);
                    _.each(results, function(result) {
                        expect(result).toEqual(true);
                    })
                    return Q.all(_.map(projectNames, function(name) {
                        return workspace.loadProject(name, {
                            create : false
                        })
                    }));
                })
                // Check that the projects were not loaded (they does not exist
                // anymore)
                .then(function(projects) {
                    testNoProjects(projects, projectNames);
                }));
            })
        });
    }
});