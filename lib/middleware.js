'use strict';

const path = require('path');
const fs = require('mz/fs');

const co = require('co');
const koa = require('koa');

const mount = require('koa-mount');
const Router = require('koa-router');

const debug = require('debug');
const log = debug('app:lib:middleware:log');
const error = debug('app:lib:middleware:error');
error.log = console.error.bind(console);

const util = require('./util');

// 捕获全局异常
exports.firstHandler = function() {
    return function* firstHandler(next) {
        try {
            yield* next;
        } catch (err) {
            err = err || {};

            error('url %s % %s', this.originalUrl, err.status, err.message);

            this.app.emit('error', err, this);

            this.status = err.status || 500;

            this.body = {
                message: err.message || 'Internal Server Error'
            };
        }
    }
};

// 默认路由
exports.defaultRouter = function() {
    return function* defaultRouter(next) {
        // debugger;
        yield* next;

        const hostname = this.hostname;
        let urlPath = this.path;

        // replace //... to / on url
        urlPath.replace(/\/+/, '/');

        // this.assert(path.startsWith('/'), 'path must start with /');

        // url/ => url
        urlPath.endsWith('/') && (urlPath = urlPath.slice(0, -1));

        // xxx.html => xxx
        const index = urlPath.lastIndexOf('.');
        ~index && (urlPath = urlPath.slice(0, index));

        urlPath = path.resolve(__dirname, '../vhosts/', hostname, 'modules' + urlPath);

        log('lookup handler file %s', urlPath);
        try {
            const composer = util.compose(require(urlPath));
            yield* composer.call(this, next);
        } catch(e) {
            error('handler file %s error %s', urlPath, e.stack);
            yield* next;
        }
    }
};

exports.readVhosts = function() {
    return function* readVhosts() {
        const VHOSTS = path.resolve(__dirname, '../vhosts');

        let vhosts = yield fs.readdir(VHOSTS);

        vhosts = yield vhosts.map(co.wrap(function*(vhost) {
            // only accept directory
            if(!(yield fs.stat(path.resolve(VHOSTS, vhost))).isDirectory()) return Promise.resolve();

            try {
                const vapp = koa();

                const API = new Router();
                require(path.resolve(VHOSTS, vhost + '/router')).bind(API)();
                vapp.use(mount('/', API.middleware()));
                log('inited vhost %s', vhost);
                return  Promise.resolve({
                    host: vhost,
                    app: vapp
                });
            } catch(e) {
                error('vhost error %s', e.stack);
                return Promise.resolve();
            }
        }));

        vhosts = vhosts.filter(function(vhost) {
            return !!vhost;
        });

        return vhosts;
    }
};