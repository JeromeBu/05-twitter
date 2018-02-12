var express = require("express");
var app = express();
const chalk = require("chalk");
const morgan = require("morgan");

var server = require("http").createServer(app);
var io = require("socket.io")(server);

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/twiter");
app.use(morgan("dev"));

var format = require("date-fns").format;

// 1) Definir le schema - A faire qu'une fois
var tweetSchema = new mongoose.Schema({
	name: { type: String, require: true },
	message: String,
	createdAt: { type: Date, default: Date.now }
});

// 2) Definir le model - A faire qu'une fois
var Tweet = mongoose.model("Student", tweetSchema);

app.use(express.static("public"));

app.get("/", function(req, res) {
	Tweet.find()
		.lean()
		.exec(function(err, tweets) {
			if (!err) {
				log("tweets", tweets);
				tweets.forEach(tweet => {
					tweet.date = format(tweet.createdAt, "DD/MM/YYYY");
				});
				log("Après ajout de la date sur tweets", tweets);
				res.render("client.ejs", { tweets: tweets });
			} else {
				res.send("An error at occured");
			}
		});
});

io.on("connection", function(socket) {
	// ecoute de l'evenement d'envoi de message
	socket.on("message-send", function(data) {
		log("Connected, data :", data);

		var newTweet = new Tweet(data);
		newTweet.save(function(err, obj) {
			if (err) {
				console.log("something went wrong");
			} else {
				console.log("we just saved tweet " + obj.message);
				// nous pouvons stocker des données dans l'objet client
				// cela peut être utile si nous souhaitonsç

				socket.name = data.name;
				socket.message = data.message;
				socket.date = format(data.date, "DD/MM/YYYY");

				// (6) envoyer une information à tous les clients
				io.emit("new_tweet", {
					name: socket.name,
					message: socket.message,
					date: socket.date
				});
			}
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
