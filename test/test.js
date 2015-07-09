// Utils
// -----

var request = function() {
  function request(options, callback) {
    request.pending.push({ options: options, callback: callback });
  }
  request.pending = [];
  request.asserts = [];
  request.flush = function() {
    if (request.pending.length !== request.asserts.length) {
      throw new Error('Mismatched requests/asserts');
    }
    while (request.asserts.length) {
      var assert = request.asserts.shift();
      var call = request.pending.shift();
      assert(call.options, call.callback);
    }
  };
  request.expect = function(method, url, params, data, headers) {
    var response;
    request.asserts.push(function(options, callback) {
      if (response == null) {
        throw new Error('No response provided for: ' + method + ' ' + url);
      }
      if (method !== undefined) expect(options.method).toEqual(method);
      if (url !== undefined) expect(options.url).toEqual(url);
      if (params !== undefined) expect(options.params).toEqual(params);
      if (data !== undefined) expect(options.data).toEqual(data);
      if (headers !== undefined) expect(options.headers).toEqual(headers);
      if (response.head.ok) {
        callback(null, response);
      } else {
        callback(response, null);
      }
    });
    return {
      respond: function(_response) {
        response = _response;
      }
    };
  };
  return request;
}();

function response(body, head) {
  return {
    head: head || {
      ok: true,
      status: 200,
      references: {}
    },
    body: body || {}
  };
}

function url(path, params) {
  var qs = [];
  if (params) {
    for (var k in params) {
      if (params.hasOwnProperty(k)) {
        qs.push(k + '=' + encodeURIComponent(params[k].toString()));
      }
    }
  }
  qs = qs.length ? '?' + qs.join('&') : '';
  return 'https://api.flowthings.io/v0.1/test' + path + qs;
}

function noop(){}

function TestSocket(url) {
  return {
    url: url,
    send: function() {}
  };
}

function TestAPIClient() {
  return flowthings.APIClient({
    account: 'test',
    token: '<test_token>',
    secure: true,
    host: 'api.flowthings.io',
    wsHost: 'ws.flowthings.io',
    version: '0.1',
    serializer: JSON,
    transform: function(next, callback) {
      return next(callback);
    }
  }, request, TestSocket);
}

// Tests
// -----

describe('API Client', function() {
  var api;

  beforeEach(function() {
    api = TestAPIClient();
  });

  it('flow.read', function() {
    api.flow.read('<test_id>', noop);
    request
      .expect('GET', url('/flow/<test_id>'))
      .respond(response({}));

    request.flush();
  });

  it('flow.readMany', function() {
    api.flow.readMany(['a', 'b', 'c'], noop);
    request
      .expect('MGET', url('/flow'), undefined, ['a', 'b', 'c'])
      .respond(response({}));

    request.flush();
  });

  it('flow.findMany', function() {
    api.flow.findMany({ filter: { foo: 'bar' }, limit: 10 }, noop);
    request
      .expect('GET', url('/flow'), { filter: '(foo == "bar")', limit: 10 })
      .respond(response([]));

    request.flush();
  });

  it('flow.find', function() {
    api.flow.find(noop);
    request
      .expect('GET', url('/flow'))
      .respond(response([]));

    api.flow.find({ filter: { foo: 'bar' }, limit: 10 }, noop);
    request
      .expect('GET', url('/flow'), { filter: '(foo == "bar")', limit: 10 })
      .respond(response([]));

    api.flow.find('<test_id>', noop);
    request
      .expect('GET', url('/flow/<test_id>'))
      .respond(response({}));

    api.flow.find(['a', 'b', 'c'], noop);
    request
      .expect('MGET', url('/flow'), undefined, ['a', 'b', 'c'])
      .respond(response({}));
      
    request.flush();
  });

  it('drop.create', function() {
    api.drop.create({ path: '/foo' }, noop);
    request
      .expect('POST', url('/drop'), undefined, { path: '/foo' })
      .respond(response({}));

    request.flush();
  });

  it('drop().read', function() {
    api.drop('<flow_id>').read('<test_id>', noop);
    request
      .expect('GET', url('/drop/<flow_id>/<test_id>'))
      .respond(response({}));

    request.flush();
  });

  it('drop().readMany', function() {
    api.drop('<flow_id>').readMany(['a', 'b', 'c'], noop);
    request
      .expect('MGET', url('/drop/<flow_id>'), undefined, ['a', 'b', 'c'])
      .respond(response({}));

    request.flush();
  });

  it('drop().findMany', function() {
    api.drop('<flow_id>').findMany({ filter: { foo: 'bar' }, limit: 10 }, noop);
    request
      .expect('GET', url('/drop/<flow_id>'), { filter: '(foo == "bar")', limit: 10 })
      .respond(response({}));

    request.flush();
  });

  it('drop().find', function() {
    api.drop('<flow_id>').find('<test_id>', noop);
    request
      .expect('GET', url('/drop/<flow_id>/<test_id>'))
      .respond(response({}));

    api.drop('<flow_id>').find(['a', 'b', 'c'], noop);
    request
      .expect('MGET', url('/drop/<flow_id>'), undefined, ['a', 'b', 'c'])
      .respond(response({}));

    api.drop('<flow_id>').find({ filter: { foo: 'bar' }, limit: 10 }, noop);
    request
      .expect('GET', url('/drop/<flow_id>'), { filter: '(foo == "bar")', limit: 10 })
      .respond(response({}));

    request.flush();
  });

  it('drop().create', function() {
    api.drop('<flow_id>').create({ elems: { foo: 'bar' }}, noop);
    request
      .expect('POST', url('/drop/<flow_id>'), undefined, { elems: { foo: 'bar' }})
      .respond(response({}));

    request.flush();
  });

  it('drop().update', function() {
    api.drop('<flow_id>').update({ id: '<test_id>', elems: { foo: 'bar' }}, noop);
    request
      .expect('PUT', url('/drop/<flow_id>/<test_id>'), undefined, { id: '<test_id>', elems: { foo: 'bar' }})
      .respond(response({}));

    request.flush();
  });

  it('drop().save', function() {
    api.drop('<flow_id>').save({ elems: { foo: 'bar' }}, noop);
    request
      .expect('POST', url('/drop/<flow_id>'), undefined, { elems: { foo: 'bar' }})
      .respond(response({}));

    api.drop('<flow_id>').save({ id: '<test_id>', elems: { foo: 'bar' }}, noop);
    request
      .expect('PUT', url('/drop/<flow_id>/<test_id>'), undefined, { id: '<test_id>', elems: { foo: 'bar' }})
      .respond(response({}));

    request.flush();
  });
});

describe('WS Client', function() {
  var client;

  beforeEach(function() {
    var api = TestAPIClient();
    api.ws.connect(function(err, _client) {
      client = _client;
    });
    request
      .expect('POST', 'https://ws.flowthings.io/session', undefined, undefined, {
        'X-Auth-Account': 'test',
        'X-Auth-Token': '<test_token>'
      })
      .respond(response({ id: '<test_session>' }));
  });

  it('connect()', function() {
    expect(client)
      .toBeUndefined();

    request.flush();

    expect(client)
      .toBeDefined();

    expect(client.__socket.url)
      .toEqual('wss://ws.flowthings.io/session/<test_session>/ws')
  });

  it('subscription lifecycle', function() {
    request.flush();

    var drop;
    var subscribed = false;
    var handler = function(_drop) { drop = _drop };

    client.subscribe('<test_id>', handler, function() {
      subscribed = true;
    });

    expect(drop)
      .toBeUndefined();

    expect(subscribed)
      .toEqual(false);

    client.__receive(JSON.stringify(response(true, { ok: true, msgId: 1 })));

    expect(subscribed)
      .toEqual(true);

    client.__receive(JSON.stringify({
      type: 'message',
      value: { flowId: '<test_id>' }
    }));

    expect(drop)
      .toEqual({ flowId: '<test_id>' });

    drop = undefined;
    client.unsubscribe('<test_id>', handler);

    client.__receive(JSON.stringify({
      type: 'message',
      value: { flowId: '<test_id>' }
    }));

    expect(drop)
      .toBeUndefined();
  });

  it('concurrent subscriptions', function() {
    request.flush();

    var drop1;
    var drop2;
    var handler1 = function(_drop) { drop1 = _drop };
    var handler2 = function(_drop) { drop2 = _drop };

    client.subscribe('<test_id>', handler1);
    client.subscribe('<test_id>', handler2);

    expect(drop1)
      .toBeUndefined();

    expect(drop2)
      .toBeUndefined();

    client.__receive(JSON.stringify(response(true, { ok: true, msgId: 1 })));
    client.__receive(JSON.stringify({
      type: 'message',
      value: { flowId: '<test_id>' }
    }));

    expect(drop1)
      .toEqual({ flowId: '<test_id>' });

    expect(drop2)
      .toEqual({ flowId: '<test_id>' });
  });

  it('send()', function() {
    request.flush();

    var res;
    client.send({}, function(err, _res) { res = _res });
    client.__receive(JSON.stringify(response(true, { ok: true, msgId: 1 })));

    expect(res)
      .toEqual(true);
  });

  it('send() error', function() {
    request.flush();

    var res;
    client.send({}, function(err, _res) { res = err });
    client.__receive(JSON.stringify(response(true, { ok: false, msgId: 1 })));

    expect(res.body)
      .toEqual(true);
  });

  it('send() disconnect', function() {
    request.flush();

    var res;
    client.send({}, function(err, _res) { if (err) res = 1; else res = 2 })
    client.__socket.onclose({});

    expect(res)
      .toEqual(1);
  });
});
