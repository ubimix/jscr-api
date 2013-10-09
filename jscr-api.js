/**
 * This module defines a set of classes and interfaces of the JavaScript Content
 * Repository API (JSCR API). All methods defined by interface classes perform
 * asynchronous calls and return promises for results.
 * 
 * This module uses the following libraries:
 * <ul>
 * <li>'underscore.js' - as the main toolbox for manipulation with JavaScript
 * objects</li>
 * <li>'q.js' - to implement promise-based APIs</li>
 * </ul>
 * 
 * @author kotelnikov
 */
"use strict"
if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([ 'underscore', 'q' ], function(_, Q) {

    /**
     * The main namespace for all JSCR types and methods.
     */
    var API = {};

    /**
     * Main namespace for various implementations of this API. Individual
     * implementations should add their classes in this object.
     */
    API.Implementation = {};

    /**
     * An utility method used to mark API 'abstract' methods as not implemented.
     * This method rises an exception.
     */
    API.notImplemented = function() {
        return new Error('Not implemented');
    }

    /* --------------------------------------------------------------------- */

    var typeCounter = 0;
    /**
     * This method creates a new class.
     */
    API.newClass = function() {
        // A new type definition.
        var Type = function() {
            if (this.initialize) {
                this.initialize.apply(this, arguments);
            }
        }
        // Unique identifier of a new created type
        Type.typeID = typeCounter++;
        // 'notImplemented' method associated with this class
        Type.prototype.notImplemented = function() {
            return Q().then(function() {
                throw API.notImplemented();
            })
        }
        // This method allows to extend classes with new properties and methods
        Type.extend = function() {
            var type = API.newClass.apply(this, arguments);
            return type;
        }
        // Copies all methods of this class to a newly created child class
        _.extend(Type.prototype, this.prototype);
        // Copies newly defined fields and methods in the new class
        _.each(arguments, function(fields) {
            _.extend(Type.prototype, fields);
        })
        // Returns the new type
        return Type;
    }

    /**
     * Makes a "deep" copy of the given object. It serializes/deserializes the
     * specified object to create a new copy.
     */
    API.copy = function(obj) {
        if (_.isNumber(obj) || _.isString(obj) || _.isBoolean(obj))
            return obj;
        if (!obj)
            return {};
        var clone = JSON.parse(JSON.stringify(obj));
        return clone;
    }

    /**
     * Normalizes the given key.
     */
    API.normalizeKey = function(key) {
        if (!key)
            return '';
        key = '' + key;
        key = key.replace(/[\\\/]+/g, '/');
        if (key.match(/^\//)) {
            key = key.substring(1);
        }
        if (key.match(/\/$/) && key.length > 1) {
            key = key.substring(0, key.length - 1);
        }
        return key;
    }
    /**
     * @deprecated use the #normalizeKey method instead
     */
    API.normalizePath = API.normalizeKey;

    /* -------------------------------------------------------------------- */
    /**
     * This is a version representation of an object. Each version object should
     * contain at least one field: 'timestamp'.
     */
    API.Version = API.newClass({

        /**
         * Initializes the internal fields of this object.
         */
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

        /**
         * Returns the timestamp of this object.
         */
        getTimestamp : function() {
            if (this.timestamp === undefined) {
                this.timestamp = this.newTimestamp();
            }
            return this.timestamp;
        },

        /**
         * Returns a version of this object.
         */
        getVersionId : function() {
            var versionId = this.versionId;
            if (!versionId) {
                versionId = '' + this.getTimestamp();
            }
            return versionId;
        },

        /**
         * Returns a new timestamp for this object.
         */
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

        /**
         * Returns string representation of this object.
         */
        toString : function() {
            return JSON.stringify(this);
        }
    });

    /**
     * An utility static method transforming the given object into a API.Version
     * instance
     */
    API.version = function(obj) {
        if (obj instanceof API.Version)
            return obj;
        return new API.Version(obj);
    }

    /* -------------------------------------------------------------------- */

    /**
     * Common interface for all resources managed by API.Project instances.
     */
    API.Resource = API.newClass({

        /**
         * Initializes this object.
         */
        initialize : function(options) {
            options = options || {};
            _.each(options, function(value, key) {
                this[key] = API.copy(value);
            }, this);
            this.getSystemProperties();
            this.getProperties();
        },

        /**
         * Returns a new copy of this resource.
         */
        getCopy : function() {
            return API.resource(this, true);
        },

        /**
         * Returns the version info defining the creation time of this resource.
         */
        getCreated : function() {
            var v = this._getVersion('created');
            return v;
        },

        /**
         * Returns the version info defining modification time of this resource.
         */
        getUpdated : function() {
            var v = this._getVersion('updated');
            if (!v) {
                v = this.getCreated();
            }
            return v;
        },

        /**
         * Returns a list of all property families of this resource. The
         * resulting list should contain at least two values 'sys' and
         * 'properties'.
         */
        getPropertyFamilies : function() {
            return _.keys(this);
        },

        /**
         * Returns a 'family' of properties with the specified name. A property
         * family is a top-level fields of the resource class. Some
         * implementations could restrict the number of family fields. At least
         * two family fields are expected from all implementations:
         * <ul>
         * <li>sys - system properties; most of the fields in the family are
         * managed automatically by the underlying implementation and can not be
         * directly changed by end users. This family of properties is returned
         * by the 'getSystemProperties' method.</li>
         * <li>properties - custom user-defined properties; properties from
         * this family could be changed directly. This family of properties is
         * returned by the 'getProperties' method.</li>
         * </ul>
         * 
         * @param familyName
         *            the name of the family to return
         * @param create
         *            if this flag is <code>true</code> and the requested
         *            family does not exist yet then this method creates a new
         *            family with this name.
         * 
         */
        getPropertyFamily : function(familyName, create) {
            var result = this[familyName];
            if (!result && create) {
                result = this[familyName] = {};
            }
            return result;
        },

        /**
         * Returns system properties.
         */
        getSystemProperties : function() {
            return this.getPropertyFamily('sys', true);
        },

        /**
         * Returns user-defined resource properties.
         */
        getProperties : function() {
            return this.getPropertyFamily('properties', true);
        },

        /**
         * Returns the path to this resource.
         * 
         * @deprecated use the #getKey method instead
         */
        getPath : function() {
            return this.getKey();
        },

        /**
         * Returns the key of this resource.
         */
        getKey : function() {
            var sys = this.getSystemProperties();
            return sys.path;
        },

        /**
         * Sets a new path to this resource.
         * 
         * @deprecated use the #setKey method instead
         */
        setPath : function(path) {
            this.setKey(path);
        },

        /**
         * Sets/updates the key of this resource.
         */
        setKey : function(key) {
            var sys = this.getSystemProperties();
            sys.path = API.normalizeKey(key);
        },

        /**
         * Returns a version object corresponding to the specified key.
         */
        _getVersion : function(key) {
            var sys = this.getSystemProperties();
            var version = sys[key];
            return version;
        },

        /**
         * Updates version of this resource.
         */
        updateVersion : function(version) {
            var sys = this.getSystemProperties();
            if (!sys.created) {
                sys.created = version;
            }
            sys.updated = version;
        },

        /**
         * Returns string representation of this object.
         */
        toString : function() {
            return JSON.stringify(this);
        }

    });

    /**
     * Transforms the given object into a API.Resource instance.
     */
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
         */
        connect : function() {
            return this.notImplemented.apply(this, arguments);
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
         * @param options
         *            options object
         */
        loadProjects : function(options) {
            return this.notImplemented.apply(this, arguments);
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
         */
        loadProject : function(projectKey, options) {
            return this.notImplemented.apply(this, arguments);
        },

        /**
         * Removes a project corresponding to the specified key.
         * 
         * @param projectkey
         *            the key of the project to return
         * @param options
         *            options object
         */
        deleteProject : function(projectKey, options) {
            return this.notImplemented.apply(this, arguments);
        }

    });

    /* -------------------------------------------------------------------- */

    /**
     * Individual project giving access to resources.
     */
    API.Project = API.newClass({

        /**
         * Returns the key of the project.
         */
        getProjectKey : function() {
            throw API.notImplemented();
        },

        /**
         * Loads a resource corresponding to the specified key. If there is no
         * such a resource an the given options object contains the 'create'
         * field set to <code>true</code> then a new resource is created.
         * 
         * @param key
         *            the key of the resource to load
         */
        loadResource : function(key, options) {
            return this.notImplemented.apply(this, arguments);
        },

        /**
         * This method loads or create a set of resources corresponding to the
         * specified keys. If the specified 'options' object contains the
         * "create":"true" flag then resources are automatically created if they
         * does not exist yet. The returned map contains keys as keys and the
         * corresponding resources as values.
         * 
         * @param keyList
         *            a list of keys
         * @param options
         *            an object containing loading options (depends on
         *            implementation)
         */
        loadResources : function(keyList, options) {
            return this.notImplemented.apply(this, arguments);
        },

        /**
         * Loads a map of all resources with the key starting with the specified
         * prefix. The returned map contains keys with the corresponding
         * resources instances.
         * 
         * @param keyList
         *            a list of keys
         * @param options
         *            an object containing search options (depends on
         *            implementation)
         */
        loadChildResources : function(key, options) {
            return this.notImplemented.apply(this, arguments);
        },

        /**
         * Removes a resource corresponding to the specified key from the
         * underlying storage. This method returns <code>true</code> if the
         * resource was removed and <code>false</code> if there is no such
         * resource.
         * 
         * @param key
         *            the key of the resource to remove
         * @param options
         *            implementation-specific options
         */
        deleteResource : function(key, options) {
            return this.notImplemented.apply(this, arguments);
        },

        /**
         * Stores and returns a new version of the specified resource (with
         * updated version/timestamp etc).
         * 
         * @param resource
         *            the resource to store
         * @param options
         *            implementation-specific options
         */
        storeResource : function(resource, options) {
            return this.notImplemented.apply(this, arguments);
        },

        // ----------------------------------------------
        // History management

        /**
         * Loads all resource keys with the specified range of versions. This
         * method returns a list of API.Version instances containing 'keys'
         * fields with a list resource key modified at this version.
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
         *          keys: ['/README.txt', '/about/team.md']
         *      },
         *      {
         *          version : 9,
         *          timestamp: 123456750,
         *          keys: ['/doc/help.md']
         *      },
         *      {
         *          version : 8,
         *          timestamp: 123456607,
         *          keys: ['/product.md', '/services.md']
         *      }
         *  ...
         * ]
         * </pre>
         * 
         * @param options
         *            object containing search options; 'from' - the oldest
         *            modification version identifier; 'to' - the most recent
         *            searched version
         */
        loadModifiedResources : function(options) {
            return this.notImplemented.apply(this, arguments);
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
         * @param key
         *            the key of the resource to load
         * @param options
         *            object containing search options; 'from' - the oldest
         *            modification version identifier; 'to' - the most recent
         *            searched version
         */
        loadResourceRevisions : function(key, options) {
            return this.notImplemented.apply(this, arguments);
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
         * @param key
         *            the key of the resource to load
         * @param options
         *            object containing search options; 'from' - the oldest
         *            modification version identifier; 'to' - the most recent
         *            searched version
         */
        loadResourceHistory : function(key, options) {
            return this.notImplemented.apply(this, arguments);
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
         */
        // query : { term : 'Hello', sortBy : 'properties.label', order : 'asc'
        // }
        searchResources : function(query) {
            return this.notImplemented.apply(this, arguments);
            // ResultSet is an object with the following fields:
            // - totalNumber - number of found resources
            // resultSet.loadNext(function(err, result) {
            // // result has the following fields:
            // // - hasNext - true/false
            // // - resources is an array of resources
            //                
            // })
        }

    });

    return API;
})
