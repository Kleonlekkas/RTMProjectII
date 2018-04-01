//Possible directions a user can move
//their character. These are mapped
//to integers for fast/small storage
const directions = {
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
const spriteSizes = {
  WIDTH: 50,
  HEIGHT: 50
};

//function to lerp (linear interpolation)
//Takes position one, position two and the 
//percentage of the movement between them (0-1)
const lerp = (v0, v1, alpha) => {
  return (1 - alpha) * v0 + alpha * v1;
};


//redraw with requestAnimationFrame
const redraw = (time) => {
  //update this user's positions
  updatePosition();

  ctx.clearRect(0, 0, 715, 715);
  
  //If were not ready to play the game, let the user know
  if (!playGame) {
	ctx.font = "32px Arial";
	ctx.fillText("Waiting for another player...", 200, 700);
  }
  
  ctx.fillStyle = "#000000";
  //Draw walls
	const wallKeys = Object.keys(walls);
	
  for(let n = 0; n < wallKeys.length; n++) {
	ctx.fillRect(walls[n].xPos, walls[n].yPos, 65, 65);
  }

  
	//check to see if theyre colliding
   for(let n = 0; n < wallKeys.length; n++) {
	//character, wall, character size, wall size
	if (checkWallCollisions(squares[hash], walls[n], 50, 65)) {
		//console.log("colliding!");
		const square = squares[hash];
		playerCanMove = false;
		//find their closest point
		var cp = findClosestPoint(square);
		//find out where theyre colliding
		//console.log(findSide(square, walls[n]));
		
		square.destX = sectionArray[cp].x;
		square.destY = sectionArray[cp].y;		
	}
	playerCanMove = true;
  }
  
	//draw before player so they can be on top
    //for each attack, draw each to the screen
  for(let i = 0; i < attacks.length; i++) {
    const attack = attacks[i];
    
    //draw the attack image
    ctx.drawImage(
      bombImage,
      attack.x,
      attack.y,
      attack.width,
      attack.height
    );
    
    //count how many times we have drawn this particular attack
    //attack.frames++;
    
    //if the attack has been drawn for 120 frames (two seconds)
    //then stop drawing it and remove it from the attacks to draw
	//detonate it
	
    //if(attack.frames > 120) {
		//detonateBomb(attack);
   // }
	//let explosion sit on screen for half a second
	//console.log(attack);
	
	if (attack.det == true) {
		attack.frames++;
		//Draw the actual explosion
		drawBomb(attack);
		if (attack.frames > 30) {
			//check to see if its our bomb
			if (attack.hash == hash) {
				//decrease our bombCount
				bombCount--;
			}
			
			attacks.splice(i);
			//decrease i since splice changes array length
			i--;
		}
	}
	
	/*
	if (attack.frames > 150) {
		//remove from our attacks array
		attacks.splice(i);
		//decrease i since splice changes the array length
		i--;
	} */
  }

  //each user id
  const keys = Object.keys(squares);

  //for each user
  for(let i = 0; i < keys.length; i++) {

    const square = squares[keys[i]];

    //if alpha less than 1, increase it by 0.01
    if(square.alpha < 1) square.alpha += 0.05;

    //calculate lerp of the x/y from the destinations
    square.x = lerp(square.prevX, square.destX, square.alpha);
    square.y = lerp(square.prevY, square.destY, square.alpha);

	
	ctx.fillStyle = square.color;
	ctx.fillRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
    
    //highlight collision box for each character
    ctx.strokeRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }
  


  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};