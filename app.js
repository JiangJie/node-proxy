'use strict';

// 记录异步代码的调用栈
let env = process.env.NODE_ENV;
env && (env = env.trim());
env === 'debug' && require('asynctrace');

const co = require('co');
const koa = require('koa');

const logger = require('koa-logger');
const favicon = require('koa-favicon');
const vhost = require('vhost-koa');

const debug = require('debug');
const log = debug('app:log');
const error = debug('app:error');
error.log = console.error.bind(console);

const config = require('./config');
const middleware = require('./lib/middleware');

const PORT = config.port;

const app = module.exports = koa();

// settting
app.powerdBy = false;
app.proxy = true;

app.on('error', function(err, ctx) {
    error('path %s cause error %s', ctx && ctx.path, err.stack);
});

// 后面所有middlware抛的异常都在这捕获
app.use(middleware.firstHandler());

// 记录日志
app.use(logger());

// 处理favicon
app.use(favicon());

co(middleware.readVhosts()()).then(function(vhosts) {
    // 注册vhost，即自定义路由
    app.use(vhost(vhosts));

    // 默认路由，必须在自定义路由之后
    app.use(middleware.defaultRouter());

    log('already registed middlewares: %s', app.middleware.map(function(item) {
        return item.name;
    }));

    // 启动
    app.listen(PORT, function() {
        log('koa start @ %s @ %s', PORT, new Date());
    });
}, function(err) {
    error('start co reject %s', err.stack);
    throw err;
}).catch(function(err) {
    error('start co catch error %s', err.stack);
    throw err;
});