
class InfoManager {

  addPlayerInfo (player, displayClass=false) {
    var info = document.getElementById('info');
    var p = document.createElement('p');
    p.innerHTML = player.username;
    if (displayClass) { p.style.color = player.isHunted ? "blue" : "red"; }
    info.appendChild(p);
  }
  
  showPlayerClass (myPlayer, otherPlayers) {
    var info = document.getElementById('info');
    info.innerHTML = "";
    var h3 = document.createElement('h3');
    h3.innerHTML = "Hunters: ";
    info.appendChild(h3);
    var hunted = myPlayer;
    myPlayer.isHunted = true;
    Object.values(otherPlayers).forEach((otherPlayer) => {
      if (!otherPlayer.isHunted) {
        this.addPlayerInfo(otherPlayer, true);
      } else {
        hunted = otherPlayer;
        myPlayer.isHunted = false;
        this.addPlayerInfo(myPlayer, true);
      }
    });
    var h3_ = document.createElement('h3');
    h3_.innerHTML = "Hunted: ";
    info.appendChild(h3_);
    this.addPlayerInfo(hunted, true);
  }
  
  playerLeft (myPlayer, remainingPlayers) {
    info.innerHTML = "";
    this.addPlayerInfo(myPlayer, false);
    remainingPlayers.forEach((p)=>this.addPlayerInfo(p, false));
  } 

}


module.exports = InfoManager;
