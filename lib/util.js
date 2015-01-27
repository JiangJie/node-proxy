'use strict';

const compose = require('koa-compose');

const debug = require('debug');
const error = debug('app:util:error');
error.log = console.error.bind(console);

function isGeneratorFunction(obj) {
    return typeof obj === 'function' && obj.constructor.name === 'GeneratorFunction';
};

function isGeneratorFunctionArray(obj) {
    return Array.isArray(obj) && obj.every(isGeneratorFunction);
};

// 将多个middleware组合成一个
exports.compose = function(middleware) {
    if(!middleware) throw new Error('middleware is required');
    try {
        // 如果只是一个generator
        if(isGeneratorFunction(middleware)) middleware = [middleware];
        else if(!isGeneratorFunctionArray(middleware)) throw new Error('must export middleware(s)');

        return compose(middleware);
    } catch(e) {
        error('compose error: %s', e.stack);
        throw e;
    }
};