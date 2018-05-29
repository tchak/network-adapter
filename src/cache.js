import InMemoryBucket from './buckets/in-memory';

export default class Cache {
  constructor(bucket) {
    this.bucket = bucket || new InMemoryBucket();
  }

  match(request) {
    return this.get(request);
  }

  put(request, response) {
    if (response.ok) {
      return this.set(request, response).then(() => true);
    }
    return Promise.resolve(false);
  }

  cacheKey(request) {
    return request.url;
  }

  delete(request) {
    const cacheKey = this.cacheKey(request);
    return this.bucket.delete(cacheKey);
  }

  get(request) {
    const cacheKey = this.cacheKey(request);
    return Promise.resolve(this.bucket.get(cacheKey) || null);
  }

  set(request, response) {
    const cacheKey = this.cacheKey(request);
    if (!cacheKey) {
      throw new Error('Invalid cache key!');
    }
    return this.bucket.set(cacheKey, response.clone());
  }
}
