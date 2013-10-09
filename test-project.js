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
            var testPromise;

            beforeEach(function() {
                testPromise = new Utils.TestPromise();
                var connection = newConnection();
                promise = connection.connect().then(function(workspace) {
                    return workspace.loadProject(projectName, {
                        create : true
                    });
                }).then(function(prj) {
                    project = prj;
                });
            });
            afterEach(function() {
                testPromise.waitsForFinish();
                testPromise = null;
            })

            it('should have all methods defined by the API', function() {
                testPromise.test(promise.then(function() {
                    return Utils.checkMethods(project, 'getProjectKey',
                            'loadResource', 'loadResources', 'deleteResource',
                            'storeResource', 'loadModifiedResources',
                            'loadResourceHistory', 'searchResources');
                }));
            });

            it('should be able to return an empty resource', function() {
                var path = API.normalizeKey('README.txt');
                testPromise.test(promise.then(function() {
                    return project.loadResource(path, {
                        create : true
                    });
                }).then(function(resource) {
                    expect(resource).not.toEqual(null);
                    expect(resource.getPath()).toEqual(path);
                    expect(resource.getPath()).toEqual(path);
                }));
            });

            it('should be able to load child resources', function() {
                function testChildResources(project, parentPath, childPaths) {
                    childPaths = _.map(childPaths, function(p) {
                        return API.normalizeKey(p);
                    })
                    var p = project.loadChildResources(parentPath)
                    //
                    .then(function(children) {
                        // expect(_.keys(children).length).toEqual(childPaths.length)
                        _.each(childPaths, function(path) {
                            var child = children[path];
                            expect(child).not.toEqual(null);
                            expect(child.getPath()).toEqual(path);
                        });
                    });
                    Utils.testPromise(p);
                }

                var list = [ 'about', 'about/team', 'about/news', 'docs',
                        'docs/help', 'docs/help/introduction',
                        '/path/to/resource' ];

                testPromise.test(promise.then(function() {
                    return project.loadResources(list, {
                        create : true
                    });
                }).then(
                        function(resources) {
                            _.each(list, function(name) {
                                name = API.normalizeKey(name);
                                var resource = resources[name];
                                var path = resource.getPath();
                                expect(path).toEqual(name);
                            })
                            testChildResources(project, 'about', [
                                    'about/team', 'about/news' ]);
                            testChildResources(project, '', [ 'about', 'docs',
                                    'path' ]);
                            return true;
                        }));
            });

            it('should be able to create a new resource', function() {
                var path = API.normalizeKey('README.txt');
                testPromise.test(promise.then(function() {
                    return project.loadResource(path, {
                        create : true
                    });
                }).then(function(resource) {
                    expect(resource).not.toEqual(null);
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
                var path = API.normalizeKey('README.txt');
                var resource = null;
                testPromise.test(promise.then(function() {
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