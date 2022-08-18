import { UrlCollection, type UrlCollectionInterface } from "./url-collection";

// interface definitions
// ---------------------
type CacheItem = Promise<Response>;

interface CacheRegistryInterface {
  items: UrlCollectionInterface<CacheItem>;
}

class CacheRegistry implements CacheRegistryInterface {
  items: UrlCollection<CacheItem>;

  constructor() {
    this.items = new UrlCollection<CacheItem>();
  }
}

export { CacheRegistry, type CacheRegistryInterface };
