class Game {
  constructor (me) {
    this.players = [me];
  }

  add (player) {
    this.players.push(player);
  }

}

module.exports = Game;
