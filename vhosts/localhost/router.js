'use strict';

const path = require('path');

const debug = require('debug');
const log = debug('app:log:vhost');
const error = debug('app:error:vhost');
error.log = console.log.bind(console);

const util = require('../../lib/util');

// use Map tp support RegExp
const router = new Map([[/\/a\/b\/(\d+)/, './modules/test/index.js']]);

// router.set(/\/a\/b\/(\d+)/, './modules/test1.js');

module.exports = function() {
  // note: this is a koa router

  // router.forEach(function(v, k) {
  //   try {
  //     log('lookup handler file %s', v);
  //     const composer = util.compose(require(v));
  //     this.get(k, composer);
  //   } catch(e) {
  //     error('router error %s', e.stack);
  //   }
  // }, this);

  // for(const [k, v] of router.entries()) {
  //   try {
  //     log('lookup handler file %s', v);
  //     const composer = util.compose(require(path.resolve(__dirname, v)));
  //     this.get(k, composer);
  //   } catch(e) {
  //     error('router error %s', e.stack);
  //   }
  // }

  for(const route of router.entries()) {
    try {
      log('lookup handler file %s', route[1]);
      const composer = util.compose(require(path.resolve(__dirname, route[1])));
      this.get(route[0], composer);
    } catch(e) {
      error('router error %s', e.stack);
    }
  }
};