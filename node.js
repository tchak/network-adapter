import Adapter, { Cache } from './main';
import fetch, { Headers, Request } from 'node-fetch';
import AbortController from 'abortcontroller-polyfill/src/abortcontroller';
import abortableFetch from 'abortcontroller-polyfill/src/abortableFetch';

const patched = abortableFetch({
  fetch,
  Request
});

Adapter.fetch = patched.fetch;
Adapter.Request = patched.Request;
Adapter.Headers = Headers;
Adapter.AbortController = AbortController;
Adapter.Cache = Cache;

export { Cache, AbortController };
export default Adapter;
