export default class InMemoryBucket {
  constructor() {
    this.map = new Map();
  }

  get(cacheKey) {
    let response = this.map.get(cacheKey);
    if (response) {
      return Promise.resolve(response.clone());
    }
    return Promise.resolve();
  }

  set(cacheKey, response) {
    this.map.set(cacheKey, response.clone());
    return Promise.resolve();
  }

  delete(cacheKey) {
    this.map.delete(cacheKey);
    return Promise.resolve();
  }
}
