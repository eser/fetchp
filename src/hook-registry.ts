import {
  UrlCollection,
  type UrlCollectionInterface,
} from "./url-collection.ts";

// interface definitions
// ---------------------
enum FetchpHookType {
  BuildRequestHeaders = "BuildRequestHeaders",
  NewRequest = "NewRequest",
  StateChange = "StateChange",
  Success = "Success",
  Error = "Error",
  Cancel = "Cancel",
}

// deno-lint-ignore no-explicit-any
type FetchpHookFn = (...params: any[]) => void;

interface FetchpHookItem {
  globals: Set<FetchpHookFn>;
  urlBased: UrlCollectionInterface<FetchpHookFn>;
}

interface HookRegistryInterface {
  items: Record<FetchpHookType, FetchpHookItem>;

  add(hookType: FetchpHookType, func: FetchpHookFn): void;
  addForUrl(
    hookType: FetchpHookType,
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    func: FetchpHookFn,
  ): void;
  clear(): void;

  callGlobalHooks(
    hookType: FetchpHookType,
    // deno-lint-ignore no-explicit-any
    ...params: any[]
  ): Promise<undefined>;
  callHooksWithRequest(
    hookType: FetchpHookType,
    request: Request | undefined,
    urlConverter: ((url: string) => URL) | undefined,
    // deno-lint-ignore no-explicit-any
    ...params: any[]
  ): Promise<undefined>;
}

class HookRegistry implements HookRegistryInterface {
  items: Record<FetchpHookType, FetchpHookItem>;

  constructor() {
    this.items = <Record<FetchpHookType, FetchpHookItem>> {};
  }

  internalEnsureHookItemExists(hookType: FetchpHookType) {
    if (!(hookType in this.items)) {
      this.items[hookType] = {
        globals: new Set<FetchpHookFn>(),
        urlBased: new UrlCollection<FetchpHookFn>(),
      };
    }
  }

  add(hookType: FetchpHookType, func: FetchpHookFn) {
    this.internalEnsureHookItemExists(hookType);
    this.items[hookType].globals.add(func);
  }

  addForUrl(
    hookType: FetchpHookType,
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    func: FetchpHookFn,
  ) {
    this.internalEnsureHookItemExists(hookType);
    this.items[hookType].urlBased.add(methods, requestUrlPattern, func);
  }

  clear(): void {
    this.items = <Record<FetchpHookType, FetchpHookItem>> {};
  }

  // deno-lint-ignore no-explicit-any
  async callGlobalHooks(hookType: FetchpHookType, ...params: any[]) {
    if (!(hookType in this.items)) {
      return;
    }

    for (const func of this.items[hookType].globals) {
      await func(...params);
    }

    return undefined;
  }

  async callHooksWithRequest(
    hookType: FetchpHookType,
    request: Request | undefined,
    urlConverter: ((url: string) => URL) | undefined,
    // deno-lint-ignore no-explicit-any
    ...params: any[]
  ) {
    if (!(hookType in this.items)) {
      return;
    }

    for (const func of this.items[hookType].globals) {
      await func(...params);
    }

    if (request !== undefined) {
      for (
        const rule of this.items[hookType].urlBased.filterByRequest(
          request,
          urlConverter,
        )
      ) {
        await rule.data(...params);
      }
    }

    return undefined;
  }
}

export {
  type FetchpHookFn,
  FetchpHookType,
  HookRegistry,
  type HookRegistryInterface,
};
