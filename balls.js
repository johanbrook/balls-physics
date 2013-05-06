(function() {
  var Animator, Ball, Point, PolarPoint, config, create_balls, guid, polar_to_rect, s4,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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

    function PolarPoint(len, angle) {
      this.len = len;
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

  Animator = (function() {

    function Animator(canvas, balls) {
      var _ref;
      this.balls = balls;
      this.go = __bind(this.go, this);
      this.canvas = canvas.getContext("2d");
      this.interval = 1000 / config.fps;
      _ref = [canvas.width, canvas.height], this.width = _ref[0], this.height = _ref[1];
    }

    Animator.prototype.go = function() {
      window.requestAnimationFrame(this.go);
      this.tick(1 / this.interval);
      return this.draw();
    };

    Animator.prototype.draw = function() {
      var ball, _i, _len, _ref, _results;
      this.canvas.clearRect(0, 0, this.width, this.height);
      _ref = this.balls;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ball = _ref[_i];
        this.canvas.beginPath();
        this.canvas.fillStyle = ball.color;
        this.canvas.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2, true);
        this.canvas.closePath();
        _results.push(this.canvas.fill());
      }
      return _results;
    };

    Animator.prototype.tick = function(dt) {
      var alpha, ball, d1, d2, ghost_ball, other_ball, p1, p2, pp1, pp2, u1, u1x, u1y, u2, u2x, u2y, v1x, v1y, v2x, v2y, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _results;
      _ref = this.balls;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ball = _ref[_i];
        ball.vy = ball.vy + config.gravity * dt;
        ghost_ball = ball.clone();
        ghost_ball.move(dt);
        if (ghost_ball.x < ghost_ball.r || ghost_ball.x > this.width - ghost_ball.r) {
          ball.vx = ball.vx * -1;
        }
        if (ghost_ball.y < ghost_ball.r || ghost_ball.y > this.height - ghost_ball.r) {
          ball.vy = ball.vy * -1;
        }
        _ref2 = this.balls;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          other_ball = _ref2[_j];
          ghost_ball = ball.clone();
          ghost_ball.move(dt);
          if (ball.id !== other_ball.id && ghost_ball.is_colliding_with(other_ball)) {
            alpha = Math.atan2(ball.y - other_ball.y, ball.x - other_ball.x);
            pp1 = ball.to_polar_point();
            pp2 = other_ball.to_polar_point();
            _ref3 = [pp1.len, pp2.len, pp1.angle, pp2.angle], u1 = _ref3[0], u2 = _ref3[1], d1 = _ref3[2], d2 = _ref3[3];
            _ref4 = [polar_to_rect(u1, d1 - alpha), polar_to_rect(u2, d2 - alpha)], p1 = _ref4[0], p2 = _ref4[1];
            _ref5 = [p1.x, p1.y, p2.x, p2.y], u1x = _ref5[0], u1y = _ref5[1], u2x = _ref5[2], u2y = _ref5[3];
            v1x = (u1x * (ball.w - other_ball.w) + 2 * other_ball.w * u2x) / (ball.w + other_ball.w);
            v2x = (u2x * (other_ball.w - ball.w) + 2 * ball.w * u1x) / (ball.w + other_ball.w);
            v1y = u1y;
            v2y = u2y;
            ball.vx = polar_to_rect(v1x, alpha).x + polar_to_rect(v1y, alpha + Math.PI / 2).x;
            ball.vy = polar_to_rect(v1x, alpha).y + polar_to_rect(v1y, alpha + Math.PI / 2).y;
            other_ball.vx = polar_to_rect(v2x, alpha).x + polar_to_rect(v2y, alpha + Math.PI / 2).x;
            other_ball.vy = polar_to_rect(v2x, alpha).y + polar_to_rect(v2y, alpha + Math.PI / 2).y;
          }
        }
        _results.push(ball.move(dt));
      }
      return _results;
    };

    return Animator;

  })();

  Ball = (function() {

    function Ball(params) {
      var _ref;
      _ref = [params.x, params.y, params.r, params.w, params.color || 'red', params.vx || 0, params.vy || 0], this.x = _ref[0], this.y = _ref[1], this.r = _ref[2], this.w = _ref[3], this.color = _ref[4], this.vx = _ref[5], this.vy = _ref[6];
      this.id = guid();
    }

    Ball.prototype.clone = function() {
      return new Ball({
        x: this.x,
        y: this.y,
        r: this.r,
        w: this.w,
        color: this.color,
        vx: this.vx,
        vy: this.vy
      });
    };

    Ball.prototype.get_velocity = function() {
      return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
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

  create_balls = function(amount) {
    var num, _results;
    _results = [];
    for (num = 1; 1 <= amount ? num <= amount : num >= amount; 1 <= amount ? num++ : num--) {
      _results.push(new Ball({
        x: num * 60,
        y: 40,
        r: num * 20,
        w: num * 10,
        vx: 10 * (-1 * num)
      }));
    }
    return _results;
  };

  polar_to_rect = function(len, degrees) {
    var x, y;
    x = len * Math.cos(degrees);
    y = len * Math.sin(degrees);
    return new Point(x, y);
  };

  s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  guid = function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

}).call(this);
