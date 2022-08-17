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

type FetchpHookFn = (...params: any[]) => void;

interface HookRegistryInterface {
  items: Record<FetchpHookType, Set<FetchpHookFn>>;

  add(hookType: FetchpHookType, func: FetchpHookFn): void;

  callHook(hookType: FetchpHookType, ...params: any[]): Promise<undefined>;
}

class HookRegistry implements HookRegistry {
  items: Record<FetchpHookType, Set<FetchpHookFn>>;

  constructor() {
    this.items = <Record<FetchpHookType, Set<FetchpHookFn>>> {};
  }

  add(hookType: FetchpHookType, func: FetchpHookFn) {
    if (!(hookType in this.items)) {
      this.items[hookType] = new Set<FetchpHookFn>();
    }

    this.items[hookType].add(func);
  }

  async callHook(hookType: FetchpHookType, ...params: any[]) {
    if (!(hookType in this.items)) {
      return;
    }

    for (const func of this.items[hookType]) {
      await func(...params);
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
