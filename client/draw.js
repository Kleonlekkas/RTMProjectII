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
  WIDTH: 60,
  HEIGHT: 60
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
  
  ctx.fillStyle = "#000000";
  //Draw walls
	const wallKeys = Object.keys(walls);
	
  for(let n = 0; n < wallKeys.length; n++) {
	ctx.fillRect(walls[n].xPos, walls[n].yPos, 65, 65);
  }
  
	//check to see if theyre colliding
   for(let n = 0; n < wallKeys.length; n++) {
	   
	   
	if (checkWallCollisions(squares[hash], walls[n], cSIZE, 65)) {
		console.log("colliding!");
		const square = squares[hash];
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
    attack.frames++;
    
    //if the attack has been drawn for 120 frames (two seconds)
    //then stop drawing it and remove it from the attacks to draw
	//detonate it
    if(attack.frames > 120) {
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
  const keys = Object.keys(squares);

  //for each user
  for(let i = 0; i < keys.length; i++) {

    const square = squares[keys[i]];

    //if alpha less than 1, increase it by 0.01
    if(square.alpha < 1) square.alpha += 0.05;

    //applying a filter effect to other characters
    //in order to see our character easily
    if(square.hash === hash) {
      ctx.filter = "none"
    }
    else {
      ctx.filter = "hue-rotate(40deg)";
    }

    //calculate lerp of the x/y from the destinations
    square.x = lerp(square.prevX, square.destX, square.alpha);
    square.y = lerp(square.prevY, square.destY, square.alpha);

    // if we are mid animation or moving in any direction
    if(square.frame > 0 || (square.moveUp || square.moveDown || square.moveRight || square.moveLeft)) {
      //increase our framecount
      square.frameCount++;

      //every 8 frames increase which sprite image we draw to animate
      //or reset to the beginning of the animation
      if(square.frameCount % 8 === 0) {
        if(square.frame < 7) {
          square.frame++;
        } else {
          square.frame = 0;
        }
      }
    }

    //draw our characters
    ctx.drawImage(
      walkImage, 
      spriteSizes.WIDTH * square.frame,
      spriteSizes.HEIGHT * square.direction,
      spriteSizes.WIDTH, 
      spriteSizes.HEIGHT,
      square.x, 
      square.y, 
      spriteSizes.WIDTH, 
      spriteSizes.HEIGHT
    );
    
    //highlight collision box for each character
    ctx.strokeRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }
  


  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};