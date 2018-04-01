class Character {
  constructor(hash) {
    this.hash = hash;
    this.lastUpdate = new Date().getTime();
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.destX = 0;
    this.destY = 0;
    this.height = 60;
    this.width = 60;
    this.alpha = 0;
    this.direction = 0;
    this.room = 'room1';
    this.moveLeft = false;
    this.moveRight = false;
    this.moveDown = false;
    this.moveUp = false;
    this.color = 'orange';
    this.power = 1;
    this.speed = 5;
    this.limit = 1;
  }
}

module.exports = Character;
