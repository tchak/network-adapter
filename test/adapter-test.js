import { module, test } from 'qunit';
import fetch, { Headers, Request } from 'node-fetch';
import { AbortController, abortableFetch } from 'abortcontroller-polyfill/dist/cjs-ponyfill';
import Adapter from '../main.js';

const patched = abortableFetch({
  fetch,
  Request
});

Adapter.fetch = patched.fetch;
Adapter.Request = patched.Request;
Adapter.Headers = Headers;
Adapter.AbortController = AbortController;

module('FetchAdapter', function(hooks) {
  hooks.beforeEach(function() {
    this.adapter = new Adapter();
  });

  test('#requestFor', async function(assert) {
    let request = await this.adapter.requestFor({ url: 'posts' });

    assert.equal(request.url, '/posts');
    assert.equal(request.method, 'GET');
    assert.deepEqual(Array.from(request.headers), []);
  });

  test('#requestFor post', async function(assert) {
    let request = await this.adapter.requestFor({
      url: 'posts',
      method: 'post',
      body: { hello: 'world' }
    });

    assert.equal(request.url, '/posts');
    assert.equal(request.method, 'POST');

    assert.deepEqual(await request.json(), { hello: 'world' });
    assert.deepEqual(
      [...request.headers.entries()],
      [['content-type', 'application/json; charset=utf-8']]
    );
  });

  test('#requestFor empty query params', async function(assert) {
    let request = await this.adapter.requestFor({ url: 'posts', query: {} });
    assert.equal(request.url, '/posts');
  });

  test('#buildURL', async function(assert) {
    let url = this.adapter.buildURL('posts');
    assert.equal(url, '/posts');

    url = this.adapter.buildURL('/posts');
    assert.equal(url, '/posts');

    url = this.adapter.buildURL('https://test.com/posts');
    assert.equal(url, 'https://test.com/posts');

    this.adapter.host = 'https://example.com';

    url = this.adapter.buildURL('posts');
    assert.equal(url, 'https://example.com/posts');

    url = this.adapter.buildURL('/posts');
    assert.equal(url, 'https://example.com/posts');

    url = this.adapter.buildURL('https://test.com/posts');
    assert.equal(url, 'https://test.com/posts');

    this.adapter.namespace = 'api';

    url = this.adapter.buildURL('posts');
    assert.equal(url, 'https://example.com/api/posts');

    url = this.adapter.buildURL('/posts');
    assert.equal(url, 'https://example.com/api/posts');

    url = this.adapter.buildURL('https://test.com/posts');
    assert.equal(url, 'https://test.com/posts');
  });

  const URL_WITH_DELAY = 'https://reqres.in/api/users?delay=2';

  test('timeout', async function(assert) {
    assert.expect(1);

    try {
      await this.adapter.fetch(
        {
          url: URL_WITH_DELAY
        },
        {
          timeout: 1
        }
      );
    } catch (e) {
      assert.equal(e.name, 'AbortError');
    }
  });

  module('abort', function() {
    test('after request', function(assert) {
      assert.expect(1);
      let controller = new AbortController();
      let done = assert.async();

      this.adapter
        .fetch({
          url: URL_WITH_DELAY,
          signal: controller.signal
        })
        .catch(e => {
          assert.equal(e.name, 'AbortError');
          done();
        });
      controller.abort();
    });

    test('before request', async function(assert) {
      assert.expect(1);
      let controller = new AbortController();
      controller.abort();

      try {
        await this.adapter.fetch({
          url: URL_WITH_DELAY,
          signal: controller.signal
        });
      } catch (e) {
        assert.equal(e.name, 'AbortError');
      }
    });

    test('with timeout', async function(assert) {
      assert.expect(1);
      let controller = new AbortController();

      try {
        await this.adapter.fetch(
          {
            url: URL_WITH_DELAY,
            signal: controller.signal
          },
          { timeout: 1 }
        );
      } catch (e) {
        assert.equal(e.name, 'AbortError');
      }
    });

    test('abort with timeout', function(assert) {
      assert.expect(1);
      let controller = new AbortController();
      let done = assert.async();

      this.adapter
        .fetch(
          {
            url: URL_WITH_DELAY,
            signal: controller.signal
          },
          { timeout: 1 }
        )
        .catch(e => {
          assert.equal(e.name, 'AbortError');
          done();
        });
      controller.abort();
    });
  });
});
