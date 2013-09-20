require([], function() {
    require.config({
        paths : {
            'jquery' : './libs/jquery/jquery',
            'q' : './libs/q/q',
            'underscore' : './libs/underscore/underscore-min',
            'jasmine' : './libs/jasmine/lib/jasmine-core/jasmine',
            'jasminehtml' : './libs/jasmine/lib/jasmine-core/jasmine-html',
            'jscr-api' : '../source/jscr-api',
            'jscr-memory' : '../source/jscr-memory'
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
    var specs = [ './specs/ApiTest', './specs/MemoryApiTest' ];

    require([ 'jasmine', 'jasminehtml' ].concat(specs), function(jasmineEnv) {
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.updateInterval = 1000;
        var htmlReporter = new jasmine.HtmlReporter();
        jasmineEnv.addReporter(htmlReporter);
        jasmineEnv.specFilter = function(spec) {
            return htmlReporter.specFilter(spec);
        };
        jasmineEnv.execute();
    });
});
