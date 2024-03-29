canvas.addEventListener('touchstart', onTouch, false);
window.addEventListener('devicemotion', deviceMotion);


function onTouch(e) {
  if (g.isStarted && !g.isOver) {
    var angle = findAngle(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  	if(g.myPlayer.powerups.bullets > 0) {
      g.myPlayer.powerups.bullets--;
      var rand = Math.floor(Math.random() * 100);
      fireBullet(g.myPlayer.x / c.GRID_WIDTH, g.myPlayer.y / c.GRID_HEIGHT, angle, g.player, rand);
      socket.emit("bulletFired", {id: rand, playerX: g.myPlayer.x / c.GRID_WIDTH, playerY: g.myPlayer.y / c.GRID_HEIGHT, angle: angle, player: g.player});
    }
    else {
      dropMyBomb(g.myPlayer.x, g.myPlayer.y);
  	}
  }
}

function deviceMotion(e) {
	if (g.isStarted && !g.isOver) {
	  var xvel = -e.accelerationIncludingGravity.x / 2;
	  var yvel = e.accelerationIncludingGravity.y / 2;

	  if (g.devicePlatform === "iOS") {
  		xvel *= -1;
  		yvel *= -1;
	  }
	  g.temp = xvel;

	  moveBall(xvel, yvel);
	}
}
