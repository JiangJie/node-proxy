'use strict';

const request = require('supertest');
const app = require('../app');

describe('node-proxy', function () {
    describe('http://127.0.0.1', function () {
        it('should get string hello', function (done) {
            request(app.listen())
                .get('/')
                .expect('hello')
                .expect(200, done);
        });
    });

    describe('http://localhost/test', function () {
        it('should get string test', function (done) {
            request(app.listen())
                .get('/test')
                .set('Host', 'localhost')
                .expect('test')
                .expect(200, done);
        });
    });

    describe('http://www.alloyteam.com/a/b/123', function () {
        it('should get string test', function (done) {
            request(app.listen())
                .get('/a/b/123')
                .set('Host', 'www.alloyteam.com')
                .expect('test')
                .expect(200, done);
        });
    });
});