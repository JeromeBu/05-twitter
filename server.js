var express = require("express");
var app = express();
const chalk = require("chalk");
const morgan = require("morgan");
var bodyParser = require("body-parser");
var multer = require("multer");
var cloudinary = require("cloudinary");
var cloudinaryStorage = require("multer-storage-cloudinary");
var uniqid = require("uniqid");

cloudinary.config({
	cloud_name: "dpmc03d5t",
	api_key: "441494212493983",
	api_secret: "tryvSA9O5hqjmqSTX-TyRaiVuzQ"
});

var storage = cloudinaryStorage({
	cloudinary: cloudinary,
	folder: function(req, file, cb) {
		cb(undefined, "twitter"); // on récupère une variable du formulaire
	},
	allowedFormats: ["jpg", "png"],
	// tranformation: [{ width: 90, height: 90, crop: "thumb", gravity: "face" }],
	filename: function(req, file, cb) {
		cb(undefined, req.body.id);
	}
});

var parser = multer({ storage: storage });

var server = require("http").createServer(app);
var io = require("socket.io")(server);

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/twiter");
app
	.use(express.static("public"))
	.use(morgan("dev"))
	.use(bodyParser.urlencoded({ extended: true }))
	.set("view engine", "ejs");

var format = require("date-fns").format;

// 1) Definir le schema - A faire qu'une fois
var tweetSchema = new mongoose.Schema({
	name: { type: String, require: true },
	message: String,
	createdAt: { type: Date, default: Date.now },
	img_id: String
});

// 2) Definir le model - A faire qu'une fois
var Tweet = mongoose.model("Student", tweetSchema);

app.get("/", function(req, res) {
	Tweet.find()
		.sort("-createdAt")
		.lean()
		.exec(function(err, tweets) {
			if (!err) {
				tweets.forEach(tweet => {
					tweet.date = format(tweet.createdAt, "DD/MM/YYYY");
				});
				res.render("client.ejs", { tweets: tweets, id: uniqid() });
			} else {
				res.send("An error at occured");
			}
		});
});

io.on("connection", function(socket) {
	// ecoute de l'evenement d'envoi de message
	log("Info", "Socket connection has been established");
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
				socket.img_id = data.img_id;
				socket.date = format(data.date, "DD/MM/YYYY");

				// (6) envoyer une information à tous les clients
				io.emit("new_tweet", {
					name: socket.name,
					message: socket.message,
					date: socket.date,
					img_id: socket.img_id
				});
			}
		});
		// envoyer à tout le monde sauf au client lui-même
		// socket.broadcast.emit('new_connection', {name: client.name});
	});

	// d'autres écouteurs peuvent être créés ici `client.on(...);`
});

app.post("/upload", parser.single("image", 4), function(req, res) {
	log("req.file", req.file);
	log("req.body", req.body);

	var image_to_upload = {
		version: req.file.version,
		public_id: req.file.public_id,
		mimetype: req.file.mimetype,
		secure_url: req.file.secure_url
	};
	//   images.push(image);
	res.send("upload is done");
	// }
	// console.log(images);
	// res.redirect("/");
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
