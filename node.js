const Adapter = require('./index');
const { default: fetch, Headers, Request } = require('node-fetch');
const {
  AbortController,
  abortableFetch
} = require('abortcontroller-polyfill/dist/cjs-ponyfill');
const patched = abortableFetch({
  fetch,
  Request
});

Adapter.fetch = patched.fetch;
Adapter.Request = patched.Request;
Adapter.Headers = Headers;
Adapter.AbortController = AbortController;

module.exports = Adapter;
