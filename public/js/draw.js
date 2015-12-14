/* Used and revised from Prof Mertz's draw code */

window.onload = function() {
  document.ontouchmove = function(e){ e.preventDefault(); }

  var canvas  = document.getElementById('main'); // gets the canvas

  // HTML5 has a context 2d that allows for drawing lines, dots, etc.
  var context = canvas.getContext("2d");

  var lastx; // records the last x of the cursor with respect to the canvas
  var lasty; // records the last y of the cursor with respect to the canvas

  // styling of the drawings
  context.strokeStyle = "#000000";
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 5;

  // clears the canvas
  function clear() {
    context.fillStyle = "#ffffff";
    context.rect(0, 0, canvas.width, canvas.height);
    context.fill();
  }

  // draws a dot on the canvas
  function dot(x,y) {
    context.beginPath();
    context.fillStyle = "#000000";
    context.arc(x,y,1,0,Math.PI*2,true);
    context.fill();
    context.stroke();

    context.closePath();
  }

  // draws a line on the canvas
  function line(fromx,fromy, tox,toy) {
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();
    context.closePath();
  }

///////////////////////////////////////////////////////////////////////////////// DESKTOP CLICKING EVENT
var clicking = false; // set initially click to false

// whenever the user clicks the canvas
$('#main').mousedown(function(e){
    var rect = document.getElementById('main').getBoundingClientRect(); // finds exact coordinates of canvas
    clicking = true; // set clicking to true
    lastx = (e.pageX - rect.left)/rect.width * canvas.width; // finds the x coordinate with respect to canvas
    lasty = (e.pageY - rect.top)/rect.height * canvas.height; // finds the y coordinate with respect to canvas

    dot(lastx,lasty); // draws a dot at that location

});

// whenever the user isn't clicking anymore, set clicking to false
$(document).mouseup(function(e){
    clicking = false;
});

// when the user moves the mouse while clicking, it draws a line
$('#main').mousemove(function(e){
  var rect = document.getElementById('main').getBoundingClientRect();
  if(clicking === false) return;

  var newx = (e.pageX - rect.left)/rect.width * canvas.width; // finds the new x coordinate with respect to canvas
  var newy = (e.pageY - rect.top)/rect.height * canvas.height; // finds the new y coordinate with respect to canvas

  line(lastx,lasty, newx,newy); // draws a line
  
  lastx = newx;
  lasty = newy;
});

///////////////////////////////////////////////////////////////////////////////// MOBILE TOUCH EVENT
var doOnTouchStart = function(event){                   
  event.preventDefault();  
  var rect = document.getElementById('main').getBoundingClientRect(); // get canvas coordinates
  lastx = (event.touches[0].clientX - rect.left)/rect.width * canvas.width; // finds the x coordinate with respect to canvas 
  lasty = (event.touches[0].clientY - rect.top)/rect.height * canvas.height; // finds the y coordinate with respect to canvas

  dot(lastx,lasty); // draws a dot
}

canvas.addEventListener("touchstart", doOnTouchStart);

var doOnTouchMove = function(event){                   
  event.preventDefault();                 
  var rect = document.getElementById('main').getBoundingClientRect(); // get canvas coordinates
  var newx = (event.touches[0].clientX - rect.left)/rect.width * canvas.width; // finds the new x coordinate with respect to canvas
  var newy = (event.touches[0].clientY - rect.top)/rect.height * canvas.height; // finds the new y coordinate with respect to canvas

  line(lastx,lasty, newx,newy); // draws a line

  
  lastx = newx;
  lasty = newy;
}

canvas.addEventListener("touchmove", doOnTouchMove);

var clearButton = document.getElementById('clear');
clearButton.onclick = clear;

clear();

}