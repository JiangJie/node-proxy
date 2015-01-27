'use strict';

module.exports = [function*(next) {
  // this.body = 'hello';
  yield next;
}, function*(next) {
  this.body = 'hello';
}];