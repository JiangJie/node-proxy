'use strict';

var koa = require('koa');

var app = koa();

const PORT = 3000;

app.use(function*(next) {
  var hostname = this.hostname;
  var path = this.path;

  path = path.split('/').filter(function(item) {
    return item !== '';
  });

  var action = path.pop().split('.').shift();

  action && path.push(action);
  path.unshift(hostname);
  path.unshift('vhost');
  path.unshift('.');
  path = path.join('/');
  try {
    yield require(path).call(this, next);
  } catch(e) {
    console.error('[%s] %s', hostname, e.message);
    yield next;
  }
});

app.listen(PORT);