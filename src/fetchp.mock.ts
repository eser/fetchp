import {
  Fetchp,
  type FetchpInterface,
  type FetchpResultInterface,
} from "./fetchp";

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

    this.mockResponseFn = (request: Request) => Promise.resolve(new Response());
  }

  setMockResponseFn(responseFn: (request: Request) => Promise<Response>) {
    this.mockResponseFn = responseFn;
  }

  internalFetcher(requestUrl: string, requestInit: RequestInit) {
    const request = new Request(requestUrl, requestInit);

    return this.mockResponseFn(request);
  }
}

// singleton instance for predefined, default fetchp object
const fetchpMock = new FetchpMock();

export {
  type FetchpInterfaceMock as FetchpInterface,
  FetchpMock as Fetchp,
  fetchpMock as default,
  fetchpMock as fetchp,
  type FetchpResultInterface,
};
