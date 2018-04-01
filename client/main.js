let canvas;
let ctx;
let walkImage;
let bombImage;
//our websocket connection
let socket; 
let hash;
let animationFrame;

//terrain
let walls = {};
//size of our character
let cSIZE;
//if the player is colliding with a block, they lose ability to move until they're not
let playerCanMove = true;

//General map terrain for now, read it as an array. Later have possibility to vote
//on different maps and read in the array to load it
let map = [];

//Arrays of points to auto move bomb placements so they're nice in grid like
//split into three as to help with optimization, i think
//they are separated by their y values
//let topThird = [];
//let midThird = [];
//let botThird = [];

//boolean to check if theres enough users.
let playGame = false;

//store the current section
let sectionArray = [];

//keep track of the section the player is in
let section;

let squares = {};
let attacks = [];

const keyDownHandler = (e) => {
  var keyPressed = e.which;
  const square = squares[hash];
  if (playGame) {
	// W OR UP
	if(keyPressed === 87 || keyPressed === 38) {
		square.moveUp = true;
	}
	// A OR LEFT
	else if(keyPressed === 65 || keyPressed === 37) {
		square.moveLeft = true;
	}
	// S OR DOWN
	else if(keyPressed === 83 || keyPressed === 40) {
		square.moveDown = true;
	}
	// D OR RIGHT
	else if(keyPressed === 68 || keyPressed === 39) {
		square.moveRight = true;
	}
  }

};

const keyUpHandler = (e) => {
  var keyPressed = e.which;
  const square = squares[hash];

  if (playGame) {
	// W OR UP
	if(keyPressed === 87 || keyPressed === 38) {
		square.moveUp = false;
	}
	// A OR LEFT
	else if(keyPressed === 65 || keyPressed === 37) {
		square.moveLeft = false;
	}
	// S OR DOWN
	else if(keyPressed === 83 || keyPressed === 40) {
		square.moveDown = false;
	}
	// D OR RIGHT
	else if(keyPressed === 68 || keyPressed === 39) {
		square.moveRight = false;
	}
	else if(keyPressed === 32) {
		sendAttack();
	}
  }

};

const init = () => {
  walkImage = document.querySelector('#walk');
  bombImage = document.querySelector('#bomb');
  
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');
  
  //get map
  //1's represent walls
  cSIZE = 60;
  map = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		 [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
		 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		 [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
		 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		 [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
		 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		 [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
		 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		 [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
		 [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
		
	//when wed recieve the map, wed populate it
	populateWallArray(map);
	populatePointArray();
	

  socket = io.connect();

  socket.on('joined', setUser); //when user joins
  socket.on('updatedMovement', update); //when players move
  socket.on('attackHit', playerDeath); //when a player dies
  socket.on('attackUpdate', receiveAttack); //when an attack is sent
  socket.on('detonate', detonateBomb);
  socket.on('left', removeUser); //when a user leaves
  socket.on('userUpdate', gameStart);

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;