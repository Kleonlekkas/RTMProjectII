"use strict";

//Possible directions a user can move
//their character. These are mapped
//to integers for fast/small storage
var directions = {
  DOWNLEFT: 0,
  DOWN: 1,
  DOWNRIGHT: 2,
  LEFT: 3,
  UPLEFT: 4,
  RIGHT: 5,
  UPRIGHT: 6,
  UP: 7
};

//size of our character sprites
var spriteSizes = {
  WIDTH: 60,
  HEIGHT: 60
};

//function to lerp (linear interpolation)
//Takes position one, position two and the 
//percentage of the movement between them (0-1)
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

//redraw with requestAnimationFrame
var redraw = function redraw(time) {
  //update this user's positions
  updatePosition();

  ctx.clearRect(0, 0, 715, 715);

  ctx.fillStyle = "#000000";
  //Draw walls
  var wallKeys = Object.keys(walls);

  for (var n = 0; n < wallKeys.length; n++) {
    ctx.fillRect(walls[n].xPos, walls[n].yPos, 65, 65);
  }

  //check to see if theyre colliding
  for (var _n = 0; _n < wallKeys.length; _n++) {

    if (checkWallCollisions(squares[hash], walls[_n], cSIZE, 65)) {
      console.log("colliding!");
      var square = squares[hash];
      playerCanMove = false;
      //find their closest point
      var cp = findClosestPoint(square);
      square.x = sectionArray[cp].x;
      square.y = sectionArray[cp].y;
    }
    playerCanMove = true;
  }

  //draw before player so they can be on top
  //for each attack, draw each to the screen
  for (var i = 0; i < attacks.length; i++) {
    var attack = attacks[i];

    //draw the attack image
    ctx.drawImage(bombImage, attack.x, attack.y, attack.width, attack.height);

    //count how many times we have drawn this particular attack
    attack.frames++;

    //if the attack has been drawn for 120 frames (two seconds)
    //then stop drawing it and remove it from the attacks to draw
    //detonate it
    if (attack.frames > 120) {
      detonateBomb(attack);
    }
    //let explosion sit on screen for half a second
    if (attack.frames > 150) {
      //remove from our attacks array
      attacks.splice(i);
      //decrease i since splice changes the array length
      i--;
    }
  }

  //each user id
  var keys = Object.keys(squares);

  //for each user
  for (var _i = 0; _i < keys.length; _i++) {

    var _square = squares[keys[_i]];

    //if alpha less than 1, increase it by 0.01
    if (_square.alpha < 1) _square.alpha += 0.05;

    //applying a filter effect to other characters
    //in order to see our character easily
    if (_square.hash === hash) {
      ctx.filter = "none";
    } else {
      ctx.filter = "hue-rotate(40deg)";
    }

    //calculate lerp of the x/y from the destinations
    _square.x = lerp(_square.prevX, _square.destX, _square.alpha);
    _square.y = lerp(_square.prevY, _square.destY, _square.alpha);

    // if we are mid animation or moving in any direction
    if (_square.frame > 0 || _square.moveUp || _square.moveDown || _square.moveRight || _square.moveLeft) {
      //increase our framecount
      _square.frameCount++;

      //every 8 frames increase which sprite image we draw to animate
      //or reset to the beginning of the animation
      if (_square.frameCount % 8 === 0) {
        if (_square.frame < 7) {
          _square.frame++;
        } else {
          _square.frame = 0;
        }
      }
    }

    //draw our characters
    ctx.drawImage(walkImage, spriteSizes.WIDTH * _square.frame, spriteSizes.HEIGHT * _square.direction, spriteSizes.WIDTH, spriteSizes.HEIGHT, _square.x, _square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);

    //highlight collision box for each character
    ctx.strokeRect(_square.x, _square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }

  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};
'use strict';

var canvas = void 0;
var ctx = void 0;
var walkImage = void 0;
var bombImage = void 0;
//our websocket connection
var socket = void 0;
var hash = void 0;
var animationFrame = void 0;

//terrain
var walls = {};
//size of our character
var cSIZE = void 0;
//if the player is colliding with a block, they lose ability to move until they're not
var playerCanMove = true;

//General map terrain for now, read it as an array. Later have possibility to vote
//on different maps and read in the array to load it
var map = [];

//Arrays of points to auto move bomb placements so they're nice in grid like
//split into three as to help with optimization, i think
//they are separated by their y values
var topThird = [];
var midThird = [];
var botThird = [];

//store the current section
var sectionArray = void 0;

//keep track of the section the player is in
var section = void 0;

var squares = {};
var attacks = [];

var keyDownHandler = function keyDownHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // W OR UP
  if (keyPressed === 87 || keyPressed === 38) {
    square.moveUp = true;
  }
  // A OR LEFT
  else if (keyPressed === 65 || keyPressed === 37) {
      square.moveLeft = true;
    }
    // S OR DOWN
    else if (keyPressed === 83 || keyPressed === 40) {
        square.moveDown = true;
      }
      // D OR RIGHT
      else if (keyPressed === 68 || keyPressed === 39) {
          square.moveRight = true;
        }
};

var keyUpHandler = function keyUpHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // W OR UP
  if (keyPressed === 87 || keyPressed === 38) {
    square.moveUp = false;
  }
  // A OR LEFT
  else if (keyPressed === 65 || keyPressed === 37) {
      square.moveLeft = false;
    }
    // S OR DOWN
    else if (keyPressed === 83 || keyPressed === 40) {
        square.moveDown = false;
      }
      // D OR RIGHT
      else if (keyPressed === 68 || keyPressed === 39) {
          square.moveRight = false;
        } else if (keyPressed === 32) {
          sendAttack();
        }
};

var init = function init() {
  walkImage = document.querySelector('#walk');
  bombImage = document.querySelector('#bomb');

  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');

  //get map
  //1's represent walls
  cSIZE = 60;
  map = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

  //when wed recieve the map, wed populate it
  populateWallArray(map);
  populatePointArray();

  socket = io.connect();

  socket.on('joined', setUser); //when user joins
  socket.on('updatedMovement', update); //when players move
  socket.on('attackHit', playerDeath); //when a player dies
  socket.on('attackUpdate', receiveAttack); //when an attack is sent
  socket.on('left', removeUser); //when a user leaves

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
'use strict';

//when we receive a character update
var update = function update(data) {
  //if we do not have that character (based on their id)
  //then add them
  if (!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  //if the update is for our own character (we dont need it)
  //Although, it could be used for player validation
  if (data.hash === hash) {
    return;
  }

  //if we received an old message, just drop it
  if (squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  //grab the character based on the character id we received
  var square = squares[data.hash];
  //update their direction and movement information
  //but NOT their x/y since we are animating those
  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.destX = data.destX;
  square.destY = data.destY;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.moveDown = data.moveDown;
  square.moveUp = data.moveUp;
  square.alpha = 0.05;
};

//function to remove a character from our character list
var removeUser = function removeUser(data) {
  //if we have that character, remove them
  if (squares[data.hash]) {
    delete squares[data.hash];
  }
};

//function to set this user's character
var setUser = function setUser(data) {
  hash = data.hash; //set this user's hash to the unique one they received
  squares[hash] = data; //set the character by their hash
  requestAnimationFrame(redraw); //start animating
};

//when receiving an attack (cosmetic, not collision event)
//add it to our attacks to draw
var receiveAttack = function receiveAttack(data) {
  attacks.push(data);
};

//function to send an attack request to the server
var sendAttack = function sendAttack() {
  var square = squares[hash];

  //create a new attack at the closest appropriate point
  var cp = findClosestPoint(square);

  var attack = {
    hash: hash,
    x: sectionArray[cp].x,
    y: sectionArray[cp].y,
    power: square.power,
    frames: 0

    //send request to server
  };socket.emit('attack', attack);
};

//when a character is killed
var playerDeath = function playerDeath(data) {
  //remove the character
  delete squares[data];

  //if the character killed is our character
  //then disconnect and draw a game over screen
  if (data === hash) {
    socket.disconnect();
    cancelAnimationFrame(animationFrame);
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.fillText('You died', 50, 100);
  }
};

//update this user's positions based on keyboard input
var updatePosition = function updatePosition() {
  var square = squares[hash];

  //move the last x/y to our previous x/y variables
  square.prevX = square.x;
  square.prevY = square.y;

  //if user is moving up, decrease y
  if (square.moveUp && square.destY > 0 && playerCanMove) {
    square.destY -= 5;
  }
  //if user is moving down, increase y
  if (square.moveDown && square.destY < 655 && playerCanMove) {
    square.destY += 5;
  }
  //if user is moving left, decrease x
  if (square.moveLeft && square.destX > 0 && playerCanMove) {
    square.destX -= 5;
  }
  //if user is moving right, increase x
  if (square.moveRight && square.destX < 655 && playerCanMove) {
    square.destX += 5;
  }

  //keep track of the section the player is in
  //section is redundant atm but nice for debugging
  if (square.y > 475) {
    section = 3;
    sectionArray = botThird;
  } else if (square.y > 235) {
    section = 2;
    sectionArray = midThird;
  } else {
    section = 1;
    sectionArray = topThird;
  }
  //console.log(section);

  //determine direction based on the inputs of direction keys
  if (square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if (square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if (square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if (square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if (square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if (square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if (square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if (square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  //reset this character's alpha so they are always smoothly animating
  square.alpha = 0.05;

  //send the updated movement request to the server to validate the movement.
  socket.emit('movementUpdate', square);
};

//function to populate our wall array with the terrain on the map
var populateWallArray = function populateWallArray(data) {
  for (var y = 0; y < data.length; y++) {
    for (var x = 0; x < data[0].length; x++) {
      //Check if its a wall, then add it to the wall list
      if (data[x][y] === 1) {
        var positionX = x * 65;
        var positionY = y * 65;
        //no need for width property, since harded at 65
        //adding position to the index which is determined by the length.
        walls[Object.keys(walls).length] = {
          xPos: positionX,
          yPos: positionY
        };
      }
    }
  }
};

//function to populate top, mid, and bot point arrays with the center points of each grid
var populatePointArray = function populatePointArray() {
  //current canvas size is 715, 65 * 11
  //our points mightt not need to be centered but if they do, 32.5 offset
  var xPos;
  var yPos;
  for (var i = 0; i < 11; i++) {
    //y
    for (var n = 0; n < 11; n++) {
      //x
      yPos = i * 65;
      xPos = n * 65;
      //if were in a row with walls, we dont need to draw wall points
      //**NOTE THIS ONLY WORKS FOR THE CURRENT MAP**
      if (i % 2 == 1) {
        if (n % 2 == 1) {
          //skip it
          continue;
        }
      }
      //first third
      if (i < 4) {
        topThird[Object.keys(topThird).length] = {
          x: xPos,
          y: yPos
        };
      }
      //second third
      else if (i < 8) {
          midThird[Object.keys(midThird).length] = {
            x: xPos,
            y: yPos
          };
        }
        //third third
        else {
            botThird[Object.keys(botThird).length] = {
              x: xPos,
              y: yPos
            };
          }
    }
  }
};

//Collision with walls, rect1 is player, rect2 is terrain
//sizes width/height are same since theyre squares
var checkWallCollisions = function checkWallCollisions(rect1, rect2, size1, size2) {

  if (rect1.x < rect2.xPos + size2 && rect1.x + size1 > rect2.xPos && rect1.y < rect2.yPos + size2 && size1 + rect1.x > rect2.yPos) {
    ctx.fillStyle = "#00FF00";
    ctx.beginPath();
    ctx.moveTo(rect1.x, rect1.y);
    ctx.lineTo(rect2.xPos, rect2.yPos);
    ctx.stroke();
    return true; // is colliding
  }
  return false; // is not colliding
};

var detonateBomb = function detonateBomb(attack) {
  ctx.fillStyle = "#FF0000";
  //draw squares to represent explosion
  /*
  for(var i = 0; i < attack.power; i++) {
  	
  	//draw in each direction
  	ctx.fillRect(attack.x + (i * 65), attack.y, 60, 60);
  	ctx.fillRect(attack.x - (i * 65), attack.y, 60, 60);
  	ctx.fillRect(attack.x, attack.y + (i * 65), 60, 60);
  	ctx.fillRect(attack.x, attack.y - (i * 65), 60, 60);
  } */
  //will probably have to get top portion working, so i can actually stop
  //drawing explosions if i hit a wall
  var offSet = (attack.power + 2) * 65;

  //x direction
  ctx.fillRect(attack.x - offSet / 3, attack.y, offSet, 60);
  //y direction
  ctx.fillRect(attack.x, attack.y - offSet / 3, 60, offSet);
};

//Helper distance function
//save a few minutes by looking up one
//https://stackoverflow.com/users/928540/ekstrakt
var dist = function dist(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
};

//return the index in the array
var findClosestPoint = function findClosestPoint(square) {
  //find the closest point to them in the section theyre in
  var closestPoint = 0;
  //loop through section array, find closest point to place bomb
  for (var i = 0; i < Object.keys(sectionArray).length; i++) {
    var pnt = sectionArray[i];
    if (dist(pnt.x, pnt.y, square.x, square.y) < dist(sectionArray[closestPoint].x, sectionArray[closestPoint].y, square.x, square.y)) {
      closestPoint = i;
    }
  }
  return closestPoint;
};
