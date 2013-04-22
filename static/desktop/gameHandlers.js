canvas.addEventListener('mousedown', clicked, false);
document.onkeydown = onKeyDown;

function clicked(e) {
  if (g.isStarted) {
  	var angle = findAngle(e.x, e.y);
    if(g.myPlayer.powerups.bullets > 0) {
      g.myPlayer.powerups.bullets--;
      fireBullet(g.myPlayer.x, g.myPlayer.y, angle);
      socket.emit("bulletFired", {id: g.myID, playerX: g.myPlayer.x/c.GRID_WIDTH, playerY: g.myPlayer.y/c.GRID_HEIGHT, angle: angle});
    }
    else {
      dropMyBomb(g.myPlayer.x, g.myPlayer.y);
    }
  }
}

function onKeyDown(e) {
	if (g.isStarted) {
		// move left
		if (e.keyCode === 65) {
			moveBall(-5, 0);
		}
		// move right
		else if (e.keyCode === 68) {
			moveBall(5, 0);
		}
		// move up
		else if (e.keyCode === 87) {
			moveBall(0, -5);
		}
		// move down
		else if (e.keyCode === 83) {
			moveBall(0, 5);
		}
		// move up right
		else if (e.keyCode === 69) {
			moveBall(5, -5);
		}
		// move up left
		else if (e.keyCode === 81) {
			moveBall(-5, -5);
		}
	}
}