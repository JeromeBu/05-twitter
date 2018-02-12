var express = require("express");
var app = express();
const chalk = require("chalk");

var server = require("http").createServer(app);
var io = require("socket.io")(server);

app.use(express.static("public"));

app.get("/", function(req, res) {
	res.render("client.ejs");
});

io.on("connection", function(socket) {
	// ecoute de l'evenement d'envoi de message
	socket.on("message-send", function(data) {
		log("Connected, data :", data);

		// nous pouvons stocker des données dans l'objet client
		// cela peut être utile si nous souhaitons
		socket.name = data.name;
		socket.message = data.message;

		// (6) envoyer une information à tous les clients
		io.emit("new_tweet", {
			name: socket.name,
			message: socket.message
		});

		// envoyer à tout le monde sauf au client lui-même
		// socket.broadcast.emit('new_connection', {name: client.name});
	});

	// d'autres écouteurs peuvent être créés ici `client.on(...);`
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
