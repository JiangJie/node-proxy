'use strict';

const http = require('http');

const error = module.exports = {};

function UnauthorizedError(message, data) {
    this.status = 401;
    this.message = message || http.STATUS_CODES[401];
    this.data = data || null;
}
UnauthorizedError.prototype = new Error();
UnauthorizedError.prototype.constructor = UnauthorizedError;

error.UnauthorizedError = UnauthorizedError;

function ForbiddenError(message, data) {
    this.status = 403;
    this.message = message || http.STATUS_CODES[403];
    this.data = data || null;
}
ForbiddenError.prototype = new Error();
ForbiddenError.prototype.constructor = ForbiddenError;

error.ForbiddenError = ForbiddenError;

function NotFoundError(message, data) {
    this.status = 404;
    this.message = message || http.STATUS_CODES[404];
    this.data = data || null;
}
NotFoundError.prototype = new Error();
NotFoundError.prototype.constructor = NotFoundError;

error.NotFoundError = NotFoundError;

function NotAcceptableError(message, data) {
    this.status = 406;
    this.message = message || http.STATUS_CODES[406];
    this.data = data || null;
}
NotAcceptableError.prototype = new Error();
NotAcceptableError.prototype.constructor = NotAcceptableError;

error.NotAcceptableError = NotAcceptableError;