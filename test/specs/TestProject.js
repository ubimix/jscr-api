"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ 'underscore', 'step', 'jscr-api', './TestUtils' ],

function(_, Step, API, Utils) {
    return function(newConnection) {
        var trace = Utils.trace;
        describe('API.Project', function() {
            var projectName = "test";
            var project;

            function loadProject() {
                var next = this;
                var connection = newConnection();
                connection.connect(function(err, workspace) {
                    workspace.loadProject(projectName, {
                        create : true
                    }, next)
                });
            }

            it('should be able to return an empty resource', function() {
                Utils.testSteps(trace('loadProject', loadProject),
                //            
                trace('tryToLoadBadResource', function(err, p) {
                    project = p;
                    var next = this;
                    project.loadResource('README.txt', {
                        create : false
                    }, function(err, resource) {
                        expect(resource).toEqual(null);
                        expect(err).toBe(null);
                        next();
                    })
                }));
            });

            it('should be able to load child resources', function() {
                function testChildResources(project, parentPath, childPaths) {
                    project.loadChildResources(parentPath, {}, function(err,
                            children) {
                        if (err)
                            throw err;
                        // expect(_.keys(children).length).toEqual(childPaths.length)
                        _.each(children, function(child, path) {
                            expect(_.contains(childPaths, path)).toEqual(true);
                            expect(child.getPath()).toEqual(path);
                        });
                    })
                }
                var list = [ 'about', 'about/team', 'about/news', 'docs',
                        'docs/help', 'docs/help/introduction',
                        '/path/to/resource' ];
                Utils.testSteps(trace('loadProject', loadProject),
                //            
                trace('createNewResources', function(err, p) {
                    project.loadResources(list, {
                        create : true
                    }, this);
                }),
                // 
                trace('checkChildResources', function(err, resources) {
                    var pos = 0;
                    _.each(list, function(name) {
                        name = API.normalizePath(name);
                        var resource = resources[pos++];
                        var path = resource.getPath();
                        expect(path).toEqual(name);
                    })
                    testChildResources(project, 'about', [ '/about/team',
                            '/about/news' ]);
                    testChildResources(project, '',
                            [ '/about', '/docs', 'path' ]);
                    return true;
                }))
            });

            it('should be able to create a new resource', function() {
                Utils.testSteps(trace('loadProject', loadProject),
                //
                trace('createResource', function(err, p) {
                    project = p;
                    var next = this;
                    project.loadResource('README.txt', {
                        create : true
                    }, function(err, resource) {
                        expect(err).toBe(null);
                        expect(resource).not.toBe(null);
                        var properties = resource.getProperties();
                        expect(properties).not.toEqual(null);
                        var sys = resource.getProperties();
                        expect(sys).not.toEqual(null);

                        var updated = resource.getUpdated();
                        expect(updated).not.toEqual(null);

                        var created = resource.getCreated();
                        expect(created).not.toEqual(null);
                        expect(created).toEqual(updated);
                        next();
                    })
                }));
            });

            function checkHistory(resource, len, next) {
                var path = resource.getPath();
                // Load the full history
                project.loadResourceHistory(path, {}, function(err, history) {
                    if (err) {
                        next(err, resource);
                        return;
                    }
                    expect(history.length).toEqual(len);
                    // Load all revisions
                    project.loadResourceRevisions(path, {
                        versions : history
                    }, function(err, result) {
                        if (err) {
                            next(err, resource);
                            return;
                        }
                        expect(result).not.toEqual(null);
                        expect(result.length).toEqual(len);
                        var pos = 0;
                        _.each(result, function(revision) {
                            var version = revision.getUpdated();
                            var expected = history[pos++];
                            expect(version).toEqual(expected);
                        })
                        next(err, resource);
                    });
                })
            }
            it('should be able to show resource history', function() {
                Utils.testSteps(trace('loadProject', loadProject),
                //
                trace('createResource', function(err, p) {
                    if (err)
                        throw err;
                    project = p;
                    var next = this;
                    project.loadResource('README.txt', {
                        create : true
                    }, next);
                }),
                //
                trace('checkHistoryLength', function(err, resource) {
                    if (err)
                        throw err;
                    checkHistory(resource, 1, this);
                }),
                //
                trace('updateResource', function(err, resource) {
                    if (err)
                        throw err;
                    resource = resource.getCopy();
                    var props = resource.getProperties();
                    props.label = 'Hello, world!';
                    props.description = 'This is a short description';
                    project.storeResource(resource, {}, this);
                }),
                //
                trace('checkHistoryLength', function(err, resource) {
                    if (err)
                        throw err;
                    checkHistory(resource, 2, this);
                }));
            });
        });
    }
});