var Player = require('../models/player.js');
var savedImages = require('../models/mongoModel.js');

exports.init = function(io) {
	var currentPlayers = 0; // keep track of the number of players
	var players = []; // keeps track of all the players in the game
	var artistID; // the current artist that is drawing
	var img; // the image that the artist drew
	var answers = []; // all the answers for the artist
	var word; // the current word the artist is drawing
	var wordCollection = []; // the collection of words used for artists to draw
	var usedWords = []; // used words so they don't appear again
	var oldImages; // old images to show the artist

	// sends heartbeat so that the server does not disconnect automatically
	function sendHeartbeat(){
	    setTimeout(sendHeartbeat, 8000);
	    io.sockets.emit('ping', { beat : 1 });
	}

    // When a new connection is initiated
	io.sockets.on('connection', function (socket) {
		console.log('Connection started');

		// sends heartbeat so that the server does not disconnect automatically
		socket.on('pong', function(data){
	        console.log("Pong received from client");
	    });
	    setTimeout(sendHeartbeat, 8000);

	    // get a new word for the artist to draw
		function getNewWord() {
			var i = Math.floor((Math.random() * wordCollection.length)); // get a random word
			while(usedWords.length!=wordCollection.length && !contains(wordCollection[i].word)) { // checks if it is used
				i = Math.floor((Math.random() * wordCollection.length));
			}
			return wordCollection[i].word; // returns the new word
		}

		// check if the word is in the used words list
		function contains(word) {
			for(var i=0; i<usedWords.length; i++) { 
				if(usedWords[i] == word) {
					return false;
				}
			} 
			return true;
		}

		// gets a new artist for the next round
		function getNewArtist() {
			var i = Math.floor(Math.random() * players.length); // uses a random generator to generate one
			return players[i].getID(); // returns the ID of the artist
		}

		// gets the old images from the mongodb database
		function retrieveImg(word) {
			savedImages.retrieve('savedImages', {"word":word}, function(result) { // retrieves the old images based on word
				console.log(result);
				oldImages = result;
				io.sockets.connected[artistID].emit('displayImg', {imgs:result}); // sends it to the artist to display
			});
		}


		// When a new user joins the game
		socket.on('welcomePlayer', function (data) {
			console.log('Player Joined');
			currentPlayers++; // adds it to player count
			var newPlayer; // the new player that joined the game
			if(currentPlayers == 1) { // checks if the player should be the artist or not
				newPlayer = new Player(socket.id, data.name, true); // assigns the player to be artist
				players.push(newPlayer); // adds the player to the array
				socket.emit('artistWaiting', {name: data.name}); // sends an event to wait for other players
				artistID = socket.id; // sets the artist ID to the ID of the player
			} else {
				newPlayer = new Player(socket.id, data.name, false); // assigns the player to be a normal player
				players.push(newPlayer); // adds the player to the array
				socket.emit('playerWaiting', {name: data.name}); // sends an event to wait for the artist to start the game
			}
			io.emit('playerList', {players: players}); // emits the whole player list to everyone so they can see who's in the game
		}); 

		// When the artist clicks start game
		socket.on('gameStarted', function (data) {
			console.log('Game Started');
			wordCollection = data.words; // gets the words used in the game
			word = getNewWord(); // generate a new word
			usedWords.push(word); // adds the word to the used words collection
			retrieveImg(word); // gets the old images for the word
			socket.emit('drawImage', {word: word}); // emits an event to the aritst to draw the image
			socket.broadcast.emit('waitForArtist'); // emits an event to the player to wait for the artist to draw
		});

		// Guess the image 
		socket.on('guessImage', function (data) {
			img = data.image; // the image that the artist drew
			socket.emit('waitToGuess'); // emit an event to the artist waiting for the player to guess
			socket.broadcast.emit('playerGuess', {image: data.image}); // emits to the players the image to guess

			// Use Mongo to save the image
			savedImages.create('savedImages', {'word':word, 'image':img}, function(success) {
				if(success) {
					console.log("Inserted Correctly"); // successful insertion
				} else {
					console.log("Unable to Peform Insert Operation"); //unsuccessful insertion
				}
			});

		});

		// when each player submits the answer
		socket.on('submitAnswer', function (data) {
			var correct; // boolean whether the player guessed it right or not
			answers.push(data.answer); // pushes the answer to the answers array
			if(data.answer.toLowerCase() == word.toLowerCase()) { // makes the words in lowercase and checks if they're equal
				correct = true; // checks if the player got it correct
			} else {
				correct = false;
			}

			// emits a show answer event the the player, showing them the correct answer
			socket.emit('showAnswer', {correctAnswer: word, answerCorrect: correct, image: img});
			// checks if everyone has submitted an answer
			if(answers.length == currentPlayers - 1) { // emits an event to the artist with all players answers when everyone submitted
				io.sockets.connected[artistID].emit('showPlayerGuesses', {guesses: answers, image: img, imgCollection: oldImages});
			}

		});
	
		// new round
		socket.on('newRound', function (data) {
			io.emit('clear'); // clears all the canvases
			artistID = getNewArtist(); // gets new artist
			answers = []; // empties the answer array
			word = getNewWord(); // gets a new word
			usedWords.push(word); // pushes it to the used words collection
			retrieveImg(word); // get the images for those words
			// send an event to the artist with the new round
			io.sockets.connected[artistID].emit('displayNewRoundArtist', {word: word});
			// sends an event the the rest of the players to wait
			for(var i=0; i<players.length; i++) {
				var currID = players[i].playerId;
				if(currID != artistID) {
					io.sockets.connected[currID].emit('displayNewRoundGuess');
				}
			}
		});

		// resets all the variables
		socket.on('restart', function (data) {
			currentPlayers = 0; // keep track of the number of players
			players = []; // keeps track of all the players in the game
			artistID = -1; // the current artist that is drawing
			img = null;
			answers = [];
			word = '';
			wordCollection = [];
			usedWords = [];
		});

		/*
		 * Upon this connection disconnecting (sending a disconnect event)
		 * decrement the number of players and emit an event to all other
		 * sockets.  Notice it would be nonsensical to emit the event back to the
		 * disconnected socket.
		 */
		socket.on('disconnect', function () {
			io.emit('gameDisconnected');
			currentPlayers = 0; // keep track of the number of players
			players = []; // keeps track of all the players in the game
			artistID = -1; // the current artist that is drawing
			answers = [];
			word = "";
			wordCollection = [];
			usedWords = [];
		});
	});
}
