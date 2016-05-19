'use strict';

var logger = require('logger');
var should = require('should');
var assert = require('assert');
var sinon = require('sinon');
var config = require('config');
var subscriptionRouter = require('routes/api/v1/subscriptionRouter');
var path = require('path');
var fs = require('fs-extra');

describe('POST /subscriptions', function() {

  var ctx = {
    assert: function() {
      return false;
    },
    request: {
      body: {
      }
    },
    body: null
  };

  let url = '/subscriptions/';
  let method = 'POST';
  let func = null;
  before(function*() {
    for (let i = 0, length = subscriptionRouter.stack.length; i < length; i++) {
      if (subscriptionRouter.stack[i].regexp.test(url) && subscriptionRouter.stack[i].methods.indexOf(method) >= 0) {
        func = subscriptionRouter.stack[i].stack[0];
      }
    }
  });

  describe('Given valid params', function() {

    it('creates a Subscription', function*() {
      //console.log(func);
      //funcTest.should.be.a.Function();
      //yield funcTest();

      //ctx.body.should.not.be.null();
      //ctx.body.should.have.property('data');

      //let data = ctx.body.data;
      //data.should.have.property('type');
      //data.should.have.property('attributes');
      //data.should.have.property('id');
      //data.type.should.equal('geoJSON');
    });

  });

});
