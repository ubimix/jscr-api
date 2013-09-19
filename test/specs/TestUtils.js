define([ 'underscore', 'step' ], function(_, Step) {

    function printTrace() {
//        console.log.apply(this, arguments);
    }
    
    function trace(name, f) {
        return function() {
            printTrace('[enter:' + name + ']');
            try {
                return f.apply(this, arguments);
            } finally {
                printTrace('[exit:' + name + ']');
            }
        }
    }

    function testSteps() {
        var finished = false;
        var list = [];
        _.each(arguments, function(f) {
            list.push(f);
        }) 
        list.push(trace('finish', function(err) {
            finished = true;
            if (err)
                throw err;
        }));
        Step.apply(null, list);
        waitsFor(function() {
            return finished;
        }, "Operations should be finished in the 750ms", 750);
    }

    return {
        trace : trace,

        testSteps : testSteps
    }
})
