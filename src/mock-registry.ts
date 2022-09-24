import {
  UrlCollection,
  type UrlCollectionInterface,
} from "./url-collection.ts";

// interface definitions
// ---------------------
type MockResponseFn = (request: Request) => Promise<Response>;

interface MockRegistryInterface {
  items: UrlCollectionInterface<MockResponseFn>;

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    response: Response | MockResponseFn,
  ): void;
  clear(): void;

  find(
    request: Request,
    urlConverter?: (url: string) => URL,
  ): {
    request: Request;
    responseFn: MockResponseFn | undefined;
  };
}

class MockRegistry implements MockRegistryInterface {
  items: UrlCollection<MockResponseFn>;

  constructor() {
    this.items = new UrlCollection<MockResponseFn>();
  }

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    response: Response | MockResponseFn,
  ): void {
    const responseFn = (response.constructor === Function)
      ? <MockResponseFn> response
      : (_: Request) => Promise.resolve(<Response> response);

    this.items.add(methods, requestUrlPattern, responseFn);
  }

  clear(): void {
    this.items.clear();
  }

  find(request: Request, urlConverter?: (url: string) => URL) {
    const foundMocks = this.items.filter(
      request.method,
      request.url,
      urlConverter,
    );

    if (foundMocks.length === 0) {
      return {
        request: request,
        responseFn: undefined,
      };
    }

    return {
      request: request,
      responseFn: foundMocks[0]?.data,
    };
  }
}

export { MockRegistry, type MockRegistryInterface };
