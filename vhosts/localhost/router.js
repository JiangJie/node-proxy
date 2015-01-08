'use strict';

var router = new Map();

router.set(/\/a\/b\/(\d+)/, './modules/test1.js');

module.exports = function() {
  // this is a router
  router.forEach(function(v, k) {
    this.get(k, require(v));
  }, this);
};