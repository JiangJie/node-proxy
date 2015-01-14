'use strict';

let assert = require('assert');

// 记录异步代码的调用栈
var env = process.env.NODE_ENV;
env && (env = env.trim());
env !== 'procudtion' && require('asynctrace');

let fs = require('mz/fs');

let co = require('co');
let koa = require('koa');

let logger = require('koa-logger');
let favicon = require('koa-favicon');
let mount = require('koa-mount');
let Router = require('koa-router');
let vhost = require('vhost-koa');

let debug = require('debug');
let log = debug('app:log');
let error = debug('app:error');
error.log = console.error.bind(console);

let util = require('./lib/util');

let app = koa();

const PORT = 3000;

app.on('error', function(err) {
  error('global error %s', err.message);
});

app.use(function* error(next) {
  try {
    yield* next;
  } catch (err) {
    error('throw %s', err.message);
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
      let vapp = koa();

      let API = new Router();
      require('./vhosts/' + item + '/router').bind(API)();
      vapp.use(mount('/', API.middleware()));
      log('inited vhost %s', item);
      return {
        host: item,
        app: vapp
      };
    } catch(e) {
      error('vhost error %s', e.message);
      return;
    }
  }).filter(function(item) {
    // 过滤掉空的vhost
    return !!item;
  });
  app.use(vhost(vhosts));
}
co(readVhost()).then(function() {
  log('start co resolve');

  app.use(function* defaultRouter(next) {
    yield* next;

    // debugger;
    let hostname = this.hostname;
    let path = this.path;

    // replace //... to / on url
    path.replace(/\/+/, '/');
    assert.ok(path.startsWith('/'), 'path should start with /');

    // url/ => url
    path.endsWith('/') && (path = path.slice(0, -1));

    let index = path.lastIndexOf('.');
    ~index && (path = path.slice(0, index));

    let prefix = './vhosts/';
    path = prefix.concat(hostname, '/modules', path);

    // try {
    log('lookup handler file %s', path);
    let composer = util.compose(require(path));
    yield* composer.call(this, next);
    // } catch(e) {
    //   error('[%s] %s', hostname, e.message);
    //   yield next;
    // }
  });

  app.listen(PORT, function() {
    log('koa start @ %s', PORT);
  });
}, function(err) {
  error('start co reject %s', err.message);
}).catch(function(err) {
  error('start co catch error %s', err.message);
});