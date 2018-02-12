var express = require("express");
var app = express();
const chalk = require("chalk");

var server = require("http").createServer(app);
var io = require("socket.io")(server);

app.get("/", function(req, res) {
	res.render("client.ejs");
});

server.listen(3000, function() {
	console.log("Server started");
});

function log(string, value) {
	if (typeof value === "object") {
		var display = JSON.stringify(value);
	} else {
		var display = value;
	}

	console.log(chalk.yellow(`\n \n ${string} : \n ${display} \n`));
}
