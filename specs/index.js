require([], function() {
    require.config({
        paths : {
            'jquery' : '../libs/jquery/jquery',
            'q' : '../libs/q/q',
            'underscore' : '../libs/underscore/underscore-min',
            'jasmine' : '../libs/jasmine/lib/jasmine-core/jasmine',
            'jasminehtml' : '../libs/jasmine/lib/jasmine-core/jasmine-html',
            'jscr-api' : '../'
        },
        shim : {
            'underscore' : {
                exports : '_'
            },
            'jasmine' : {
                exports : 'jasmine'
            },
            'jasminehtml' : {
                deps : [ 'jasmine' ]
            }
        }
    });
    var specs = [ './test-api-classes', './test-impl-memory' ];
    require([ 'jasmine', 'jasminehtml' ], function(jasmine) {
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.updateInterval = 1000;
        var htmlReporter = new jasmine.HtmlReporter();
        jasmineEnv.addReporter(htmlReporter);
        jasmineEnv.specFilter = function(spec) {
            return htmlReporter.specFilter(spec);
        };
        require(specs, function() {
            jasmineEnv.execute();
        })
    });
});
