(function() {
    var express = require("express");
    var app = express();
    var port = 3700;

    app.configure(function() {
        app.use(function(req, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            return next();
        });
        var rootDir = __dirname + '/../';
        console.log(rootDir)
        app.use(express.static(rootDir));
    });

    app.listen(port);
    console.log("http://127.0.0.1:" + port + '/test/');
})(this);