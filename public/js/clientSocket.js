$(document).ready(function(){

	// connects the socket
	var socket = io.connect("http://pictionary-weikunliang.rhcloud.com:8000");
	var username; // the username of the user
	var isArtist; // if the player is an artist or not
	var words; // the words that are being used

	// redraws the image onto the new canvas given a canvas and the image URL
	function redrawImage(canvasID, imageURL) {
		var canvas  = document.getElementById(canvasID); // gets the canvas
	  	var context = canvas.getContext("2d");
		var dataURL = imageURL; // the image URL
		img = new Image; // creates a new image
		img.onload = function () {
		    context.drawImage(img, 0, 0); // draws the image
		}
		img.src = dataURL; 
	}

	// clears the canvas given the canvas ID
	function clearCanvas(canvas) {
		var canvas  = document.getElementById(canvas);
		var context = canvas.getContext("2d");
		context.fillStyle = "#ffffff";
	    context.rect(0, 0, 300, 300);
	    context.fill();
	}

	// clears all the canvases
	function clearAll() {
		clearCanvas('main');
		clearCanvas('solution');
		clearCanvas('image');
	}

	// pings the server every once in a while so that it doesn't disconnect
	socket.on('ping', function(data){
      socket.emit('pong', {beat: 1});
    });

	// After the user enters an username and hits submit
	$('#join').click(function () {
		username = $('#username').val(); // username of the player
		socket.emit('welcomePlayer', {name: username}); // emits welcome player and passes in the username
	});

	// displays the old image on the canvas for the user
	socket.on('displayImg', function (data) {
		console.log(data.imgs);
		if(data.imgs.length == 0) { // if there are no old images then display text saying that there are no images
			clearCanvas("otherDrawing");
			var canvas = document.getElementById("otherDrawing");
			var ctx = canvas.getContext("2d");
			ctx.font = "Futura";
			ctx.fillStyle = "blue";
			ctx.textAlign = "center";
			ctx.fillText("No Other Drawings", canvas.width/2, canvas.height/2); // writes the text in the center
		} else { // otherwise pick a random old image and display it
			clearCanvas("otherDrawing");
			var i = Math.floor((Math.random() * data.imgs.length)); // random image index
			redrawImage('otherDrawing', data.imgs[i].image); // redraws it on the canvas
		}
	});

	// when the artist is waiting for the other players to join the game
	socket.on('artistWaiting', function (data) {
		console.log('Artist Waiting...');
		isArtist = true;
		$('.initialPage').fadeOut();
		$('.header').fadeIn();
		$('.artistWaiting').fadeIn();
		$('.usernameArea').text(data.name);
	});

	// when the player is waiting for other players to join the game and the artist to start the game
	socket.on('playerWaiting', function (data) {
		console.log('Player Waiting...');
		isArtist = false;
		$('.initialPage').fadeOut();
		$('.header').fadeIn();
		$('.playerWaiting').fadeIn();
		$('.usernameArea').text(data.name);
	});

	// displays the list of players who are currently in the game
	socket.on('playerList', function (data) { 
		$(".currentPlayers ul").empty(); // empties the current list
		for(var i=0; i<data.players.length; i++) { // appends all the players
			$('.currentPlayers ul').append('<li class="list-group-item">' + data.players[i].username + '</li>');
		}
	});

	// when start game is clicked
	$('#startGame').click(function() { 
		// the list of words used
	    words = [
	{ "word":"Cat"}, { "word":"Windmill"}, { "word":"Gingerbread"}, { "word":"Throne"}, { "word":"String"}, { "word":"Dog"}, { "word":"Stairs"},{ "word":"Frankenstein"}, { "word":"Goldfish"},{ "word":"Violin"}, { "word":"Head"},{ "word":"Football"}, { "word":"Dance"}, { "word":"Alligator"}, { "word":"Stop"},{ "word":"Swing"},{ "word":"Mailbox"},{ "word":"Spider man"},{ "word":"Puppet"},{ "word":"Penguin"}, { "word":"Shovel"}, { "word":"Popcorn"},{ "word":"Butter"},{ "word":"Haircut"},{ "word":"Shopping trolley"},{ "word":"Lipstick"},{ "word":"Soap"},{ "word":"Mop"},{ "word":"Food"},{ "word":"Glue"},{ "word":"Hot"},{ "word":"See-saw"},{ "word":"Jellyfish"},{ "word":"Scarf"},{ "word":"Seashell"},{ "word":"Rain"},{ "word":"Bike"},{ "word":"Roof"},{ "word":"Bear"},{ "word":"Elbow"},{ "word":"Earthquake"},{ "word":"Summer"},{ "word":"Snowball"},{ "word":"Guitar"},{ "word":"Alarm"},{ "word":"Volleyball"}];
		socket.emit('gameStarted', {words: words});
	});

	// waiting for the artist to draw
	socket.on('waitForArtist', function (data) {
		$('.playerWaiting').fadeOut();
		$('.waitScreen').fadeIn();
	});

	// while the artist draws the image
	socket.on('drawImage', function (data) {
		$('.artistWaiting').fadeOut();
		$('.drawScreen').fadeIn();
		$('.guessWord').text(data.word);
	});

	// when the artist is finished drawing
	$('#submit').click(function () {
		var canvas  = document.getElementById('main');
		var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // saves the image
		socket.emit('guessImage', {image: image}); // emits a guess event for the players to guess
	});

	// artist waiting for the players to guess
	socket.on('waitToGuess', function (data) {
		$('.drawScreen').fadeOut();
		$('.artistWaitScreen').fadeIn();
	});

	// the players guessing the drawing
	socket.on('playerGuess', function (data) {
		$('.waitScreen').fadeOut();
		$('.guessScreen').fadeIn();

		redrawImage('image', data.image); // redraws the image to the player's canvas
	});

	// when the player hits submit after they guesses the word
	$('#guess').click(function () {
		var answer = $('#answer').val(); // get the player's guess
		socket.emit('submitAnswer', {answer: answer}); // emits a submitAnswer event
	});

	// shows the answer to the players
	socket.on('showAnswer', function (data) {
		$('.guessScreen').fadeOut();
		$('.solutionScreen').fadeIn();
		redrawImage('solution', data.image); // redraws the iamge

		$('#answerWord').text(data.correctAnswer); // displays the correct answer
		if(data.answerCorrect){ // checks if the player got it correct and displays correct and incorrect accordignly
			$('.correct').text("RIGHT"); // correct
		} else {
			$('.correct').text("WRONG"); // incorrect
		}
	});

	// shows all the player's guess for the game
	socket.on('showPlayerGuesses', function (data) {
		$('#allAnswers ul').empty(); // empties the current list
		for(var i=0; i<data.guesses.length; i++) { // appends each of the guesses
			$('#allAnswers ul').append('<li class="list-group-item">' + data.guesses[i] + '</li>');
		}

		$('.artistWaitScreen').fadeOut();
		$('.allSolutionScreen').fadeIn();
	});

	// next round
	$('#nextRound').click(function () {
		console.log('nextRound');
		socket.emit('newRound');
	});

	// clears everything
	socket.on('clear', function (data) {
		clearAll(); // clears all the canvases
		$('.container').fadeOut();
		$('.header').fadeIn();
		$('#answer').val('');
	});

	// new round where the player waits for the artist to draw
	socket.on('displayNewRoundGuess', function (data) {
		$('.waitScreen').fadeIn();
	});

	// new round where the artist draws
	socket.on('displayNewRoundArtist', function (data) {
		$('.drawScreen').fadeIn();
		$('.guessWord').text(data.word);
	});

	// when the game disconnects
	socket.on('gameDisconnected', function (data) {
		clearAll();
		$('.container').fadeOut();
		$('.disconnect').fadeIn();
		socket.emit('restart');
	});

});