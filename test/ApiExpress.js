var _ = require('underscore');
var Step = require('step');
var express = require('express');
var path = require('path');
var http = require('http');

var api = require('./Api');
var config = require('./ApiConfig');

module.ApiExpress = function(app, impl) {
    function callApi(resp, method) {
        var args = [];
        for ( var i = 2; i < arguments.length - 1; i++) {
            args.push(arguments[i]);
        }
        args.push(function(err, result) {
            var response = {
                err : err,
                data : result
            }
            res.json(response);
        });
        impl[method].call(impl, args)
    }

    var adapter = {

        loadProject : function(req, res) {
            // getWorkspace
            // workspace.loadProject (req.projectKey, options, callback)
        },
        deleteProject : function(req, res) {
            // getWorkspace
            // workspace.deleteProject (req.projectKey, options, callback)
        },

        // Individual project resources
        loadResource : function(req, res) {
            // Get workspace
            // Get project
            // project.loadResource(path, options, callback);
        },

        loadResources : function(req, res) {
            // Get workspace
            // Get project
            // Split the full path to individual paths
            // project.loadResources(pathList, options, callback);
        },

        loadChildResources : function(req, res) {
            // Get workspace
            // Get project
            // project.loadChildResources(path, options, callback);
        },
        deleteResource : function(req, res) {
            // Get workspace
            // Get project
            // project.deleteResource(path, options, callback);
        },

        storeResource : function(req, res) {
            // Get workspace
            // Get project
            // project.storeResource(path, options, callback);
        },

        // History management
        loadModifiedResources : function(req, res) {
            // Get workspace
            // Get project
            // project.loadModifiedResources(options, callback);
        },

        // Returns a list of all resource version numbers in the specified
        // range
        loadResourceHistory : function(req, res) {
            // Get workspace
            // Get project
            // project.loadResourceHistory(path, options, callback);
        },

        // Loads resource revisions (content) for the specified version
        // numbers
        loadResourceRevisions : function(req, res) {
            // Get workspace
            // Get project
            // project.loadResourceRevisions(path, options, callback);
        },

        // Search
        searchResources : function(req, res) {

        }

    }
    // Project management
    app.get('/:workspace/', function(req, res) {
        Step(function () {
            loadWorkspace(req.param.workspace, this);
        },
        function( err, workspace) {
        })
        var workspace = req.params.workspace;
        callApi('loadProjects', res, workspace, {});
    });
    app.get('/:workspace/:project', function(req, res) {
        Step(function loadProject() {
            
        },
        function getProjectInfo(err, project) {
            callApi('loadProject', res, req.query);
        },
        var workspace = req.params.workspace;
        callApi('loadProjects', res, workspace, {});
    });
    app.get('/:workspace/:project/', adapter.loadProject);
    app.del('/:workspace/:project', adapter.deleteProject);
    app.del('/:workspace/:project/', adapter.deleteProject);

    // All resources modified in the specified range of dates/revisions
    app.get('/:workspace/:project/revisions/from/:fromRevision/to/:toRevision',
            adapter.loadModifiedResources);
    // Resource revision numbers in the specified range of dates
    app
            .get(
                    '/:workspace/:project/*resource/history/from/:fromRevision/to/:toRevision',
                    adapter.loadResourceHistory);
    // Resource revisions by specified revisions
    app.get('/:workspace/:project/*resource/revisions/:versions',
            adapter.loadResourceRevisions);

    // Resource management
    app.get('/:workspace/:project/resources/*resourceList',
            adapter.loadResources);
    app.get('/:workspace/:project/*resource/children',
            adapter.loadChildResources);
    app.get('/:workspace/:project/*resource', adapter.loadResource);
    app.del('/:workspace/:project/*resource', adapter.deleteResource);
    app.put('/:workspace/:project/*resource', adapter.storeResource);
    app.post('/:workspace/:project/*resource', adapter.storeResource);

    app.get('/:workspace/:project/search', adapter.adapter.searchResources);

}
