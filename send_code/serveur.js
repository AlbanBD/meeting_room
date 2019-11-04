var express = require("express");
var myParser = require("body-parser");
var app = express();

app.use(myParser.urlencoded({extended : true}));
app.post("/confirmation", function(request, response) {
    var rec = request.body;
    console.log(rec);
});

app.listen(8080);
console.log("Server running");