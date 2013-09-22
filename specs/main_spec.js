"use strict"
require.config({
    paths : {
        'jscr-api' : '../source',
        'jasmine' : '../libs/jasmine/lib/jasmine-core/jasmine'
    }
});
require('./test-api-classes');
require('./test-impl-memory');
