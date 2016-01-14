(function(ionic) {

  var IonicWheel = ionic.views.View.inherit({
    initialize: function(opts) {

      opts = ionic.extend({
      }, opts);

      ionic.extend(this, opts);

      this.bindEvents();

      var elDimensions = this.el.getBoundingClientRect();
      this._center = {
        x: elDimensions.left + elDimensions.width / 2,
        y: elDimensions.top + elDimensions.height / 2
      };

      this.positionMenuItems();

    },

    _center: {},
    _updatedAngle: 0,
    _originalAngle: 0,
    _currentAngle: 0,
    _animateAngle: 0,
    _direction: '',
    _velocity: 0,
    _animationFunc: null,
    _inProgress: false,
    _gestures: {},

    _calculateAngle: function(x, y){
      var deltaX = x - this._center.x,
          deltaY = y - this._center.y,
          angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

      if(angle < 0) {
        angle = angle + 360;
      }

      return angle;
    },

    positionMenuItems: function() {
      var theta = [];

      var n = this.menuItems.length;

      var r = (window.getComputedStyle(this.el).height.slice(0, -2) / 2) - (window.getComputedStyle(this.menuItems[0]).height.slice(0, -2) / 2);

      var frags = 360 / n;
      for (var i = 0; i <= n; i++) {
          theta.push((frags / 180) * i * Math.PI);
      }

      var mainHeight = parseInt(window.getComputedStyle(this.el).height.slice(0, -2)) / 1.2;

      var circleArray = [];

      for (var i = 0; i < this.menuItems.length; i++) {
        this.menuItems[i].posx = Math.round(r * (Math.cos(theta[i]))) + 'px';
        this.menuItems[i].posy = Math.round(r * (Math.sin(theta[i]))) + 'px';
        this.menuItems[i].style.top = ((mainHeight / 2) - parseInt(this.menuItems[i].posy.slice(0, -2))) + 'px';
        this.menuItems[i].style.left = ((mainHeight/ 2 ) + parseInt(this.menuItems[i].posx.slice(0, -2))) + 'px';
      }
    },

    onDragStart: function(e) {
      var pageX = e.gesture.touches[0].pageX;
      var pageY = e.gesture.touches[0].pageY;
      this._updatedAngle = this._calculateAngle(pageX, pageY);
    },

    onDrag: function(e) {
      var pageX = e.gesture.touches[0].pageX;
      var pageY = e.gesture.touches[0].pageY;

      var previousAngle = this._currentAngle;

      this._currentAngle = this._calculateAngle(pageX, pageY) - this._updatedAngle + this._originalAngle;

      if(previousAngle > this._currentAngle) {
        this._direction = 'left';
      } else {
        this._direction = 'right';
      }

      this.el.style.transform = this.el.style.webkitTransform  = 'rotate(' + this._currentAngle + 'deg)';

      for (var i = 0; i < this.menuItems.length; i++) {
        this.menuItems[i].style.transform = this.menuItems[i].style.webkitTransform = 'rotate(' + -this._currentAngle + 'deg)';
      }

    },

    onDragEnd: function(e) {
      var self = this;

      self._originalAngle = self._currentAngle;

      var velocity = e.gesture.velocityX + e.gesture.velocityY / 2,
          distance = velocity * 150,
          currentDistance = distance,
          decayDistance;

      if(velocity > 0.5) {
        self._animation = collide.animation()

        .on('start', function() {
          self._inProgress = true;
        })

        .on('step', function(v) {
          if(currentDistance > 1) {
            var decayDistance = currentDistance*0.95;
            var calcDistance = distance - decayDistance;

            if(self._direction === 'left') {
              calcDistance = -calcDistance;
            }

            self._animateAngle = self._currentAngle + calcDistance;
            currentDistance = decayDistance;

            self.el.style.transform = self.el.style.webkitTransform  = 'rotate(' + self._animateAngle + 'deg)';

            for (var i = 0; i < self.menuItems.length; i++) {
              self.menuItems[i].style.transform = self.menuItems[i].style.webkitTransform = 'rotate(' + -self._animateAngle + 'deg)';
            }

          } else {
            self._originalAngle = self._animateAngle;
            self._animation.stop();
          }
        })
        .on('complete', function() {
          self._inProgress = false;
        })

        .velocity(velocity)

      }

    },

    onTouch: function(e){
      if(this._inProgress) {
        this._originalAngle = this._animateAngle;
        this._animation.stop();
      }
    },

    bindEvents: function() {
      var self = this;
      self._gestures.touch = ionic.onGesture('touch', self.onTouch.bind(this), self.el);
      self._gestures.dragstart = ionic.onGesture('dragstart', self.onDragStart.bind(this), self.el);
      self._gestures.drag = ionic.onGesture('drag', self.onDrag.bind(this), self.el);
      self._gestures.dragend =ionic.onGesture('dragend', self.onDragEnd.bind(this), self.el);
    }

  });


  angular.module('ionic.wheel', ['ionic'])

    .directive('ionWheel', function() {
      return {
        restrict: 'E',
        template: '<div id="ionic-wheel" ng-transclude></div>',
        transclude: true,
        link: function($scope, $element, $attr) {

          var ionicWheel = new IonicWheel({
            el: $element[0],
            menuItems: $element[0].querySelectorAll('ion-wheel-item')
          });

          $scope.$on('$destroy', function() {
            var gestures = ionicWheel._gestures;
            ionic.offGesture(gestures.touch, 'touch', ionicWheel.onTouch);
            ionic.offGesture(gestures.dragstart, 'dragstart', ionicWheel.onDragStart);
            ionic.offGesture(gestures.drag, 'drag', ionicWheel.onDrag);
            ionic.offGesture(gestures.dragend, 'dragend', ionicWheel.onDragEnd);
          });

        }
      }

    });

})(window.ionic);