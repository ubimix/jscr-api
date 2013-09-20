"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([ 'underscore' ], function(_) {

    var API = {};
    API.Implementation = {};

    /* --------------------------------------------------------------------- */

    var typeCounter = 0;
    /** This method creates a new class */
    API.newClass = function() {
        var Type = function() {
            if (this.initialize) {
                this.initialize.apply(this, arguments);
            }
        }
        Type.typeID = typeCounter++;
        Type.prototype.notImplemented = function() {
            var pos = arguments.length - 1;
            var callback = pos >= 0 ? arguments[pos] : 0;
            var err = new Error('Not implemented');
            if (_.isFunction(callback)) {
                callback.call(this, err);
            } else {
                throw err;
            }
        }
        Type.extend = function() {
            var type = API.newClass.apply(this, arguments);
            return type;
        }
        _.extend(Type.prototype, this.prototype);
        _.each(arguments, function(fields) {
            _.extend(Type.prototype, fields);
        })
        return Type;
    }

    /** Makes a "deep" copy of the given object. */
    API.copy = function(obj) {
        if (_.isNumber(obj) || _.isString(obj) || _.isBoolean(obj))
            return obj;
        if (!obj)
            return {};
        var clone = JSON.parse(JSON.stringify(obj));
        return clone;
    }

    /** Normalizes the given path */
    API.normalizePath = function(path) {
        if (!path)
            return '/';
        path = '' + path;
        if (!path.match(/^\//)) {
            path = '/' + path;
        }
        if (path.match(/\/$/) && path.length > 1) {
            path = path.substring(0, path.length - 1);
        }
        return path;
    }

    /* -------------------------------------------------------------------- */
    /**
     * This is a version representation of an object. Each version object should
     * contain at least one field: 'timestamp'.
     */
    API.Version = API.newClass({

        /** Initializes the internal fields of this object */
        initialize : function(options) {
            if (_.isNumber(options) || _.isString(options)) {
                this.timestamp = options;
            } else {
                options = options || {};
                _.each(options, function(val, key) {
                    this[key] = API.copy(val);
                }, this)
            }
        },

        /** Returns the timestamp of this object. */
        getTimestamp : function() {
            if (this.timestamp === undefined) {
                this.timestamp = this.newTimestamp();
            }
            return this.timestamp;
        },

        /** Returns a version of this object */
        getVersionId : function() {
            var versionId = this.versionId;
            if (!versionId) {
                versionId = '' + this.getTimestamp();
            }
            return versionId;
        },

        /** Returns a new timestamp for this object */
        newTimestamp : function() {
            return new Date().getTime();
        },

        /**
         * Compares this version with the specified object and returns one of
         * these values 1, 0 or -1 depending if this version is bigger, equal or
         * less than the specified version.
         */
        compareTo : function(version) {
            var a = this.getTimestamp();
            var b = version.getTimestamp();
            if (!a || !b) {
                a = this.getVersionId();
                b = version.getVersionId();
            }
            return a > b ? 1 : a < b ? -1 : 0;
        },

        /**
         * Returns <code>true</code> if this version is in the specified
         * revision range.
         */
        inRange : function(from, to) {
            var a = this.compareTo(from);
            var b = this.compareTo(to);
            return a >= 0 && b <= 0;
        },

        /** Returns string representation of this object */
        toString : function() {
            return JSON.stringify(this);
        }
    });

    /** Transforms the given object into a API.Version instance */
    API.version = function(obj) {
        if (obj instanceof API.Version)
            return obj;
        return new API.Version(obj);
    }

    /* -------------------------------------------------------------------- */

    /** Common interface for all resources managed by API.Project instances */
    API.Resource = API.newClass({
        /** Initializes this object */
        initialize : function(options) {
            options = options || {};
            _.each(options, function(value, key) {
                this[key] = value;
            })
        },
        /** Returns a new copy of this resource */
        getCopy : function() {
            return API.resource(this, true);
        },
        /** Returns the version info defining the creation time of this resource */
        getCreated : function() {
            var v = this._getVersion('created');
            return v;
        },
        /** Returns the version info defining modification time of this resource */
        getUpdated : function() {
            var v = this._getVersion('updated');
            return v;
        },
        /** Returns system properties */
        getSystemProperties : function() {
            return this.sys;
        },
        /** Returns user-defined properties. */
        getProperties : function() {
            return this.properties;
        },
        /** Returns the path to this resource */
        getPath : function() {
            return this.sys.path;
        },
        /** Sets/updates path of this resource */
        setPath : function(path) {
            this.sys.path = API.normalizePath(path);
        },
        /** Returns a version object corresponding to the specified key */
        _getVersion : function(key) {
            var version = this.sys[key];
            return version;
        },
        /** Updates version of this resource */
        updateVersion : function(version) {
            var sys = this.sys;
            if (!this.sys.created) {
                this.sys.created = version;
            }
            this.sys.updated = version;
        },

        /** Returns string representation of this object */
        toString : function() {
            return JSON.stringify(this);
        }
    });
    /** Transforms the given object into a API.Resource instance */
    API.resource = function(obj, copy) {
        if (!copy && (obj instanceof API.Resource))
            return obj;
        return new API.Resource(obj);
    }

    /* --------------------------------------------------------------------- */

    /**
     * Workspace connection giving access to workspaces. It is the main access
     * point for workspaces - to get a workspaces instance clients have to
     * instantiate and open the corresponding connection.
     */
    API.WorkspaceConnection = API.newClass({
        /**
         * Connects to the underlying workspace and returns the workspace
         * instance.
         * 
         * @param callback
         *            the callback function accepting results of this operation
         * 
         */
        connect : function(callback) {
            this.notImplemented.apply(this, arguments);
        }
    })

    /* -------------------------------------------------------------------- */
    /**
     * Workspace give access to all projects available for the current client.
     */
    API.Workspace = API.newClass({

        /**
         * Loads all projects from this workspace. Returns a {key: project} map.
         * 
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadProjects : function(callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Returns a project corresponding to the specified key. If the project
         * does not exist and the given 'options' parameter has a 'create' flag
         * set to 'true' then a new project is created and returned.
         * 
         * @param projectkey
         *            the key of the project to return
         * @param options
         *            if this option object contains create=true flag then a new
         *            project is automatically created if it does not exist yet
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadProject : function(projectKey, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Removes a project corresponding to the specified key.
         * 
         * @param projectkey
         *            the key of the project to return
         * @param options
         *            options object
         * @param callback
         *            the callback function accepting results of this operation
         */
        deleteProject : function(projectKey, options, callback) {
            this.notImplemented.apply(this, arguments);
        }
    });

    /* -------------------------------------------------------------------- */

    /** Individual project giving access to resources. */
    API.Project = API.newClass({

        /**
         * Loads a resource corresponding to the specified path. If there is no
         * such a resource an the given options object contains the 'create'
         * field set to <code>true</code> then a new resource is created.
         * 
         * @param path
         *            the path of the resource to load
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadResource : function(path, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * This method loads or create a set of resources corresponding to the
         * specified paths. If the specified 'options' object contains the
         * "create":"true" flag then resources are automatically created if they
         * does not exist yet. The returned map contains paths as keys and the
         * corresponding resources as values.
         * 
         * @param pathList
         *            a list of path prefixes
         * @param options
         *            an object containing loading options (depends on
         *            implementation)
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadResources : function(pathList, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Loads a map of all resources with the path starting with the
         * specified prefix. The returned map contains paths as keys and the
         * corresponding resources as values.
         * 
         * @param pathList
         *            a list of path prefixes
         * @param options
         *            an object containing search options (depends on
         *            implementation)
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadChildResources : function(path, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Removes a resource corresponding to the specified path from the
         * underlying storage. This method returns <code>true</code> if the
         * resource was removed and <code>false</code> if there is no such
         * resource.
         * 
         * @param path
         *            the path of the resource to remove
         * @param options
         *            implementation-specific options
         * @param callback
         *            the callback function accepting results of this operation
         */
        deleteResource : function(path, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Stores and returns a new version of the specified resource (with
         * updated version/timestamp etc).
         * 
         * @param resource
         *            the resource to store
         * @param options
         *            implementation-specific options
         * @param callback
         *            the callback function accepting results of this operation
         */
        storeResource : function(resource, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        // ----------------------------------------------
        // History management

        /**
         * Loads all resource path with the specified range of versions. This
         * method returns a list of API.Version instances containing 'paths'
         * fields with a list resource path modified at this version.
         * 
         * <pre>
         * Request options: 
         * {
         *      from: { timestamp: 1234500000 },
         *      to: { timestamp :  1234600000 }
         * }
         * </pre>
         * 
         * <pre>
         * Response: 
         * [
         *      {
         *          version : 10,
         *          timestamp: 123456789,
         *          paths: ['/README.txt', '/about/team.md']
         *      },
         *      {
         *          version : 9,
         *          timestamp: 123456750,
         *          paths: ['/doc/help.md']
         *      },
         *      {
         *          version : 8,
         *          timestamp: 123456607,
         *          paths: ['/product.md', '/services.md']
         *      }
         *  ...
         * ]
         * </pre>
         * 
         * @param options
         *            object containing search options; 'from' - the oldest
         *            modification version identifier; 'to' - the most recent
         *            searched version
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadModifiedResources : function(options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Loads resource revisions corresponding to the specified versions.
         * This method returns an ordered list of resource versions. To load
         * just one version the initial and final revisions should be the same.
         * 
         * <pre>
         * Request options: 
         * {
         *      versions: [
         *          { timestamp: 1234505432 },
         *          { timestamp: 1234567891 },
         *          { version: 8 },
         *          ...
         *     ]
         * }
         * </pre>
         * 
         * <pre>
         * Results:
         * [
         *      {
         *          sys: {
         *              updated: { version : 9, timestamp: 1234505432, ... },
         *              ... 
         *          },
         *          properties: {
         *              label: 'About the project',
         *              ... 
         *          }
         *          ...
         *      },
         *      {
         *          sys: {
         *              updated: { version : 10, timestamp: 1234567891, ... },
         *              ... 
         *          },
         *          ...
         *      }
         *  ...
         * ]
         * </pre>
         * 
         * @param path
         *            the path of the resource to load
         * @param options
         *            object containing search options; 'from' - the oldest
         *            modification version identifier; 'to' - the most recent
         *            searched version
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadResourceRevisions : function(path, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        /**
         * Loads all available resource versions (API.Version instances) from
         * the specified version range. If the version range is not defined then
         * this method should return all resource versions.
         * 
         * <pre>
         * Request options: 
         * {
         *      from: { timestamp: 1234500000 },
         *      to: { timestamp :  1234600000 }
         * }
         * </pre>
         * 
         * <pre>
         * Response: 
         * [
         *      { version : 3, timestamp: 1234505432, ... },
         *      { version : 10, timestamp: 123456789, ... },
         *      ...
         * ]
         * </pre>
         * 
         * @param path
         *            the path of the resource to load
         * @param options
         *            object containing search options; 'from' - the oldest
         *            modification version identifier; 'to' - the most recent
         *            searched version
         * @param callback
         *            the callback function accepting results of this operation
         */
        loadResourceHistory : function(path, options, callback) {
            this.notImplemented.apply(this, arguments);
        },

        // ----------------------------------------------
        // Search

        /**
         * Searches objects and returns a result object with the following
         * fields: 'total' with the total number of found results and 'hits' -
         * list of found resources. Each hit can have a '_source' field
         * referencing the found resource. Exact search syntax depends on the
         * underlying storage and search engine implementation.
         * 
         * <pre>
         * Query:
         * {
         *     'query_string' : {
         *         'query' : 'this AND that OR thus',
         *         'fields' : [ 'content', 'name' ]
         *     }
         * }
         * </pre>
         * 
         * <pre>
         * Results: 
         * {
         *      'total': 30,
         *      'hits': [
         *          { ... 
         *              '_source' : { ... content of the resource ... }
         *            ...  
         *          },
         *          { ... 
         *              '_source' : { ... content of the resource ... }
         *            ...  
         *          },
         *      ]
         * }
         * </pre>
         * 
         * These structures are grabbed from the ElasticSearch specification -
         * http://www.elasticsearch.org/guide/
         * 
         * @param query
         *            a query object
         * @param callback
         *            the callback function accepting results of this operation
         */
        // query : { term : 'Hello', sortBy : 'properties.label', order : 'asc'
        // }
        searchResources : function(query, callback) {
            this.notImplemented.apply(this, arguments);
            // ResultSet is an object with the following fields:
            // - totalNumber - number of found resources
            // resultSet.loadNext(function(err, result) {
            // // result has the following fields:
            // // - hasNext - true/false
            // // - resources is an array of resources
            //                
            // })
        }

    // ----------------------------------------------
    // Lock/unlock

    // // options: { force : true, prevLock : lock }
    // lockResource : function(path, options, callback) {
    // this.notImplemented.apply(this, arguments);
    // // 'lock' is an object with the following fields:
    // // - id: 'idLock'
    // // - expireTime: 123435
    // // - path : 'path/to/res1'
    // // - userId: 'JohnSmithId'
    // },
    //
    // // 'lock' is an object defining the max timeout of the lock
    // unlockResource : function(path, lock, callback) {
    // this.notImplemented.apply(this, arguments);
    // }

    });

    return API;
})
