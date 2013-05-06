# 	Physics demo with bouncing balls.
# 	
# 	(c) Johan Brook 2013. MIT Licensed.
# 	http://johanbrook.com
# 	http://github.com/johanbrook
# 
# Required Javascript APIs: `Canvas` and `requestAnimationFrame`.

# # Setup

# Set some config variables for our scenario.
config = 
	gravity: 	9.82
	fps: 		60
	number_of_balls: 2

# When the document has loaded, create a new animator from a graphics
# context and some balls.
document.addEventListener 'DOMContentLoaded', (evt) ->
	context = document.getElementById("canvas")
	balls = create_balls(config.number_of_balls)

	animator = new Animator(context, balls)
	# Start the scene.
	animator.go()

# # Classes

# ## Helpers

# Define helper classes for polar points and regular points with
# Cartesian coordinates.
class PolarPoint
	constructor: (@len, @angle) ->

class Point
	constructor: (@x, @y) ->

# ## The Animator class

# The animator class is responsible for the scene, i.e. drawing and updating
# positions of the objects. Uses `window.requestAnimationFrame` for animation.
class Animator

	# Create a new animation on a `<canvas>` element and from an
	# array of preconstruted balls.
	constructor: (canvas, @balls) ->
		@canvas = canvas.getContext("2d")
		# Set the update interval according to the desired FPS.
		@interval = 1000 / config.fps
		[@width, @height] = [canvas.width, canvas.height]

	# Init function for the animator. Will start animating (updating and drawing) the scene.
	go: =>
		# Request a frame, with `go` as its own callback.
		window.requestAnimationFrame(this.go)
		# Update all movements for a delta time and redraw all
		# objects on the canvas according to the newly updated movements.
		this.tick(1/@interval)
		this.draw()

	# The draw method redraws each element in `@balls`. 
	draw: ->
		@canvas.clearRect 0, 0, @width, @height

		for ball in @balls
			@canvas.beginPath()
			@canvas.fillStyle = ball.color
			@canvas.arc(ball.x, ball.y, ball.r, 0, Math.PI*2, true)
			@canvas.closePath()
			@canvas.fill()

	# For each tick, update the movements of the objects.
	tick: (dt) ->

		for ball in @balls

			# ### Gravity

			# Firstly, update the ball's vertical gravity by setting a new
			# vertical velocity from the gravity config variable.
			ball.vy = ball.vy + config.gravity * dt

			# ### Wall collisions

			# In order to check for collisions, we need to clone the ball object
			# and then move it one frame ahead, and then use it to foresee a collision.
			# We do this to avoid real-time glitches when two object collide.
			ghost_ball = ball.clone()
			ghost_ball.move(dt)

			# Check for collisions with walls. If the ball is colliding, reverse
			# the horizontal and vertical velocities.
			if ghost_ball.x < ghost_ball.r or ghost_ball.x > @width - ghost_ball.r
				ball.vx = ball.vx * -1

			if ghost_ball.y < ghost_ball.r or ghost_ball.y > @height - ghost_ball.r
				ball.vy = ball.vy * -1

			# ### Ball collisions

			for other_ball in @balls

				# Again, we're cloning the ball to check for a collision with
				# another ball.
				ghost_ball = ball.clone()
				ghost_ball.move(dt)
				
				# Make sure it's not the same ball. Then see if there's a collision (overlap).
				if ball.id isnt other_ball.id and ghost_ball.is_colliding_with other_ball

					# First calculate the collision angle from the balls coordinates.
					alpha = Math.atan2 ball.y - other_ball.y, ball.x - other_ball.x
					
					# Get the total velocity and direction for the balls,
					# i.e. the polar coordinate components length and angle.
					pp1 = ball.to_polar_point()
					pp2 = other_ball.to_polar_point()
					
					[u1, u2, d1, d2] = [pp1.len, pp2.len, pp1.angle, pp2.angle]
					
					# Compute new coordinate system from the magnitude
					# and direction/collision angle of the balls.
					[p1, p2] = [polar_to_rect(u1, d1-alpha), polar_to_rect(u2, d2-alpha)]

					[u1x, u1y, u2x, u2y] = [p1.x, p1.y, p2.x, p2.y]
					
					# Now we are in the new coordinate system where the collision
					# will behave as in 1D, i.e. the balls are colliding in front
					# of each other (their direction is the normal line between them).
					
					# Solve the velocities along the new x-axis. This is done according to the
					# formula for preserving kinetic energy for two objects.
					# 
					# 	m1 v1^2  +  m2 v2^2   =   m1 u1^2  +  m2 u2^2
     				# 	-------     -------       -------     -------
        			#			2           2             2           2
        			#			
        			# [More info about the underlying physics computations](http://www.cse.chalmers.se/edu/year/2010/course/DAT026/CourseMaterial/lecture5.txt).
					v1x = (u1x*(ball.w-other_ball.w) + 2*other_ball.w*u2x) / (ball.w+other_ball.w)
					v2x = (u2x*(other_ball.w-ball.w) + 2*ball.w*u1x) / (ball.w+other_ball.w)
					
					# The velocities along the y-axis are unchanged.
					v1y = u1y
					v2y = u2y

					# Convert back to Cartesian coords. PI / 2 is for shifting the direction
					# 90 degrees, since the X and Y axis are perpendicular. 
					ball.vx = polar_to_rect(v1x, alpha).x + polar_to_rect(v1y, alpha + Math.PI / 2).x
					ball.vy = polar_to_rect(v1x, alpha).y + polar_to_rect(v1y, alpha + Math.PI / 2).y
					
					other_ball.vx = polar_to_rect(v2x, alpha).x + polar_to_rect(v2y, alpha + Math.PI / 2).x
					other_ball.vy = polar_to_rect(v2x, alpha).y + polar_to_rect(v2y, alpha + Math.PI / 2).y

			# Lastly, move the ball. This will update it's coordinates according 
			# to the newly set velocities.
			ball.move(dt)


# ## The Ball class

# This class models a single ball with properties like coordinates,
# velocities, weight, radius and color.
class Ball 

	constructor: (params) ->
		[@x, @y, @r, @w, @color, @vx, @vy] = 
		[params.x, params.y, params.r, params.w, params.color or 'red', params.vx or 0, params.vy or 0]

		# Set a unique id on this ball instance.
		@id = guid()

	# A method for cloning this ball object.
	clone: ->
		new Ball( x: @x, y: @y, r: @r, w: @w, color: @color, vx: @vx, vy: @vy )

	# Returns the velocity of this ball (basically the hypotenuse).
	get_velocity: ->
		Math.sqrt @vx*@vx + @vy*@vy

	# Returns the direction of this ball.
	get_direction: ->
		Math.atan2 @vy, @vx

	# Convert this ball's coordinates to polar coordinates, returns a `PolarPoint`. 
	to_polar_point: ->
		new PolarPoint(this.get_velocity(), this.get_direction())

	# Move this ball according to its velocity and delta time. This will update
	# the ball's coordinates.
	move: (dt) ->
		@x += @vx * dt
		@y += @vy * dt

	# Check to see if this ball collides (overlaps) with `other_ball`. Returns
	# `true` on collision, `false` otherwise. 
	is_colliding_with: (other_ball) ->
		# If the sum of the squares of the difference in coordinates are
		# less that the square of the sums of the radii, the balls are colliding.
		dx = @x - other_ball.x
		dy = @y - other_ball.y
		r = @r + other_ball.r

		dx*dx + dy*dy < r*r

# # Functions

# Helper function to create a given number of balls.
create_balls = (amount) ->
	new Ball( x: num*60, y: 40, r: num*20, w: num*10, vx: 10*(-1*num)) for num in [1..amount]

# Helper function to convert polar coordinates to Cartesian coordinates. Returns a Point object.
polar_to_rect = (len, degrees) ->
	x = len * Math.cos degrees
	y = len * Math.sin degrees
		
	new Point(x, y)

# Generate a randomized string.
s4 = ->
  Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

# Generate a unique object ID for comparisons.
guid = ->
  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
