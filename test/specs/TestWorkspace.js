"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ 'underscore', 'step', 'jscr-api', './TestUtils' ],

function(_, Step, API, Utils) {
    return function(newConnection) {
        var trace = Utils.trace;
        describe('API.Workspace', function() {
            var createProjects = function(workspace, projectNames, next) {
                var projects = {};
                var counter = 0;
                _.each(projectNames, function(name) {
                    workspace.loadProject(name, {
                        create : true
                    }, function(err, project) {
                        counter++;
                        var projectKey = API.normalizePath(name);
                        projects[projectKey] = project;
                        if (counter === projectNames.length) {
                            next(err, projects);
                        }
                    });
                })
            }

            it('should be able to create a new project', function() {
                var workspace = null;
                var projectName = 'test';

                Utils.testSteps(
                //
                trace('openConnection', function() {
                    var connection = newConnection();
                    connection.connect(this);
                }),
                // 
                trace('loadNotExistingProject', function(err, ws) {
                    if (err)
                        throw err;
                    workspace = ws;
                    expect(workspace).not.toEqual(null);
                    workspace.loadProject(projectName, {
                        create : false
                    }, this);
                }),
                //  
                trace('checkAndCreateProject', function(err, project) {
                    if (err)
                        throw err;
                    expect(project).toEqual(null);
                    workspace.loadProject(projectName, {
                        create : true
                    }, this);
                }),
                //
                trace('checkNewProject', function(err, project) {
                    if (err)
                        throw err;
                    expect(project).not.toEqual(null);
                    return project;
                }))
            })
            it('should be able to list existing projects', function() {

                var workspace = null;
                var projectNames = [ 'test1', 'test2', 'test3', 'test4' ];
                var controls;

                Utils.testSteps(
                //
                trace('openConnection', function() {
                    var connection = newConnection();
                    connection.connect(this);
                }),
                //
                trace('createProjects', function(err, ws) {
                    workspace = ws;
                    createProjects(workspace, projectNames, this)
                }),
                //
                trace('loadProjects', function(err, c) {
                    if (err)
                        throw err;
                    controls = c;
                    workspace.loadProjects(this);
                }),
                //
                trace('checkLoadedProjects', function(err, tests) {
                    if (err)
                        throw err;
                    expect(tests).not.toEqual(null);
                    _.each(controls, function(project, key) {
                        var testProj = tests[key];
                        expect(testProj).not.toEqual(null);
                        expect(testProj).toEqual(project);
                    });
                    return true;
                }));
            })

            it('should be able to create and delete projects', function() {
                var workspace = null;
                var projectNames = [ 'test1', 'test2', 'test3', 'test4' ];

                Utils.testSteps(
                //
                trace('openConnection', function() {
                    var connection = newConnection();
                    connection.connect(this);
                }),
                // 
                trace('createProjects', function(err, ws) {
                    workspace = ws;
                    createProjects(workspace, projectNames, this)
                }),
                // 
                trace('deleteProjects', function(err) {
                    var deleted = 0;
                    _.each(projectNames, function(projectName) {
                        workspace.deleteProject(projectName, {}, function(err,
                                result) {
                            expect(result).toEqual(true);
                            deleted++;
                        })
                    })
                    waitsFor(function() {
                        return deleted == projectNames.length;
                    });
                    var next = this;
                    next(err)
                    return true;
                }),
                // 
                trace('checkDeletedProjects', function(err) {
                    var checked = 0;
                    _.each(projectNames, function(projectName) {
                        workspace.loadProject(projectName, {
                            create : false
                        }, function(err, project) {
                            checked++;
                            expect(project).toEqual(null);
                        })
                    })
                    waitsFor(function() {
                        return checked == projectNames.length;
                    })
                }));
            })
        });
    }
});