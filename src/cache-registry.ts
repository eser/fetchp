import {
  UrlCollection,
  type UrlCollectionInterface,
} from "./url-collection.ts";

// interface definitions
// ---------------------
type CacheItem = Promise<Response>;

interface CacheRegistryInterface {
  items: UrlCollectionInterface<CacheItem>;
  clear(): void;
}

class CacheRegistry implements CacheRegistryInterface {
  items: UrlCollection<CacheItem>;

  constructor() {
    this.items = new UrlCollection<CacheItem>();
  }

  clear(): void {
    this.items.clear();
  }
}

export { CacheRegistry, type CacheRegistryInterface };
