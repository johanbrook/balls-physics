(function() {
	var context, 
		Gravity = 9.82, 
		FPS = 60, 
		allBalls = [],
		timer,
		width = 700, 
		height = 300;

	document.addEventListener('DOMContentLoaded', init);

	function init() {
		initializeControls();
		begin();
	}

	var Ball = function(obj) {
		this.x = obj.x, 
		this.y = obj.y, 
		this.r = obj.r, 
		this.vx = 0, 
		this.vy = 0, 
		this.w = obj.weight,
		this.color = obj.color;
	}

	Ball.prototype.getCenter = function() {
		return new Point(this.x+this.r, this.y+this.r);
	};

	Ball.prototype.toPolar = function() {
		return new PolarPoint(this.getVelocity(), this.getDirection());
	};

	Ball.prototype.isColliding = function(b) {
		var dx = this.x - b.x;
		var dy = this.y - b.y;
		var r = this.r + b.r;
		
		return dx*dx + dy*dy < r*r;
	};

	Ball.prototype.getVelocity = function() {
		return Math.sqrt(this.vx*this.vx + this.vy*this.vy);
	};

	Ball.prototype.getDirection = function() {
		return Math.atan2(this.vy, this.vx);
	};

	function draw() {
		allBalls.forEach(function(ball, _) {
			context.beginPath();
			context.fillStyle=ball.color;
			context.arc(ball.x, ball.y, ball.r, 0, Math.PI*2, true); 
			context.closePath();
			context.fill();
		});
	};

	function tick(dt) {
		allBalls.forEach(function(ball, _) {
			ball.vy = ball.vy + Gravity * dt;

			if(ball.x < ball.r || ball.x > width - ball.r) {
				ball.vx = ball.vx * -1;
			}
			if (ball.y < ball.r || ball.y > height - ball.r) {
				ball.vy = ball.vy * -1;
			}

			allBalls.forEach(function(ball2, _) {
				if(ball !== ball2 && ball.isColliding(ball2)) {
					console.log("collide");

					var alpha, u1, u2, d1, d2, u1x, u1y, u2x, u2y, v1x, v1y, v2x, v2y,
						pp1, pp2, p1, p2;

					// Calculate collision angle
					alpha = Math.atan2(ball.y - ball2.y, ball.x - ball2.x);
					
					// Get the total velocity and direction for the balls,
					// i.e. the polar coordinate components length and angle.
					pp1 = ball.toPolar();
					pp2 = ball2.toPolar();
					u1 = pp1.len;
					u2 = pp2.len;
					d1 = pp1.angle;
					d2 = pp2.angle;
					
					// Compute new coordinate system from the magnitude
					// and direction/collision angle of the balls.
					p1 = polarToRect(u1, d1-alpha);
					p2 = polarToRect(u2, d2-alpha);

					u1x = p1.x;
					u1y = p1.y;
					u2x = p2.x;
					u2y = p2.y;

					var center = ball2.getCenter();
					console.log(alpha);
					
					// Now we are in the new coordinate system where the collision
					// will behave as in 1D, i.e. the balls are colliding in front
					// of each other (their direction is the normal line between them).
					
					// Solve the velocities along the new x-axis. 
					v1x = (u1x*(ball.w-ball2.w) + 2*ball2.w*u2x) / (ball.w+ball2.w);
					v2x = (u2x*(ball2.w-ball.w) + 2*ball.w*u1x) / (ball.w+ball2.w);
					
					// The velocities along the y-axis are unchanged.
					v1y = u1y;
					v2y = u2y;

					// Convert back to Cartesian coords. PI / 2 is for shifting the direction
					// 90 degrees, since the X and Y axis are perpendicular. 
					ball.vx = Math.cos(alpha) * v1x + Math.cos(alpha + Math.PI / 2) * v1y;
					ball.vy = Math.sin(alpha) * v1x + Math.sin(alpha + Math.PI / 2) * v1y;
					
					ball2.vx = Math.cos(alpha) * v2x + Math.cos(alpha + Math.PI / 2) * v2y;
					ball2.vy = Math.sin(alpha) * v2x + Math.sin(alpha + Math.PI / 2) * v2y;
				}
			});

			ball.x += ball.vx * dt;
			ball.y += ball.vy * dt;
		});
	}

	function animate(balls) {
		timer = setInterval(function() {
			context.clearRect(0,0, width, height);

			balls.forEach(function(ball, _) {
				var dt = 1/(1000/FPS);
				tick(dt);
				draw();
			});
		}, 1000/FPS);
	}

	function rectToPolar(x, y) {
		var length = Math.sqrt(x*x + y*y);
		var degrees = Math.atan2(y, x);
			
		return new PolarPoint(length, degrees);
	}
		
	function rectToPolar(p) {
		return rectToPolar(p.x, p.y);
	}

	function polarToRect(length, degrees) {
		x = length * Math.cos(degrees);
		y = length * Math.sin(degrees);
			
		return new Point(x, y);
	}

	// Help classes
 	function PolarPoint(length, angle) {
 		this.len = length;
 		this.angle = angle;
 	}

 	function Point(x, y) {
 		this.x = x;
 		this.y = y;
 	}

 	function initializeControls() {
 		var start = document.getElementById("start"),
 			stop = document.getElementById("stop"),
 			restart = document.getElementById("restart");

 		stop.setAttribute("disabled", true);
 		restart.setAttribute("disabled", true);
 		
 		start.addEventListener("click", function(evt) {
 			animate(allBalls);

 			stop.removeAttribute("disabled");
 			restart.removeAttribute("disabled");
 			this.setAttribute("disabled", true);
 		}, false);

 		stop.addEventListener("click", function(evt) {
 			clearInterval(timer);
 			timer = null;
 			this.setAttribute("disabled", true);
 			start.removeAttribute("disabled");
 		}, false);

 		restart.addEventListener("click", function(evt) {
 			cleanUp();
 			begin();
 			start.removeAttribute("disabled");
 		}, false);
 	}

 	function cleanUp() {
 		clearInterval(timer);
 		timer = null;
 		allBalls = [];
 		context.clearRect(0,0, width, height);
 	}

	function begin() {
		console.log("Initializing");

		context = document.getElementById("canvas").getContext('2d');
		var b = new Ball({
			x: 100,
			y: 110,
			r: 30,
			color: "blue",
			weight: 20
		});

		var b2 = new Ball({
			x: 150,
			y: 200,
			r: 40,
			color: "red",
			weight: 40
		});

		allBalls = [b, b2];
	}
})();