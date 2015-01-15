'use strict';

const assert = require('assert');

// 记录异步代码的调用栈
let env = process.env.NODE_ENV;
env && (env = env.trim());
env === 'debug' && require('asynctrace');

const fs = require('mz/fs');

const co = require('co');
const koa = require('koa');

const logger = require('koa-logger');
const favicon = require('koa-favicon');
const mount = require('koa-mount');
const Router = require('koa-router');
const vhost = require('vhost-koa');

const debug = require('debug');
const log = debug('app:log');
const error = debug('app:error');
error.log = console.error.bind(console);

const util = require('./lib/util');

const PORT = 3000;

const app = koa();

// settting
app.powerdBy = false;
app.proxy = true;

app.on('error', function(err, ctx) {
  error('path %s cause error %s', ctx && ctx.path, err.stack);
});

app.use(function* error(next) {
  try {
    yield* next;
  } catch (err) {
    this.app.emit('error', err, this);

    this.status = err.status || 500;

    this.body = {
      message: err.message || 'Internal Server Error'
    };
  }
});

app.use(logger());
app.use(favicon());

function* readVhost() {
  let vhosts = yield fs.readdir('./vhosts');

  vhosts = vhosts.map(function(item) {
    try {
      const vapp = koa();

      const API = new Router();
      require('./vhosts/' + item + '/router').bind(API)();
      vapp.use(mount('/', API.middleware()));
      log('inited vhost %s', item);
      return {
        host: item,
        app: vapp
      };
    } catch(e) {
      error('vhost error %s', e.stack);
      return;
    }
  });
  app.use(vhost(vhosts));
}
co(readVhost()).then(function() {
  log('start co resolve');

  app.use(function* defaultRouter(next) {
    yield* next;

    // debugger;
    const hostname = this.hostname;
    let path = this.path;

    // replace //... to / on url
    path.replace(/\/+/, '/');
    assert.ok(path.startsWith('/'), 'path should start with /');

    // url/ => url
    path.endsWith('/') && (path = path.slice(0, -1));

    const index = path.lastIndexOf('.');
    ~index && (path = path.slice(0, index));

    const prefix = './vhosts/';
    path = prefix.concat(hostname, '/modules', path);

    log('lookup handler file %s', path);
    const composer = util.compose(require(path));
    yield* composer.call(this, next);
  });

  app.listen(PORT, function() {
    log('koa start @ %s', PORT);
  });
}, function(err) {
  error('start co reject %s', err.stack);
}).catch(function(err) {
  error('start co catch error %s', err.stack);
});