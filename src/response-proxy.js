export default class ResponseProxy {
  constructor(promise, normalize) {
    this.promise = promise;
    this.normalize = normalize;
  }

  async json() {
    let response = await this.promise;
    let body = await readBody(response, 'json', this.normalize);
    return respond(response, body);
  }

  async text() {
    let response = await this.promise;
    let body = await readBody(response, 'text', this.normalize);
    return respond(response, body);
  }

  async response() {
    let response = await this.promise;
    let { ok, status, statusText, headers } = response;

    return {
      ok,
      status,
      statusText,
      headers: headersToObject(headers),
      json: () => readBody(response, 'json', this.normalize),
      text: () => readBody(response, 'text', this.normalize)
    };
  }

  then() {
    return this.promise.then(...arguments);
  }

  catch() {
    return this.promise.catch(...arguments);
  }

  finally() {
    return this.promise.finally(...arguments);
  }
}

function respond(response, body) {
  if (response.ok) {
    return body;
  }
  let error = new Error('NetworkError');
  error.status = response.status;
  error.body = body;
  error.response = response;
  throw error;
}

function readBody(response, type, normalize) {
  if (response.ok && response.status === 204) {
    return null;
  }
  return response[type]().then(body => normalize(body, response));
}

function headersToObject(headers) {
  return Array.from(headers).reduce((headers, [key, value]) => {
    headers[key] = value;
    return headers;
  }, {});
}
