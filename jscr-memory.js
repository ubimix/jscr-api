"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([ 'underscore', 'q', './jscr-api' ], function(_, Q, API) {

    /* ----------------------------------------------------------------------- */
    var Impl = API.Implementation.Memory = {};

    Impl.WorkspaceConnection = API.WorkspaceConnection.extend({
        connect : function() {
            if (!this.workspace) {
                this.workspace = this.newWorkspace();
            }
            return Q(this.workspace);
        },
        newWorkspace : function() {
            return new Impl.Workspace();
        }
    });

    Impl.Workspace = API.Workspace.extend({
        initialize : function() {
            this.projects = {};
        },
        loadProject : function(projectKey, options) {
            projectKey = API.normalizeKey(projectKey);
            var project = this.projects[projectKey];
            if (!project && options.create) {
                project = this.newProject({
                    key : projectKey
                });
                this.projects[projectKey] = project;
            }
            return Q(project);
        },
        loadProjects : function() {
            return Q(this.projects);
        },
        deleteProject : function(projectKey, options) {
            projectKey = API.normalizeKey(projectKey);
            var project = this.projects[projectKey];
            var result = project != null;
            delete this.projects[projectKey];
            return Q(result);
        },
        newProject : function(options) {
            return new Impl.Project(options);
        }
    });

    Impl.Project = API.Project.extend({
        initialize : function(options) {
            this.options = options || {};
            this.versionCounter = 0;
            this.resources = {};
        },
        getProjectKey : function() {
            return API.normalizeKey(this.options.key);
        },
        getResourceHistory : function(key, create) {
            key = API.normalizeKey(key);
            var history = this.resources[key];
            if (!history && create) {
                history = [];
                this.resources[key] = history;
            }
            return history;
        },
        getResource : function(key, options) {
            options = options || {};
            key = API.normalizeKey(key);
            if (options.create) {
                var list = key.split('/');
                list.pop();
                if (list.length) {
                    this.getResource(list.join('/'), options);
                }
            }

            var history = this.getResourceHistory(key, options.create);
            var resource = null;
            if (history) {
                if (history.length == 0) {
                    resource = this.newResource(key, options);
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
        newResource : function(key, options) {
            var resource = API.resource();
            resource.setKey(key);
            var version = this.getProjectVersion();
            resource.updateVersion(version);
            return resource;
        },
        /* ---------------------------------------------------------------- */
        // Public methods
        loadResource : function(key, options) {
            var resource = this.getResource(key, options);
            return Q(resource);
        },
        // 'resources' is a map of keys and the corresponding resources
        loadResources : function(keyList, options) {
            var result = {};
            _.each(keyList, function(key) {
                var resource = this.getResource(key, options);
                var resourceKey = resource.getKey();
                result[resourceKey] = resource;
            }, this);
            return Q(result);
        },

        loadChildResources : function(key, options) {
            var key = API.normalizeKey(key);
            var result = {};
            _.each(this.resources, function(history, resourceKey) {
                if (resourceKey.indexOf(key) == 0 && (key != resourceKey)) {
                    var str = resourceKey.substring(key.length);
                    if (str.indexOf('/') <= 0) {
                        var resourceObj = this.getResource(resourceKey);
                        if (resourceObj) {
                            var resourceKey = resourceObj.getKey();
                            result[resourceKey] = resourceObj;
                        }
                    }
                }
            }, this);
            return Q(result);
        },
        // Result: true/false
        deleteResource : function(key, options) {
            key = API.normalizeKey(key);
            var resource = this.resources[key];
            delete this.resources[key];
            var result = resource != null;
            return Q(result);
        },

        storeResource : function(resource, options) {
            resource = API.resource(resource);
            var key = resource.getKey();
            var history = this.getResourceHistory(key, true);
            var version = this.getProjectVersion(true);
            resource.updateVersion(version);
            history.push(resource);
            return Q(resource);
        },

        // ----------------------------------------------
        // History management

        // { from : '123215', to : '1888888', order : 'asc' }
        loadModifiedResources : function(options) {
            var from = API.version(options.from || 0);
            var to = API.version(options.to);
            var result = {};
            _.each(this.resources, function(history) {
                var resource = _.find(history.reverse(), function(revision) {
                    var version = revision.getUpdated();
                    return version.inRange(from, to);
                }, this);
                if (resource) {
                    var key = resource.getKey();
                    result[key] = resource;
                }
            }, this);
            return Q(result);
        },
        loadResourceHistory : function(key, options) {
            options = options || {};
            var from = API.version(options.from || 0);
            var to = API.version(options.to);
            key = API.normalizeKey(key);
            var result = [];
            var history = this.getResourceHistory(key, false);
            if (history) {
                _.each(history, function(revision) {
                    var version = revision.getUpdated();
                    if (version.inRange(from, to)) {
                        result.push(version);
                    }
                });
            }
            return Q(result);
        },
        loadResourceRevisions : function(key, options) {
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

            key = API.normalizeKey(key);
            var result = [];
            var history = this.getResourceHistory(key, false);
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
            return Q(result);
        },

        // ----------------------------------------------
        // Search

        // query : { term : 'Hello', sortBy : 'properties.label', order : 'asc'
        // }
        searchResources : function(query) {
            return this.notImplemented.apply(this, arguments);

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
