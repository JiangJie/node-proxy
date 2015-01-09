'use strict';

let debug = require('debug')('vhost');

let util = require('../../lib/util');

let router = new Map();

router.set(/\/a\/b\/(\d+)/, './modules/test1.js');

module.exports = function() {
  // this is a router
  router.forEach(function(v, k) {
    try {
      debug('lookup handler file %s', v);
      let composer = util.compose(require(v));
      this.get(k, composer);
    } catch(e) {
      console.errpr('router error %s', e.message);
    }
  }, this);
};