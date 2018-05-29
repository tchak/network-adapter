import RequestBuilder from './src/request-builder';
import ResponseProxy from './src/response-proxy';
import addQueryParams from './src/add-query-params';
import signalForRequest from './src/signal-for-request';
import merge from './src/merge';

const HTTP_METHOD_GET = 'GET';
const HTTP_METHOD_HEAD = 'HEAD';

export default class Adapter {
  constructor({ timeout, headers, cache } = {}) {
    if (timeout) {
      this.timeout = timeout;
    }
    if (headers) {
      this.headers = headers;
    }
    if (cache) {
      this.cache = cache;
    }

    this.fetch = this.fetch.bind(this);
  }

  methodForRequest({ method = HTTP_METHOD_GET }) {
    return method;
  }

  headersForRequest({ headers }) {
    return merge(this.headers, headers);
  }

  pathForRequest({ url }) {
    return url;
  }

  queryForRequest({ query }) {
    return query;
  }

  bodyForRequest({ body }) {
    if (typeof body === 'string') {
      return body;
    }
    return JSON.stringify(body);
  }

  optionsForRequest({ options }) {
    let { mode = 'cors', credentials = 'same-origin' } = options || {
      mode: 'cors',
      credentials: 'same-origin'
    };

    return {
      mode,
      credentials
    };
  }

  signalForRequest({ signal }) {
    return signal;
  }

  normalizeSuccess(params, body) {
    return body;
  }

  normalizeError(params, body) {
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

  request() {
    return new RequestBuilder(this.fetch);
  }

  url(url) {
    return this.request().url(url);
  }

  fetch(params, options = {}) {
    let response = this.requestFor(params).then(request =>
      this.makeRequest(request, options)
    );
    return new ResponseProxy(response, this.normalize(params));
  }

  async urlForRequest(options) {
    return Promise.all([
      this.pathForRequest(options),
      this.queryForRequest(options)
    ]).then(([path, query]) => {
      const url = this.buildURL(path);
      return addQueryParams(url, query);
    });
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

  shouldCacheRequest(request) {
    return this.cache && request.method === HTTP_METHOD_GET;
  }

  async makeRequest(request, options = {}) {
    const { fetch, AbortController } = Adapter;
    const cache = options.cache !== false && this.shouldCacheRequest(request);

    if (cache) {
      let response = await this.cache.match(request);
      if (response) {
        return response;
      }
    }

    let [signal, teardown] = signalForRequest(request.signal, options.timeout, AbortController);

    if (signal) {
      request.signal = signal;
    }

    if (!teardown && !cache) {
      return fetch(request);
    }

    try {
      let response = await fetch(request);
      if (teardown) {
        teardown();
      }
      if (cache) {
        await this.cache.put(request, response);
      }
      return response;
    } finally {
      if (teardown) {
        teardown();
      }
    }
  }

  async requestFor(params) {
    const { Headers, Request } = Adapter;

    params = Object.freeze(params);

    let method = await this.methodForRequest(params);
    const url = await this.urlForRequest(params);
    let headers = await this.headersForRequest(params);
    const options = await this.optionsForRequest(params);
    const signal = await this.signalForRequest(params);

    method = method.toUpperCase();
    headers = new Headers(headers);

    options.method = method;
    options.headers = headers;

    if (signal) {
      options.signal = signal;
    }

    if (method === HTTP_METHOD_GET || method === HTTP_METHOD_HEAD) {
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
