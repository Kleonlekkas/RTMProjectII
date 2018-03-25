//when we receive a character update
const update = (data) => {
  //if we do not have that character (based on their id)
  //then add them
  if(!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  //if the update is for our own character (we dont need it)
  //Although, it could be used for player validation
  if(data.hash === hash) {
    return;
  }

  //if we received an old message, just drop it
  if(squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  //grab the character based on the character id we received
  const square = squares[data.hash];
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
const removeUser = (data) => {
  //if we have that character, remove them
  if(squares[data.hash]) {
    delete squares[data.hash];
  }
};

//function to set this user's character
const setUser = (data) => {
  hash = data.hash; //set this user's hash to the unique one they received
  squares[hash] = data; //set the character by their hash
  requestAnimationFrame(redraw); //start animating
};

//when receiving an attack (cosmetic, not collision event)
//add it to our attacks to draw
const receiveAttack = (data) => {
  attacks.push(data);
};

//function to send an attack request to the server
const sendAttack = () => {
  const square = squares[hash];
  
	//create a new attack at the closest appropriate point
	var cp = findClosestPoint(square);
  
  const attack = {
    hash: hash,
    x: sectionArray[cp].x,
    y: sectionArray[cp].y,
	power: square.power,
    frames: 0,
  }

  //send request to server
  socket.emit('attack', attack);
};

//when a character is killed
const playerDeath = (data) => {
  //remove the character
  delete squares[data];
 
  //if the character killed is our character
  //then disconnect and draw a game over screen
  if(data === hash) {
    socket.disconnect();
    cancelAnimationFrame(animationFrame);
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = 'white';
    ctx.font = '48px serif';
    ctx.fillText('You died', 50, 100);
  }
};

//update this user's positions based on keyboard input
const updatePosition = () => {
  const square = squares[hash];

  //move the last x/y to our previous x/y variables
  square.prevX = square.x;
  square.prevY = square.y;

  //if user is moving up, decrease y
  if(square.moveUp && square.destY > 0 && playerCanMove) {
    square.destY -= 5;
  }
  //if user is moving down, increase y
  if(square.moveDown && square.destY < 655 && playerCanMove) {
    square.destY += 5;
  }
  //if user is moving left, decrease x
  if(square.moveLeft && square.destX > 0 && playerCanMove) {
    square.destX -= 5;
  }
  //if user is moving right, increase x
  if(square.moveRight && square.destX < 655 && playerCanMove) {
    square.destX += 5;
  }
  
  //keep track of the section the player is in
  //section is redundant atm but nice for debugging
  if (square.y > 475) {
	  section = 3;
	  sectionArray = botThird;
  } else if (square.y >  235) {
	  section = 2;
	  sectionArray = midThird;
  } else {
	  section = 1;
	  sectionArray = topThird;
  }
  //console.log(section);

  //determine direction based on the inputs of direction keys
  if(square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if(square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if(square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if(square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if(square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if(square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if(square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if(square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  //reset this character's alpha so they are always smoothly animating
  square.alpha = 0.05;

  //send the updated movement request to the server to validate the movement.
  socket.emit('movementUpdate', square);
};

//function to populate our wall array with the terrain on the map
const populateWallArray = (data) => {
	for (var y = 0; y < data.length; y++) {
		for (var x = 0; x < data[0].length; x++) {
			//Check if its a wall, then add it to the wall list
			if (data[x][y] === 1) {
				var positionX = (x * 65);
				var positionY = (y * 65);
				//no need for width property, since harded at 65
				//adding position to the index which is determined by the length.
				walls[Object.keys(walls).length] = {
					xPos: positionX,
					yPos: positionY,
				}		
			}
		}
	}
};

//function to populate top, mid, and bot point arrays with the center points of each grid
const populatePointArray = () => {
	//current canvas size is 715, 65 * 11
	//our points mightt not need to be centered but if they do, 32.5 offset
	var xPos;
	var yPos;
	for (var i = 0; i < 11; i++) { //y
		for (var n = 0; n < 11; n++) { //x
			yPos = (i * 65);
			xPos = (n * 65);
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
					y: yPos,
				}
			}
			//second third
			else if (i < 8) {
				midThird[Object.keys(midThird).length] = {
					x: xPos,
					y: yPos,
				}
			}
			//third third
			else {
				botThird[Object.keys(botThird).length] = {
					x: xPos,
					y: yPos,
				}
			}
		}
	}
};


//Collision with walls, rect1 is player, rect2 is terrain
//sizes width/height are same since theyre squares
const checkWallCollisions = (rect1, rect2, size1, size2) => {

  if (rect1.x < rect2.xPos + size2 &&
     rect1.x + size1 > rect2.xPos &&
     rect1.y < rect2.yPos + size2 &&
     size1 + rect1.x > rect2.yPos) {
		 ctx.fillStyle = "#00FF00";
		ctx.beginPath();
		ctx.moveTo(rect1.x, rect1.y);
		ctx.lineTo(rect2.xPos, rect2.yPos);
		ctx.stroke();
    return true; // is colliding
  }
  return false; // is not colliding
};

const detonateBomb = (attack) => {
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
	const offSet = (attack.power + 2) * 65;
	
	//x direction
	ctx.fillRect(attack.x - offSet/3, attack.y, offSet, 60);
	//y direction
	ctx.fillRect(attack.x, attack.y - offSet/3, 60, offSet);
	
};

//Helper distance function
//save a few minutes by looking up one
//https://stackoverflow.com/users/928540/ekstrakt
const dist = (x1, y1, x2, y2) => {
	return (Math.sqrt(Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2)));
}

//return the index in the array
const findClosestPoint = (square) => {
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
}