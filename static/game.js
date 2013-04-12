/*
	Willy - can roll around on phone now
			going to put in boundaries and bombs next
*/

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// sockets
var socket = io.connect("http://localhost:8888");

socket.on("connected", function (data) {
	g.myPlayer = new Player(data.x, data.y);
	g.myID = data.id;

	g.enemies = new Object();
	var players = data.players;
	for (var id in players) {
		g.enemies[id] = new Player(players[id].x, players[id].y);
	}

	init();
});

socket.on("playerConnected", function (data) {
	g.enemies[data.id] = new Player(data.x, data.y);
});

socket.on("receivePosition", function (data) {
	if (g.enemies[data.id] === undefined) {
		g.enemies[data.id] = new Player(data.player.x, data.player.y);
	}
	else {
		g.enemies[data.id].x = data.player.x;
		g.enemies[data.id].y = data.player.y;
		g.enemies[data.id].hp = data.player.hp;
	}
});

socket.on("placeBomb", function (data) {
	dropBomb(data.x, data.y);
});

socket.on("respawn", function (data) {
	console.log("respawning");
	g.myPlayer = new Player(data.x, data.y);
});

socket.on("playerDied", function (data) {
	g.enemies[data.id] = new Player(data.x, data.y);
});

socket.on("playerLeft", function (data) {
	delete g.enemies[data.id];
});

socket.on("fireBullet", function (data) {
  fireBullet(data.playerX, data.playerY, data.targetX, data.targetY);
});

// Globals
var g = {
	drawHandler: null,
  bulletHandler: null,
	myPlayer: null,
	myID: 0,
	bombs: null,
	rocks: null,
	powerups: null,
  bullets: null,
	enemies: null,
	backgroundImg: null,
	platformImg: null,
}

// Constants
var c = {
	MAP_WIDTH: 800,
	MAP_HEIGHT: 800,

	BALL_RADIUS: 30,

	ROCK_SIZE: 50,

	BOMB_RADIUS: 25,
	BOMB_TIME: 5,
	BOMB_EXPLOSION_RADIUS: 100,

	POWERUP_SIZE: 50,

	BULLET_SIZE: 15,
	BULLET_MOVE: 3,

	BASE_HP: 100,

	PLATFORM_IMG_WIDTH: 512,
	PLATFORM_IMG_HEIGHT: 512,

	GRID_SIZE: 50,
}

window.addEventListener('devicemotion', function(event) {
  var xvel = -event.accelerationIncludingGravity.x / 2;
  var yvel = event.accelerationIncludingGravity.y / 2;

  moveBall(xvel, yvel);
});

function init() {
	g.bombs = [];
	g.rocks = [];
	g.powerups = [new Powerup(300, 300, "bullet")];
	g.bullets = [];

	g.backgroundImg = new Image();
	g.backgroundImg.src = "spaceBackground.jpg"
	g.platformImg = new Image();
	g.platformImg.src = "spacePlatform.jpg"

	generateRocks();

	canvas.addEventListener('touchstart', onTouch, false);
	canvas.addEventListener('mousedown', clicked, false);
	document.onkeydown = onKeyDown;

	g.drawHandler = setInterval(draw, 50);
}

function draw() {
	ctx.clearRect(0,0,canvas.width, canvas.height);

	// background
	// ctx.drawImage(g.backgroundImg, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

	// draw land as a grid
	ctx.fillStyle = "green";
	if (g.myPlayer.x < canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
			drawGrid(canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
			drawGrid(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
			drawGrid(canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
		}
	}
	else if (g.myPlayer.x > c.MAP_WIDTH - canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
			drawGrid(0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
			drawGrid(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
			drawGrid(0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
		}
	}
	else {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.fillRect(0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
			drawGrid(0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.fillRect(0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
			drawGrid(0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			drawGrid(0, 0, canvas.width, canvas.height);
		}
	}

	/*
	// draw land from img
	if (g.myPlayer.x < canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.drawImage(g.platformImg, 0, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y,
						canvas.width/2 - g.myPlayer.x, canvas.height/2 - g.myPlayer.y, canvas.width/2 + g.myPlayer.x, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.drawImage(g.platformImg, 0, c.MAP_HEIGHT - (canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y)), canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y),
						canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.drawImage(g.platformImg, 0, g.myPlayer.y - canvas.height/2, canvas.width/2 + g.myPlayer.x, canvas.height,
						canvas.width/2 - g.myPlayer.x, 0, canvas.width/2 + g.myPlayer.x, canvas.height);
		}
	}
	else if (g.myPlayer.x > c.MAP_WIDTH - canvas.width/2) {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.drawImage(g.platformImg, c.MAP_WIDTH - (canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x)), 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y,
						0, canvas.height/2 - g.myPlayer.y, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.drawImage(g.platformImg, c.MAP_WIDTH - (canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x)), c.MAP_HEIGHT - (canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y)), canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y),
						0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.drawImage(g.platformImg, c.MAP_WIDTH - (canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x)), g.myPlayer.y - canvas.height/2, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height,
						0, 0, canvas.width/2 + (c.MAP_WIDTH - g.myPlayer.x), canvas.height);
		}
	}
	else {
		if (g.myPlayer.y < canvas.height/2) {
			ctx.drawImage(g.platformImg, g.myPlayer.x - canvas.width/2, 0, canvas.width, canvas.height/2 + g.myPlayer.y,
						0, canvas.height/2 - g.myPlayer.y, canvas.width, canvas.height/2 + g.myPlayer.y);
		}
		else if (g.myPlayer.y > c.MAP_HEIGHT - canvas.height/2) {
			ctx.drawImage(g.platformImg, g.myPlayer.x - canvas.width/2, c.MAP_HEIGHT - (canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y)), canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y),
						0, 0, canvas.width, canvas.height/2 + (c.MAP_HEIGHT - g.myPlayer.y));
		}
		else {
			ctx.drawImage(g.platformImg, g.myPlayer.x - canvas.width/2, g.myPlayer.y - canvas.height/2, canvas.width, canvas.height,
						0, 0, canvas.width, canvas.height);
		}
	}*/

	// draw bombs
	g.bombs.forEach( function(bomb) {
		if (bomb.x + c.BOMB_RADIUS >= g.myPlayer.x - canvas.width/2 && bomb.x - c.BOMB_RADIUS < g.myPlayer.x + canvas.width/2
			&& bomb.y + c.BOMB_RADIUS >= g.myPlayer.y - canvas.height/2 && bomb.y - c.BOMB_RADIUS < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - bomb.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - bomb.y);

			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BOMB_RADIUS, 0, 2*Math.PI, true);
			ctx.fill();

			ctx.fillStyle = "white";
			ctx.font = "30px Arial";
			ctx.textAlign = "center";
			ctx.fillText(bomb.time + "", xpos, ypos);
		}
	});

	// draw rocks
	g.rocks.forEach( function (rock) {
		if (rock.x + rock.size/2 >= g.myPlayer.x - canvas.width/2 && rock.x - rock.size/2 < g.myPlayer.x + canvas.width/2
			&& rock.y + rock.size/2 >= g.myPlayer.y - canvas.height/2 && rock.y - rock.size/2 < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - rock.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - rock.y);

			ctx.fillStyle = "grey";
			ctx.fillRect(xpos - rock.size/2, ypos - rock.size/2, rock.size, rock.size);
		}
	});

	// draw powerups
	g.powerups.forEach( function(powerup) {
		if (powerup.x >= g.myPlayer.x - canvas.width/2 && powerup.x < g.myPlayer.x + canvas.width/2
			&& powerup.y >= g.myPlayer.y - canvas.height/2 && powerup.y < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - powerup.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - powerup.y);

			ctx.fillStyle = "yellow";
			ctx.fillRect(xpos - c.POWERUP_SIZE/2, ypos - c.POWERUP_SIZE/2, c.POWERUP_SIZE, c.POWERUP_SIZE);
		}
	});

  // draw bullets
  g.bullets.forEach( function(bullet) {
    if (bullet.x >= g.myPlayer.x - canvas.width/2 && bullet.x < g.myPlayer.x + canvas.width/2
      && bullet.y >= g.myPlayer.y - canvas.height/2 && bullet.y < g.myPlayer.y + canvas.height/2) {
      var xpos = canvas.width/2 - (g.myPlayer.x - bullet.x);
      var ypos = canvas.height/2 - (g.myPlayer.y - bullet.y);

      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(xpos, ypos, c.BULLET_SIZE, 0, 2*Math.PI, true);
      ctx.fill();
    }
  });

	// draw enemies
	for (var enemyID in g.enemies) {
		var enemy = g.enemies[enemyID];
		if (enemy.x + c.BALL_RADIUS >= g.myPlayer.x - canvas.width/2 && enemy.x - c.BALL_RADIUS < g.myPlayer.x + canvas.width/2
			&& enemy.y + c.BALL_RADIUS >= g.myPlayer.y - canvas.height/2 && enemy.y - c.BALL_RADIUS < g.myPlayer.y + canvas.height/2) {
			var xpos = canvas.width/2 - (g.myPlayer.x - enemy.x);
			var ypos = canvas.height/2 - (g.myPlayer.y - enemy.y);

			ctx.fillStyle = "black";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BALL_RADIUS, 0, 2*Math.PI, true);
			ctx.fill();

			// hp
			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(xpos, ypos, c.BALL_RADIUS * (1 - ((c.BASE_HP - enemy.hp) / c.BASE_HP)), 0, 2*Math.PI, true);
			ctx.fill();
		}
	}

	// draw player
	ctx.fillStyle = "black";
	ctx.beginPath();
	ctx.arc(canvas.width/2, canvas.height/2, c.BALL_RADIUS, 0, 2*Math.PI, true);
	ctx.fill();

	// hp
	ctx.fillStyle = "blue";
	ctx.beginPath();
	ctx.arc(canvas.width/2, canvas.height/2, c.BALL_RADIUS * (1 - ((c.BASE_HP - g.myPlayer.hp) / c.BASE_HP)), 0, 2*Math.PI, true);
	ctx.fill();
}

function drawGrid(x, y, width, height) {
	var size = c.GRID_SIZE;

	// round size to last ROCK_SIZE multiple
	if (width % size != 0)
		width += size - (width % size);
	if (height % size != 0)
		height += size - (height % size);

	// adjust for maximums
	if (g.myPlayer.x >= c.MAP_WIDTH - canvas.width/2)
		width -= size;
	if (g.myPlayer.y >= c.MAP_HEIGHT - canvas.height/2)
		height -= size;

	// reduce starting point of grid to make animation flow
	var reducex = 0;
	var reducey = 0;
	if (g.myPlayer.x >= canvas.width/2)
		reducex = g.myPlayer.x % size;
	if (g.myPlayer.y >= canvas.height/2)
		reducey = g.myPlayer.y % size;

	ctx.lineWidth = 2;
	for (var i = 0; i <= width; i+=size) {
		for (var j = 0; j <= height; j+=size) {
			ctx.strokeRect(x + i - reducex, y + j - reducey, size, size);
		}
	}
}

function generateRocks() {
	for (var i = c.ROCK_SIZE/2; i < c.MAP_WIDTH - c.ROCK_SIZE/2; i+=c.ROCK_SIZE*4) {
		for (var	 j = c.ROCK_SIZE/2; j < c.MAP_HEIGHT - c.ROCK_SIZE/2; j+=c.ROCK_SIZE*4) {
			g.rocks.push(new Rock(i, j));
		}
	}
}

function dropBomb(x, y) {
	var bomb = new Bomb(x, y);
	g.bombs.push(bomb);
}

function explodeBomb(bomb) {
	var explodedRocks = [];

	// find exploded nearby rocks
	g.rocks.forEach( function(rock) {
		var dist = Math.sqrt((rock.x - bomb.x)*(rock.x - bomb.x) + (rock.y - bomb.y)*(rock.y - bomb.y));

		if (dist < c.BOMB_EXPLOSION_RADIUS) {
			explodedRocks.push(rock);
		}
	});

	// remove exploded rocks
	removeRocks(explodedRocks);

	// hurt player
	var dist = Math.sqrt((g.myPlayer.x - bomb.x)*(g.myPlayer.x - bomb.x) + (g.myPlayer.y - bomb.y)*(g.myPlayer.y - bomb.y));
	if (dist < c.BOMB_EXPLOSION_RADIUS) {
		g.myPlayer.hp -= 50;

		checkForDeath();
	}

	// remove bomb
	g.bombs.splice(g.bombs.indexOf(bomb), 1);
}

function removeRocks(rocks) {
  rocks.forEach( function(rock) {
    var rockX = rock.x;
    var rockY = rock.y;
    g.rocks.splice(g.rocks.indexOf(rock), 1);
    if (Math.random() < 0.4) {
      // add powerup block
      var power = new Powerup(rockX, rockY, "bullet");
      g.powerups.push(power);
    }
  });
}

function newPowerup () {
  // TODO: for adding random powerups
}

function checkForDeath() {
	if (g.myPlayer.hp <= 0) {
		console.log("dead");
		g.isDead = true;
		socket.emit("sendDeath", {id: g.myID});
	}
}

function decrementTimer(bomb) {
	bomb.time--;

	if (bomb.time <= 0) {
		clearInterval(bomb.timerHandler);
		explodeBomb(bomb);
	}
}

function fireBullet(playerX, playerY, targetX, targetY) {
  // Finding angle of direction
  var deltaX = targetX - (playerX + c.BALL_RADIUS);
  var deltaY = targetY - (playerY - c.BALL_RADIUS);
  var theta = Math.atan2(-deltaY, deltaX);
  if (theta < 0) {
    theta += 2 * Math.PI;
  }
  theta = theta * (180 / Math.PI);
  var moveX = c.BALL_RADIUS * 2 * Math.cos(theta * Math.PI / 180);
  var moveY = c.BALL_RADIUS * 2 * Math.sin(theta * Math.PI / 180);
  g.bullets.push(new Bullet(playerX + moveX, playerY - moveY, theta));
  if (g.bullets.length === 1) {
    g.bulletHandler = setInterval(moveBullets, 30);
  }
}

function moveBullets() {
  // Decimal values here might make it lag, but rounding will make non-straight lines
  g.bullets.forEach(function (bullet, index) {
    checkBulletCollision(index);
    var deltaX = c.BULLET_MOVE * Math.cos(bullet.direction * Math.PI / 180);
    var deltaY = c.BULLET_MOVE * Math.sin(bullet.direction * Math.PI / 180);
    bullet.x += deltaX;
    bullet.y -= deltaY;
  });
}

function moveBall(xvel, yvel) {
	if (!checkForCollision(xvel, yvel)) {
		g.myPlayer.x = g.myPlayer.x + xvel;
		g.myPlayer.y = g.myPlayer.y + yvel;
	}

	socket.emit("sendPosition", {id: g.myID, player: g.myPlayer});
}

function checkForCollision(xvel, yvel) {
	// check for map boundary collision
	if (checkBoundaryCollision(xvel, yvel)) {
		return true;
	}
	if (checkRockCollision(xvel, yvel)) {
		return true;
	}
	checkPowerupCollision(xvel, yvel);
	return false;
}

function checkBoundaryCollision(xvel, yvel) {
	if (g.myPlayer.x - c.BALL_RADIUS + xvel < 0) {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0)
			g.myPlayer.y = c.BALL_RADIUS;
		else if (g.myPlayer.y + c.BALL_RADIUS + xvel > c.MAP_HEIGHT)
			g.myPlayer.y = c.MAP_HEIGHT - c.BALL_RADIUS;
		else
			// change y position by the fraction of the distance traveled
			// g.myPlayer.y = g.myPlayer.y + yvel * ((xvel - g.myPlayer.x) / xvel);
			g.myPlayer.y = g.myPlayer.y + yvel;

		g.myPlayer.x = c.BALL_RADIUS;
		return true;
	}
	else if (g.myPlayer.x + c.BALL_RADIUS + xvel > c.MAP_WIDTH) {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0)
			g.myPlayer.y = c.BALL_RADIUS;
		else if (g.myPlayer.y + c.BALL_RADIUS + xvel > c.MAP_HEIGHT)
			g.myPlayer.y = c.MAP_HEIGHT - c.BALL_RADIUS;
		else
			// change y position by the fraction of the distance traveled
			//g.myPlayer.y = g.myPlayer.y + yvel * ((xvel - (c.MAP_WIDTH - g.myPlayer.x)) / xvel);
			g.myPlayer.y = g.myPlayer.y + yvel;

		g.myPlayer.x = c.MAP_WIDTH - c.BALL_RADIUS;
		return true;
	}
	else {
		if (g.myPlayer.y - c.BALL_RADIUS + yvel < 0) {
			//g.myPlayer.x = g.myPlayer.x + xvel * ((yvel - g.myPlayer.y) / yvel);
			g.myPlayer.x = g.myPlayer.x + xvel;
			g.myPlayer.y = c.BALL_RADIUS;
			return true;
		}
		else if (g.myPlayer.y + c.BALL_RADIUS + xvel > c.MAP_HEIGHT) {
			//g.myPlayer.x = g.myPlayer.x + xvel * ((yvel - (c.MAP_HEIGHT - g.myPlayer.y)) / yvel);
			g.myPlayer.x = g.myPlayer.x + xvel;
			g.myPlayer.y = c.MAP_HEIGHT - c.BALL_RADIUS;
			return true;
		}
	}
	return false;
}

function checkRockCollision(xvel, yvel) {
	var hitrock = false;
	g.rocks.forEach( function(rock) {
		if (g.myPlayer.x + c.BALL_RADIUS + xvel >= rock.x - rock.size/2 && g.myPlayer.x - c.BALL_RADIUS + xvel < rock.x + rock.size/2
			&& g.myPlayer.y + c.BALL_RADIUS + yvel >= rock.y - rock.size/2 && g.myPlayer.y - c.BALL_RADIUS + yvel < rock.y + rock.size/2) {
			hitrock = true;
		}
	});

	return hitrock;
}

function checkPowerupCollision(xvel, yvel) {
  g.powerups.forEach( function(powerup) {
    if (g.myPlayer.x + c.BALL_RADIUS + xvel >= powerup.x - c.POWERUP_SIZE/2 && g.myPlayer.x - c.BALL_RADIUS + xvel < powerup.x + c.POWERUP_SIZE/2
      && g.myPlayer.y + c.BALL_RADIUS + yvel >= powerup.y - c.POWERUP_SIZE/2 && g.myPlayer.y - c.BALL_RADIUS + yvel < powerup.y + c.POWERUP_SIZE/2) {
      addPowerup(powerup);
    }
  });
}

function checkBulletCollision(bullet_index) {
  bullet = g.bullets[bullet_index];
  // TODO: Must be a more efficient way to do this
  g.rocks.forEach( function(rock) {
    var dist = Math.sqrt((rock.x - bullet.x)*(rock.x - bullet.x) + (rock.y - bullet.y)*(rock.y - bullet.y));
    if (dist < c.BULLET_SIZE * 3) {
      // Remove exploded rock
      var rocks = [rock];
      removeRocks(rocks);
      g.bullets.splice(bullet_index, 1);
      if (g.bullets.length === 0) {
        clearInterval(g.bulletHandler);
      }
      // TODO: add emit event here for bullet removal?
      return;
    }
  });
  if (g.myPlayer.x + c.BALL_RADIUS >= bullet.x - c.BULLET_SIZE/2 && g.myPlayer.x - c.BALL_RADIUS < bullet.x + c.BULLET_SIZE/2
    && g.myPlayer.y + c.BALL_RADIUS >= bullet.y - c.BULLET_SIZE/2 && g.myPlayer.y - c.BALL_RADIUS < bullet.y + c.BULLET_SIZE/2) {
    g.bullets.splice(bullet_index, 1);
    if (g.bullets.length === 0) {
      clearInterval(g.bulletHandler);
    }
    // TODO: add emit event here for bullet removal?
    // Damage player
    g.myPlayer.hp -= 30;
    checkForDeath();
  }
}

function addPowerup(powerup) {
  g.myPlayer.powerups.push(powerup.power);
  g.powerups.splice(g.powerups.indexOf(powerup), 1);
  // TODO: add emit event here (twice?)
  console.log(g.myPlayer.powerups);
}

function Player(x, y) {
	this.x = x;
	this.y = y;
    this.powerups = [];
	this.hp = c.BASE_HP;
}

function Rock(x, y) { // Should we use prototypes for all obstacles? >>yes<<
	this.x = x;
	this.y = y;
	this.size = c.ROCK_SIZE;
}

function Powerup(x, y, power) {
	this.x = x;
	this.y = y;
	this.power = power;
}

function Bomb(x, y) {
	var bomb = this;
	this.x = x;
	this.y = y;
	this.time = c.BOMB_TIME;
	this.timerHandler = setInterval( function() { decrementTimer(bomb); }, 1000 );
}

function Bullet(x, y, direction) {
  this.x = x;
  this.y = y;
  this.direction = direction;
}

function onTouch(e) {
  if(g.myPlayer.powerups.indexOf("bullet") !== -1) {
    fireBullet(g.myPlayer.x, g.myPlayer.y, e.changedTouches.pageX, e.changedTouches.pageY);
    socket.emit("bulletFired", {id: g.myID, playerX: g.myPlayer.x, playerY: g.myPlayer.y, targetX: e.changedTouches.pageX, targetY: e.changedTouches.pageY});
  }
  else {
    dropBomb(g.myPlayer.x, g.myPlayer.y);
    socket.emit("bombDropped", {id: g.myID, x: g.myPlayer.x, y: g.myPlayer.y});
  }
}

function clicked(e) {
  if(g.myPlayer.powerups.indexOf("bullet") !== -1) {
    fireBullet(g.myPlayer.x, g.myPlayer.y, e.x, e.y);
    socket.emit("bulletFired", {id: g.myID, playerX: g.myPlayer.x, playerY: g.myPlayer.y, targetX: e.x, targetY: e.y});
  }
  else {
    dropBomb(g.myPlayer.x, g.myPlayer.y);
    socket.emit("bombDropped", {id: g.myID, x: g.myPlayer.x, y: g.myPlayer.y});
  }
}

function onKeyDown(e) {
	// space - drop bomb
	if (e.keyCode === 32) {
		dropBomb(g.myPlayer.x, g.myPlayer.y);
		socket.emit("bombDropped", {id: g.myID, x: g.myPlayer.x, y: g.myPlayer.y});
	}
	// move left
	else if (e.keyCode === 65) {
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
