'use strict';

const request = require('supertest');
const app = require('../app');

describe('node-proxy', function () {
    describe('http://127.0.0.1:3000', function () {
        it('should get string hello', function (done) {
            request(app.listen())
                .get('/')
                .expect('hello')
                .expect(200, done);
        });
    });

    describe('http://127.0.0.1:3000/test', function () {
        it('should get string test', function (done) {
            request(app.listen())
                .get('/test')
                .expect('test')
                .expect(200, done);
        });
    });

    describe('http://127.0.0.1:3000/a/b/123', function () {
        it('should get string test', function (done) {
            request(app.listen())
                .get('/a/b/123')
                .expect('test')
                .expect(200, done);
        });
    });
});