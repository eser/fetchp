import {
  CacheRegistry,
  type CacheRegistryInterface,
  Fetchp,
  type FetchpHookFn,
  FetchpHookType,
  type FetchpInterface,
  type FetchpRequestInit,
  type FetchpResultInterface,
  FetchpStatus,
  HookRegistry,
  type HookRegistryInterface,
  MockRegistry,
  type MockRegistryInterface,
} from "./fetchp.ts";

// interface definitions
// ---------------------
interface FetchpInterfaceMock extends FetchpInterface {
  mockResponseFn: (request: Request) => Promise<Response>;

  setMockResponseFn(responseFn: (request: Request) => Promise<Response>): void;
}

// implementation (public)
// -----------------------
class FetchpMock extends Fetchp implements FetchpInterfaceMock {
  mockResponseFn: (request: Request) => Promise<Response>;

  constructor() {
    super();

    this.mockResponseFn = () => Promise.resolve(new Response());
  }

  setMockResponseFn(responseFn: (request: Request) => Promise<Response>) {
    this.mockResponseFn = responseFn;
  }

  override internalFetcher(request: Request) {
    return this.mockResponseFn(request);
  }
}

// singleton instance for predefined, default fetchp object
const fetchpMock = new FetchpMock();

export {
  CacheRegistry,
  type CacheRegistryInterface,
  type FetchpHookFn,
  FetchpHookType,
  type FetchpInterface,
  FetchpMock as Fetchp,
  fetchpMock as default,
  fetchpMock as fetchp,
  type FetchpRequestInit,
  type FetchpResultInterface,
  FetchpStatus,
  HookRegistry,
  type HookRegistryInterface,
  MockRegistry,
  type MockRegistryInterface,
};
