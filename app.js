'use strict';

let koa = require('koa');
let favicon = require('koa-favicon');
let compose = require('koa-compose');

let app = koa();

const PORT = 3000;

app.on('error', function(err) {
  console.error('global error %s', err.message);
});

app.use(function*(next) {
  try {
    yield next;
  } catch (err) {
    console.log('throw %s', err.message);
    this.app.emit('error', err, this);

    this.status = err.status || 500;

    this.body = {
      message: err.message || 'Internal Server Error'
    };
  }
});

app.use(favicon());

app.use(function*(next) {
  let hostname = this.hostname;
  let path = this.path;

  path = path.split('/').filter(function(item) {
    return item !== '';
  });

  path.length || path.push('index');

  let action = path.pop().split('.').shift();

  action && path.push(action);
  path.unshift(hostname);
  path.unshift('vhost');
  path.unshift('.');
  path = path.join('/');
  // try {
  let middleware = require(path);
  // 如果只是一个generator
  if(isGeneratorFunction(middleware)) middleware = [middleware];
  else if(!isGeneratorFunctionArray(middleware)) this.throw(new Error('must export middleware'));

  let composer = compose(middleware);
  yield composer.call(this, next);
  // } catch(e) {
  //   console.error('[%s] %s', hostname, e.message);
  //   yield next;
  // }
});

app.listen(PORT);

function isGeneratorFunction(obj) {
  return typeof obj === 'function' && obj.constructor.name === 'GeneratorFunction';
}
function isGeneratorFunctionArray(obj) {
  return Array.isArray(obj) && obj.every(isGeneratorFunction);
}