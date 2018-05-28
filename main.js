import RequestBuilder from './src/request-builder';
import ResponseProxy from './src/response-proxy';
import addQueryParams from './src/add-query-params';
import signalForRequest from './src/signal-for-request';
import merge from './src/merge';

export default class Adapter {
  constructor({ timeout, headers } = {}) {
    if (timeout) {
      this.timeout = timeout;
    }
    if (headers) {
      this.headers = headers;
    }
  }

  async methodForRequest({ method = 'get' }) {
    return method;
  }

  async headersForRequest({ headers }) {
    return merge(this.headers, headers);
  }

  async pathForRequest({ url }) {
    return url;
  }

  async queryForRequest({ query }) {
    return query;
  }

  async bodyForRequest({ body }) {
    if (typeof body === 'string') {
      return body;
    }
    return JSON.stringify(body);
  }

  async normalizeSuccess(params, body) {
    return body;
  }

  async normalizeError(params, body) {
    return body;
  }

  normalize(params, body, response) {
    if (arguments.length === 1) {
      return (body, response) => this.normalize(params, body, response);
    }
    if (response.ok) {
      return this.normalizeSuccess(params, body, response);
    }
    return this.normalizeError(params, body, response);
  }

  request(params) {
    return new RequestBuilder(params => this.fetch(params), params);
  }

  fetch(params) {
    let { signal, timeout } = params;
    let response = this.requestFor(params).then(request =>
      this.makeRequest(request, { signal, timeout })
    );
    return new ResponseProxy(response, this.normalize(params));
  }

  async urlForRequest(options) {
    let path = await this.pathForRequest(options);
    let query = await this.queryForRequest(options);
    let url = this.buildURL(path);

    return addQueryParams(url, query);
  }

  async optionsForRequest({ options }) {
    let { mode = 'cors', credentials = 'same-origin' } = options || {
      mode: 'cors',
      credentials: 'same-origin'
    };

    return {
      mode,
      credentials
    };
  }

  buildURL(path) {
    if (/^\/\//.test(path) || /http(s)?:\/\//.test(path)) {
      // Do nothing, the full host is already included.
      return path;
    }

    let { host, namespace } = this;
    let url = [];

    if (!host || host === '/') {
      host = '';
    }
    if (host) {
      url.push(host);
    }
    if (namespace) {
      url.push(namespace);
    }
    url = url.join('/');

    if (path.charAt(0) === '/') {
      url += path;
    } else {
      url += '/' + path;
    }

    if (!host && url && url.charAt(0) !== '/') {
      url = '/' + url;
    }

    url = this.buildServerURL(url);

    return url;
  }

  buildServerURL(url) {
    return url;
  }

  makeRequest(request, { signal, timeout }) {
    const { fetch, AbortController } = Adapter;

    let resolve, reject;
    [signal, resolve, reject] = signalForRequest({ signal, timeout }, AbortController);

    if (signal) {
      request.signal = signal;
    }
    if (resolve && reject) {
      return fetch(request).then(resolve, reject);
    }

    return fetch(request);
  }

  async requestFor(params) {
    const { Headers, Request } = Adapter;

    params = Object.freeze(params);

    let method = await this.methodForRequest(params);
    let url = await this.urlForRequest(params);
    let headers = await this.headersForRequest(params);
    let options = await this.optionsForRequest(params);

    method = method.toUpperCase();
    headers = new Headers(headers);

    options.method = method;
    options.headers = headers;

    if (method === 'GET' || method === 'HEAD') {
      if (params.body) {
        throw new Error(`${method} request with body`);
      }
    } else {
      let body = await this.bodyForRequest(params);

      if (body) {
        options.body = body;

        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json; charset=utf-8');
        }
      }
    }

    return new Request(url, options);
  }
}
