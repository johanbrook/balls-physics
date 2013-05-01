(function() {
  var Animator, Ball, Point, PolarPoint, config, create_balls, guid, polar_to_rect, s4;

  config = {
    gravity: 9.82,
    fps: 60,
    number_of_balls: 2
  };

  document.addEventListener('DOMContentLoaded', function(evt) {
    var animator, balls, context;
    context = document.getElementById("canvas");
    balls = create_balls(config.number_of_balls);
    animator = new Animator(context, balls);
    return animator.go();
  });

  PolarPoint = (function() {

    function PolarPoint(length, angle) {
      this.length = length;
      this.angle = angle;
    }

    return PolarPoint;

  })();

  Point = (function() {

    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    return Point;

  })();

  create_balls = function(amount) {
    var num, _results;
    _results = [];
    for (num = 1; 1 <= amount ? num <= amount : num >= amount; 1 <= amount ? num++ : num--) {
      _results.push(new Ball({
        x: num * 40,
        y: 30,
        r: num * 15,
        w: num * 10,
        vx: 10 * (-1 * num),
        vy: 15
      }));
    }
    return _results;
  };

  polar_to_rect = function(length, degrees) {
    var x, y;
    x = length * Math.cos(degrees);
    y = length * Math.sin(degrees);
    return new Point(x, y);
  };

  s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  guid = function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

  Animator = (function() {

    function Animator(canvas, balls) {
      var _ref;
      this.balls = balls;
      this.canvas = canvas.getContext("2d");
      _ref = [canvas.width, canvas.height], this.width = _ref[0], this.height = _ref[1];
      this.timer = null;
    }

    Animator.prototype.go = function() {
      var interval,
        _this = this;
      interval = 1000 / config.fps;
      return this.timer = setInterval(function() {
        var dt;
        _this.canvas.clearRect(0, 0, _this.width, _this.height);
        dt = 1 / interval;
        _this.tick(dt);
        return _this.draw();
      }, interval);
    };

    Animator.prototype.stop = function() {
      clearInterval(this.timer);
      return this.timer = null;
    };

    Animator.prototype.draw = function() {
      var _this = this;
      return this.balls.forEach(function(ball) {
        _this.canvas.beginPath();
        _this.canvas.fillStyle = ball.color;
        _this.canvas.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2, true);
        _this.canvas.closePath();
        return _this.canvas.fill();
      });
    };

    Animator.prototype.tick = function(dt) {
      var _this = this;
      console.log("In tick");
      return this.balls.forEach(function(ball) {
        ball.vy = ball.vy + config.gravity * dt;
        if (ball.x < ball.r || ball.x > _this.width - ball.r) {
          ball.vx = ball.vx * -1;
        }
        if (ball.y < ball.r || ball.y > _this.height - ball.r) {
          ball.vy = ball.vy * -1;
        }
        _this.balls.forEach(function(other_ball) {
          var alpha, center, d1, d2, p1, p2, pp1, pp2, u1, u1x, u1y, u2, u2x, u2y, v1x, v1y, v2x, v2y;
          if (ball.id !== other_ball.id && ball.is_colliding_with(other_ball)) {
            alpha = Math.atan2(ball.y - other_ball.y, ball.x - other_ball.x);
            pp1 = ball.to_polar_point();
            pp2 = other_ball.to_polar_point();
            u1 = pp1.length;
            u2 = pp2.length;
            d1 = pp1.angle;
            d2 = pp2.angle;
            p1 = polar_to_rect(u1, d1 - alpha);
            p2 = polar_to_rect(u2, d2 - alpha);
            u1x = p1.x;
            u1y = p1.y;
            u2x = p2.x;
            u2y = p2.y;
            center = other_ball.get_center();
            v1x = (u1x * (ball.w - other_ball.w) + 2 * other_ball.w * u2x) / (ball.w + other_ball.w);
            v2x = (u2x * (other_ball.w - ball.w) + 2 * ball.w * u1x) / (ball.w + other_ball.w);
            v1y = u1y;
            v2y = u2y;
            ball.vx = Math.cos(alpha) * v1x + Math.cos(alpha + Math.PI / 2) * v1y;
            ball.vy = Math.sin(alpha) * v1x + Math.sin(alpha + Math.PI / 2) * v1y;
            other_ball.vx = Math.cos(alpha) * v2x + Math.cos(alpha + Math.PI / 2) * v2y;
            return other_ball.vy = Math.sin(alpha) * v2x + Math.sin(alpha + Math.PI / 2) * v2y;
          }
        });
        return ball.move(dt);
      });
    };

    return Animator;

  })();

  Ball = (function() {

    function Ball(params) {
      var _ref;
      _ref = [params.x, params.y, params.r, params.w, params.color || 'red', params.vx || 0, params.vy || 0], this.x = _ref[0], this.y = _ref[1], this.r = _ref[2], this.w = _ref[3], this.color = _ref[4], this.vx = _ref[5], this.vy = _ref[6];
      this.id = guid();
    }

    Ball.prototype.get_center = function() {
      return new Point(this.x + this.r, this.y + this.r);
    };

    Ball.prototype.get_velocity = function() {
      return Math.sqrt(this.vx * this.vx, this.vy * this.vy);
    };

    Ball.prototype.get_direction = function() {
      return Math.atan2(this.vy, this.vx);
    };

    Ball.prototype.to_polar_point = function() {
      return new PolarPoint(this.get_velocity(), this.get_direction());
    };

    Ball.prototype.move = function(dt) {
      this.x += this.vx * dt;
      return this.y += this.vy * dt;
    };

    Ball.prototype.is_colliding_with = function(other_ball) {
      var dx, dy, r;
      dx = this.x - other_ball.x;
      dy = this.y - other_ball.y;
      r = this.r + other_ball.r;
      return dx * dx + dy * dy < r * r;
    };

    return Ball;

  })();

}).call(this);
