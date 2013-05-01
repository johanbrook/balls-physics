######################################
# Bouncing balls demo in CoffeeScript
#
# By Johan Brook, 2013
######################################

# Config

config = 
	gravity: 	9.82
	fps: 		60
	number_of_balls: 2


# Run

document.addEventListener 'DOMContentLoaded', (evt) ->
	context = document.getElementById("canvas")
	balls = create_balls(config.number_of_balls)

	animator = new Animator(context, balls)
	animator.go()



# Helper classes

class PolarPoint
	constructor: (@length, @angle) ->

class Point
	constructor: (@x, @y) ->


# Helper functions

create_balls = (amount) ->
	new Ball( x: num*40, y: 30, r: num*15, w: num*10, vx: 10*(-1*num), vy: 15) for num in [1..amount]

polar_to_rect = (length, degrees) ->
	x = length * Math.cos degrees
	y = length * Math.sin degrees
		
	new Point(x, y)

s4 = ->
  Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

guid = ->
  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

class Animator

	constructor: (canvas, @balls) ->
		@canvas = canvas.getContext("2d")
		[@width, @height] = [canvas.width, canvas.height]
		@timer = null

	go: ->
		interval = 1000 / config.fps

		@timer = setInterval =>
			@canvas.clearRect 0, 0, @width, @height

			dt = 1 / interval
			this.tick(dt)
			this.draw()

		, interval

	stop: ->
		clearInterval @timer
		@timer = null

	draw: ->
		@balls.forEach (ball) =>
			@canvas.beginPath()
			@canvas.fillStyle = ball.color
			@canvas.arc(ball.x, ball.y, ball.r, 0, Math.PI*2, true)
			@canvas.closePath()
			@canvas.fill()

	tick: (dt) ->
		console.log "In tick"
		@balls.forEach (ball) =>
			ball.vy = ball.vy + config.gravity * dt

			if ball.x < ball.r || ball.x > @width - ball.r
				ball.vx = ball.vx * -1

			if ball.y < ball.r || ball.y > @height - ball.r
				ball.vy = ball.vy * -1

			@balls.forEach (other_ball) ->
				
				if ball.id isnt other_ball.id 
					and ball.is_colliding_with other_ball

					# Calculate collision angle
					alpha = Math.atan2 ball.y - other_ball.y, ball.x - other_ball.x
					
					# Get the total velocity and direction for the balls,
					# i.e. the polar coordinate components length and angle.
					pp1 = ball.to_polar_point()
					pp2 = other_ball.to_polar_point()
					u1 = pp1.length
					u2 = pp2.length
					d1 = pp1.angle
					d2 = pp2.angle
					
					# Compute new coordinate system from the magnitude
					# and direction/collision angle of the balls.
					p1 = polar_to_rect(u1, d1-alpha)
					p2 = polar_to_rect(u2, d2-alpha)

					u1x = p1.x
					u1y = p1.y
					u2x = p2.x
					u2y = p2.y

					center = other_ball.get_center()
					
					# Now we are in the new coordinate system where the collision
					# will behave as in 1D, i.e. the balls are colliding in front
					# of each other (their direction is the normal line between them).
					
					# Solve the velocities along the new x-axis. 
					v1x = (u1x*(ball.w-other_ball.w) + 2*other_ball.w*u2x) / (ball.w+other_ball.w)
					v2x = (u2x*(other_ball.w-ball.w) + 2*ball.w*u1x) / (ball.w+other_ball.w)
					
					# The velocities along the y-axis are unchanged.
					v1y = u1y
					v2y = u2y

					# Convert back to Cartesian coords. PI / 2 is for shifting the direction
					# 90 degrees, since the X and Y axis are perpendicular. 
					ball.vx = Math.cos(alpha) * v1x + Math.cos(alpha + Math.PI / 2) * v1y
					ball.vy = Math.sin(alpha) * v1x + Math.sin(alpha + Math.PI / 2) * v1y
					
					other_ball.vx = Math.cos(alpha) * v2x + Math.cos(alpha + Math.PI / 2) * v2y
					other_ball.vy = Math.sin(alpha) * v2x + Math.sin(alpha + Math.PI / 2) * v2y

			ball.move(dt)

# The ball class

class Ball 

	constructor: (params) ->
		[@x, @y, @r, @w, @color, @vx, @vy] = 
		[params.x, params.y, params.r, params.w, params.color or 'red', params.vx or 0, params.vy or 0]

		@id = guid()

	get_center: ->
		new Point(@x+@r, @y+@r)

	get_velocity: ->
		Math.sqrt @vx*@vx + @vy*@vy

	get_direction: ->
		Math.atan2 @vy, @vx

	to_polar_point: ->
		new PolarPoint(this.get_velocity(), this.get_direction())

	move: (dt) ->
		@x += @vx * dt
		@y += @vy * dt

	is_colliding_with: (other_ball) ->
		dx = @x - other_ball.x
		dy = @y - other_ball.y
		r = @r + other_ball.r

		dx*dx + dy*dy < r*r
