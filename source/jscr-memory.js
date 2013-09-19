"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([ 'underscore', './jscr-api' ], function(_, API) {

    /* ----------------------------------------------------------------------- */
    var Impl = API.Implementation.Memory = {};

    Impl.WorkspaceConnection = API.WorkspaceConnection.extend({
        connect : function(callback) {
            if (!this.workspace) {
                this.workspace = this.newWorkspace();
            }
            callback(null, this.workspace);
        },
        newWorkspace : function() {
            return new Impl.Workspace();
        }
    });

    Impl.Workspace = API.Workspace.extend({
        initialize : function() {
            this.projects = {};
        },
        loadProject : function(projectKey, options, callback) {
            projectKey = API.normalizePath(projectKey);
            var project = this.projects[projectKey];
            if (!project && options.create) {
                project = this.newProject({
                    key : projectKey
                });
                this.projects[projectKey] = project;
            }
            callback(null, project);
        },
        loadProjects : function(callback) {
            callback(null, this.projects);
        },
        deleteProject : function(projectKey, options, callback) {
            projectKey = API.normalizePath(projectKey);
            var project = this.projects[projectKey];
            var result = project != null;
            delete this.projects[projectKey];
            callback(null, result);
        },
        newProject : function(options) {
            return new Impl.Project(options);
        }
    });

    Impl.Project = API.Project.extend({
        initialize : function(options) {
            this.versionCounter = 0;
            this.resources = {};
        },
        getResourceHistory : function(path, create) {
            var history = this.resources[path];
            if (!history && create) {
                history = [];
                this.resources[path] = history;
            }
            return history;
        },
        getResource : function(path, options) {
            options = options || {};
            path = API.normalizePath(path);
            var history = this.getResourceHistory(path, options.create);
            var resource = null;
            if (history) {
                if (history.length == 0) {
                    resource = this.newResource(path, options);
                    history.push(resource);
                } else {
                    resource = history[history.length - 1];
                }
            }
            if (resource) {
                resource = resource.getCopy();
            }
            return resource;
        },
        getProjectVersion : function(inc) {
            if (!this.version || inc) {
                this.version = API.version({
                    timestamp : new Date().getTime(),
                    versionId : '' + (this.versionCounter++)
                });
            }
            return this.version;
        },
        // TODO: options parameter not used ?
        newResource : function(path, options) {
            var resource = API.resource();
            resource.setPath(path);
            var version = this.getProjectVersion();
            resource.updateVersion(version);
            return resource;
        },
        /* ---------------------------------------------------------------- */
        // Public methods
        loadResource : function(path, options, callback) {
            var resource = this.getResource(path, options, callback);
            callback(null, resource);
        },
        // 'resources' is a map of paths and the corresponding resources
        loadResources : function(pathList, options, callback) {
            var list = [];
            _.each(pathList, function(path) {
                var resource = this.getResource(path, options);
                list.push(resource);
            }, this);
            callback(null, list);
        },

        loadChildResources : function(path, options, callback) {
            var path = API.normalizePath(path);
            var result = {};
            _.each(this.resources, function(history, resourcePath) {
                if (resourcePath.indexOf(path) == 0 && (path != resourcePath)) {
                    var str = resourcePath.substring(path.length);
                    if (str.indexOf('/') <= 0) {
                        var resourceObj = this.getResource(resourcePath);
                        result[resourcePath] = resourceObj;
                    }
                }
            }, this);
            callback(null, result);
        },
        // Result: true/false
        deleteResource : function(path, options, callback) {
            var path = API.normalizePath(path);
            var resource = this.resources[path];
            delete this.resources[path];
            var result = resource != null;
            callback(null, result);
        },

        storeResource : function(resource, options, callback) {
            resource = API.resource(resource);
            var path = resource.getPath();
            var history = this.getResourceHistory(path, true);
            var version = this.getProjectVersion(true);
            resource.updateVersion(version);
            history.push(resource);
            callback(null, resource);
        },

        // ----------------------------------------------
        // History management

        // { from : '123215', to : '1888888', order : 'asc' }
        loadModifiedResources : function(options, callback) {
            var from = API.version(options.from || 0);
            var to = API.version(options.to);
            var result = {};
            _.each(this.resources, function(history) {
                var resource = _.find(history.reverse(), function(revision) {
                    var version = revision.getUpdated();
                    return version.inRange(from, to);
                }, this);
                if (resource) {
                    var path = resource.getPath();
                    result[path] = resource;
                }
            }, this);
            callback(null, result);
        },
        loadResourceHistory : function(path, options, callback) {
            var from = API.version(options.from || 0);
            var to = API.version(options.to);
            path = API.normalizePath(path);
            var result = [];
            var history = this.getResourceHistory(path, false);
            if (history) {
                _.each(history, function(revision) {
                    var version = revision.getUpdated();
                    if (version.inRange(from, to)) {
                        result.push(version);
                    }
                });
            }
            callback(null, result);
        },
        loadResourceRevisions : function(path, options, callback) {
            var versions = {};
            var timestamps = {};
            var versions = options.versions || [];
            _.each(versions, function(v) {
                v = API.version(v);
                var versionId = v.getVersionId();
                var timestamp = v.getTimestamp();
                versions[versionId] = v;
                timestamps[timestamp] = v;
            });

            path = API.normalizePath(path);
            var result = [];
            var history = this.getResourceHistory(path, false);
            if (history) {
                _.each(history, function(revision) {
                    var version = revision.getUpdated();
                    var versionId = version.getVersionId();
                    var timestamp = version.getTimestamp();
                    if (versions[versionId] || timestamps[timestamp]) {
                        result.push(revision);
                    }
                }, this);
            }
            callback(null, result);
        },

        // ----------------------------------------------
        // Search

        // query : { term : 'Hello', sortBy : 'properties.label', order : 'asc'
        // }
        searchResources : function(query, callback) {
            this.notImplemented.apply(this, arguments);

            // ResultSet is an object with the following fields:
            // - totalNumber - number of found resources
            // resultSet.loadNext(function(err, result){
            // // result has the following fields:
            // // - hasNext - true/false
            // // - resources is an array of resources
            //                
            // })
        }

    });

    return API;
});
