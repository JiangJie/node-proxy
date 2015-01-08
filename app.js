'use strict';

let assert = require('assert');

let fs = require('mz/fs');

let co = require('co');
let koa = require('koa');

let logger = require('koa-logger');
let favicon = require('koa-favicon');
let mount = require('koa-mount');
let Router = require('koa-router');
let vhost = require('koa-vhost');

let compose = require('koa-compose');

let app = koa();

const PORT = 3000;

app.on('error', function(err) {
  console.error('global error %s', err.message);
});

app.use(function*(next) {
  try {
    yield* next;
  } catch (err) {
    console.log('throw %s', err.message);
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
      return {
        host: item,
        app: vapp
      };
    } catch(e) {
      console.log('vhost error %s', e.message);
      return;
    }
  }).filter(function(item) {
    return !!item;
  });
  app.use(vhost(vhosts));
}
co(readVhost()).then(function() {
  console.log('start co resolve ', arguments);

  app.use(function*(next) {
    yield* next;

    // debugger;
    let hostname = this.hostname;
    let path = this.path;

    // replace //... to / on url
    path.replace(/\/+/, '/');
    assert.ok(path.startsWith('/'), 'path should start with /');

    let index = path.lastIndexOf('.');
    ~index && (path = path.slice(0, index));

    let prefix = './vhosts/';
    path = prefix.concat(hostname, '/modules', path);

    // try {
    let middleware = require(path);
    // 如果只是一个generator
    if(isGeneratorFunction(middleware)) middleware = [middleware];
    else if(!isGeneratorFunctionArray(middleware)) this.throw(new Error('must export middleware(s)'));

    let composer = compose(middleware);
    yield* composer.call(this, next);
    // } catch(e) {
    //   console.error('[%s] %s', hostname, e.message);
    //   yield next;
    // }
  });

  app.listen(PORT, function() {
    console.info('koa start @ %s', PORT);
  });
}, function(err) {
  console.log('start co reject ', err);
}).catch(function(err) {
  console.error('start co catch error %s', err.message);
});

function isGeneratorFunction(obj) {
  return typeof obj === 'function' && obj.constructor.name === 'GeneratorFunction';
}
function isGeneratorFunctionArray(obj) {
  return Array.isArray(obj) && obj.every(isGeneratorFunction);
}