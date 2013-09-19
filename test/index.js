require([], function() {
    require.config({
        paths : {
            'jquery' : './libs/jquery/jquery',
            'step' : './libs/step/step',
            'text' : './libs/require/text',
            'underscore' : './libs/underscore/underscore-min',
            'jasmine' : './jasmine/jasmine',
            'jasminehtml' : './jasmine/jasmine-html',
            'jscr-api' : '../source/jscr-api',
            'jscr-memory' : '../source/jscr-memory'
        },
        shim : {
            'underscore' : {
                exports : '_'
            },
            'step' : {
                exports : 'Step'
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
