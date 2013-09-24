"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}

define([ 'underscore', 'q', './jscr-api', './test-utils' ],

function(_, Q, API, Utils) {
    return function(newConnection) {
        var trace = Utils.trace;
        describe('API.Project', function() {
            var projectName = "test";
            var project;
            var promise;

            beforeEach(function() {
                var connection = newConnection();
                promise = connection.connect().then(function(workspace) {
                    return workspace.loadProject(projectName, {
                        create : true
                    });
                }).then(function(prj) {
                    project = prj;
                });
            });

            it('should have all methods defined by the API', function() {
                Utils.testPromise(promise.then(function() {
                    Utils.checkMethods(project, 'getProjectKey',
                            'loadResource', 'loadResources', 'loadResources',
                            'deleteResource', 'storeResource',
                            'loadModifiedResources', 'loadResourceHistory',
                            'searchResources');
                }));
            });

            it('should be able to return an empty resource', function() {
                var path = API.normalizePath('README.txt');
                Utils.testPromise(promise.then(function() {
                    return project.loadResource(path, {
                        create : true
                    });
                }).then(function(resource) {
                    expect(resource).not.toEqual(null);
                    expect(resource.getPath()).toEqual(path);
                }));
            });

            it('should be able to load child resources', function() {
                function testChildResources(project, parentPath, childPaths) {
                    var p = project.loadChildResources(parentPath).then(
                            function(children) {
                                // expect(_.keys(children).length).toEqual(childPaths.length)
                                _.each(children, function(child, path) {
                                    expect(_.contains(childPaths, path))
                                            .toEqual(true);
                                    expect(child.getPath()).toEqual(path);
                                });
                            });
                    Utils.testPromise(p);
                }

                var list = [ 'about', 'about/team', 'about/news', 'docs',
                        'docs/help', 'docs/help/introduction',
                        '/path/to/resource' ];
                Utils.testPromise(promise.then(function() {
                    return project.loadResources(list, {
                        create : true
                    });
                }).then(
                        function(resources) {
                            var pos = 0;
                            _.each(list, function(name) {
                                name = API.normalizePath(name);
                                var resource = resources[pos++];
                                var path = resource.getPath();
                                expect(path).toEqual(name);
                            })
                            testChildResources(project, 'about', [
                                    '/about/team', '/about/news' ]);
                            testChildResources(project, '', [ '/about', '/docs',
                                    '/path' ]);
                            return true;
                        }));
            });

            it('should be able to create a new resource', function() {
                var path = API.normalizePath('README.txt');
                Utils.testPromise(promise.then(function() {
                    return project.loadResource(path, {
                        create : true
                    });
                }).then(function(resource) {
                    expect(resource).not.toBe(null);
                    var properties = resource.getProperties();
                    expect(resource.getPath()).toEqual(path);
                    expect(properties).not.toEqual(null);
                    var sys = resource.getProperties();
                    expect(sys).not.toEqual(null);

                    var updated = resource.getUpdated();
                    expect(updated).not.toEqual(null);

                    var created = resource.getCreated();
                    expect(created).not.toEqual(null);
                    expect(created).toEqual(updated);
                }));
            })

            function checkHistory(resource, len) {
                var history = null;
                var path = resource.getPath();
                return project.loadResourceHistory(path).then(function(h) {
                    history = h;
                    expect(history.length).toEqual(len);
                    return project.loadResourceRevisions(path, {
                        versions : history
                    });
                }).then(function(revisions) {
                    expect(revisions.length).toEqual(len);
                    var pos = 0;
                    _.each(revisions, function(revision) {
                        var version = revision.getUpdated();
                        var expected = history[pos++];
                        expect(version).toEqual(expected);
                    })
                });
            }

            // }
            it('should be able to show resource history', function() {
                var path = API.normalizePath('README.txt');
                var resource = null;
                Utils.testPromise(promise.then(function() {
                    return project.loadResource(path, {
                        create : true
                    });
                }).then(function(r) {
                    resource = r;
                    return checkHistory(resource, 1);
                }).then(function() {
                    var copy = resource.getCopy();
                    var props = copy.getProperties();
                    props.label = 'Hello, world!';
                    props.description = 'This is a short description';
                    return project.storeResource(copy);
                }).then(function() {
                    return checkHistory(resource, 2);
                }));
            });
        });
    }
});