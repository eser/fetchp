// interface definitions
// ---------------------
import {
  type FetchpHookFn,
  FetchpHookType,
  HookRegistry,
  type HookRegistryInterface,
} from "./hook-registry.ts";
import { MockRegistry, type MockRegistryInterface } from "./mock-registry.ts";
import {
  CacheRegistry,
  type CacheRegistryInterface,
} from "./cache-registry.ts";

enum FetchpStatus {
  IDLE = "idle",
  PREPARING = "preparing",
  FETCHING = "fetching",
  LOADING = "loading",
  ERROR = "error",
  CANCELED = "canceled",
  SUCCESS = "success",
}

interface FetchpRequestInit extends RequestInit {
  immediate?: boolean;
  cacheRequest?: boolean;
  statusCallback?: (status: FetchpStatus) => void;
  // deno-lint-ignore no-explicit-any
  successCallback?: (data: any) => void;
  // deno-lint-ignore no-explicit-any
  errorCallback?: (error: any) => void;
  cancelCallback?: () => void;
}

// deno-lint-ignore no-explicit-any
interface FetchpResultInterface<T = any> {
  readonly request: Request | undefined;
  readonly response: Promise<Response | undefined>;
  abortController: AbortController;
  readonly status: FetchpStatus;
  // deno-lint-ignore no-explicit-any
  readonly error: any;
  readonly data: Promise<T | undefined>;

  exec(): FetchpResultInterface<T>;
}

interface FetchpInterface {
  baseUrl: string | undefined;
  hooks: HookRegistryInterface;
  mocks: MockRegistryInterface;
  cache: CacheRegistryInterface;

  setBaseUrl: (url: string) => void;

  // deno-lint-ignore no-explicit-any
  request: <T = any>(
    method: string,
    url: string,
    init?: FetchpRequestInit,
  ) => FetchpResultInterface<T>;
}

// implementation (public)
// -----------------------
type InternalFetchState = [
  status: FetchpStatus,
  request: Request | undefined,
  response: Response | undefined,
  // deno-lint-ignore no-explicit-any
  error: any,
  // deno-lint-ignore no-explicit-any
  ...others: any[],
];

class Fetchp implements FetchpInterface {
  baseUrl: string | undefined;
  hooks: HookRegistryInterface;
  mocks: MockRegistryInterface;
  cache: CacheRegistryInterface;

  constructor() {
    this.baseUrl = undefined;
    this.hooks = new HookRegistry();
    this.mocks = new MockRegistry();
    this.cache = new CacheRegistry();
  }

  setBaseUrl(url: string | undefined) {
    this.baseUrl = url;
  }

  internalMockChecker(request: Request): Promise<Response> | undefined {
    const mock = this.mocks.find(
      request,
      (url) => this.internalUrlConverter(url),
    );

    return mock?.responseFn?.(request);
  }

  internalCacheChecker(request: Request): Promise<Response> | undefined {
    const cache = this.cache.items.filterByRequest(
      request,
      (url) => this.internalUrlConverter(url),
    );

    return cache?.[0]?.data;
  }

  internalFetcher(request: Request) {
    return fetch(request);
  }

  internalDataDeserializer<T>(
    response: Response,
    cacheMode: boolean,
  ): Promise<T> {
    const contentType = response.headers?.get("content-type");

    const _res = cacheMode ? response.clone() : response;

    if (
      contentType !== null && contentType !== undefined &&
      contentType.startsWith("application/json")
    ) {
      return _res.json() as Promise<T>;
    }

    return _res.text() as unknown as Promise<T>;
  }

  internalUrlConverter(url: string) {
    return new URL(url, this.baseUrl);
  }

  internalAwaiterGenerator<T = unknown>(): [(value: T) => void, Promise<T>] {
    let resolveFnc: (value: T) => void;

    const promise = new Promise<T>((resolve) => {
      resolveFnc = resolve;
    });

    return [resolveFnc!, promise];
  }

  internalRequestStep1InitHeaders(
    headers: Headers,
    init: FetchpRequestInit | undefined,
    callback: (status: FetchpStatus) => void,
  ): Promise<InternalFetchState> {
    return Promise.all([
      FetchpStatus.PREPARING,
      undefined,
      undefined,
      callback(FetchpStatus.PREPARING),
      init?.statusCallback?.(FetchpStatus.PREPARING),
      this.hooks.callGlobalHooks(
        FetchpHookType.StateChange,
        undefined,
        FetchpStatus.PREPARING,
      ),
      this.hooks.callGlobalHooks(
        FetchpHookType.BuildRequestHeaders,
        headers,
      ),
    ]);
  }

  internalRequestStep2InitRequest(
    method: string,
    url: URL,
    headers: Headers,
    init: FetchpRequestInit | undefined,
    abortController: AbortController,
    callback: (status: FetchpStatus, request: Request) => void,
  ): Promise<InternalFetchState> {
    const requestInit = {
      method,
      signal: abortController.signal,
      ...(init ?? {}),
      headers,
    };

    const request = new Request(url, requestInit);

    return Promise.all([
      FetchpStatus.PREPARING,
      request,
      undefined,
      undefined,
      callback(FetchpStatus.PREPARING, request),
      this.hooks.callHooksWithRequest(
        FetchpHookType.NewRequest,
        request,
        this.internalUrlConverter,
        request,
      ),
    ]);
  }

  internalRequestStep3CheckForMocks(
    request: Request | undefined,
    abortController: AbortController,
    _callback: (status: FetchpStatus) => void,
  ): Promise<InternalFetchState> {
    const mockedResponse =
      (request !== undefined && !abortController.signal.aborted)
        ? this.internalMockChecker(request)
        : undefined;

    return Promise.all([
      FetchpStatus.PREPARING,
      request,
      mockedResponse,
      undefined,
      // callback(FetchpStatus.PREPARING),
    ]);
  }

  internalRequestStep4CheckForCache(
    request: Request | undefined,
    mockedResponse: Response | undefined,
    abortController: AbortController,
    _callback: (status: FetchpStatus) => void,
  ): Promise<InternalFetchState> {
    const mockedOrCachedResponse =
      (request === undefined || abortController.signal.aborted ||
          mockedResponse !== undefined)
        ? mockedResponse
        : this.internalCacheChecker(request);

    return Promise.all([
      FetchpStatus.PREPARING,
      request,
      mockedOrCachedResponse,
      undefined,
      // callback(FetchpStatus.PREPARING),
    ]);
  }

  internalRequestStep5ExecuteRequest(
    request: Request | undefined,
    mockedOrCachedResponse: Response | undefined,
    init: FetchpRequestInit | undefined,
    abortController: AbortController,
    callback: (status: FetchpStatus) => void,
  ): Promise<InternalFetchState> {
    if (
      request !== undefined && mockedOrCachedResponse === undefined &&
      !abortController.signal.aborted
    ) {
      const fetchedResponse = this.internalFetcher(request);

      if (init?.cacheRequest === true) {
        this.cache.items.add(
          request.method ?? "GET",
          request.url,
          fetchedResponse,
        );
      }

      return Promise.all([
        FetchpStatus.FETCHING,
        request,
        fetchedResponse,
        undefined,
        callback(FetchpStatus.FETCHING),
        init?.statusCallback?.(FetchpStatus.FETCHING),
        this.hooks.callHooksWithRequest(
          FetchpHookType.StateChange,
          request,
          this.internalUrlConverter,
          request,
          FetchpStatus.FETCHING,
        ),
      ]);
    }

    return Promise.all([
      FetchpStatus.PREPARING,
      request,
      mockedOrCachedResponse,
      undefined,
      // callback(FetchpStatus.PREPARING),
    ]);
  }

  internalRequestOnError(
    request: Request | undefined,
    // deno-lint-ignore no-explicit-any
    error: any,
    // deno-lint-ignore no-explicit-any
    callback: (status: FetchpStatus, error: any) => void,
  ): Promise<InternalFetchState> {
    return Promise.all([
      FetchpStatus.ERROR,
      request,
      undefined,
      error,
      callback(FetchpStatus.ERROR, error),
    ]);
  }

  internalLoadStep1CheckState(
    status: FetchpStatus,
    request: Request | undefined,
    response: Response | undefined,
    // deno-lint-ignore no-explicit-any
    error: any,
    init: FetchpRequestInit | undefined,
    abortController: AbortController,
    callback: (status: FetchpStatus) => void,
  ): Promise<InternalFetchState> {
    // status !== FetchpStatus.CANCELED &&
    if (abortController.signal.aborted) {
      return Promise.all([
        FetchpStatus.CANCELED,
        request,
        response,
        error,
        callback(FetchpStatus.CANCELED),
        init?.cancelCallback?.(),
        init?.statusCallback?.(FetchpStatus.CANCELED),
        this.hooks.callHooksWithRequest(
          FetchpHookType.StateChange,
          request,
          this.internalUrlConverter,
          request,
          FetchpStatus.CANCELED,
        ),
        this.hooks.callHooksWithRequest(
          FetchpHookType.Cancel,
          request,
          this.internalUrlConverter,
          request,
        ),
      ]);
    }

    if (status === FetchpStatus.ERROR) {
      return Promise.all([
        FetchpStatus.ERROR,
        request,
        response,
        error,
        callback(FetchpStatus.ERROR),
        init?.errorCallback?.(error),
        this.hooks.callHooksWithRequest(
          FetchpHookType.StateChange,
          request,
          this.internalUrlConverter,
          request,
          FetchpStatus.ERROR,
        ),
        this.hooks.callHooksWithRequest(
          FetchpHookType.Error,
          request,
          this.internalUrlConverter,
          request,
          error,
        ),
      ]);
    }

    return Promise.all([
      FetchpStatus.LOADING,
      request,
      response,
      error,
      callback(FetchpStatus.LOADING),
      init?.statusCallback?.(FetchpStatus.LOADING),
      this.hooks.callHooksWithRequest(
        FetchpHookType.StateChange,
        request,
        this.internalUrlConverter,
        request,
        FetchpStatus.LOADING,
      ),
    ]);
  }

  // deno-lint-ignore no-explicit-any
  internalLoadStep2Deserialization<T = any>(
    status: FetchpStatus,
    request: Request | undefined,
    response: Response | undefined,
    // deno-lint-ignore no-explicit-any
    error: any,
    init: FetchpRequestInit | undefined,
    // deno-lint-ignore no-explicit-any
    callback: (status: FetchpStatus, error: any) => void,
    // deno-lint-ignore no-explicit-any
  ): Promise<[FetchpStatus, T | undefined, any, ...any[]]> {
    if ([FetchpStatus.CANCELED, FetchpStatus.ERROR].includes(status)) {
      return Promise.all([
        status,
        undefined,
        error,
        // callback(status, error),
      ]);
    }

    const deserialized = (response !== undefined)
      ? this.internalDataDeserializer<T>(response, init?.cacheRequest ?? false)
      : undefined;

    return Promise.all([
      FetchpStatus.SUCCESS,
      deserialized,
      error,
      callback(FetchpStatus.SUCCESS, error),
      init?.successCallback?.(deserialized),
      init?.statusCallback?.(FetchpStatus.SUCCESS),
      this.hooks.callHooksWithRequest(
        FetchpHookType.StateChange,
        request,
        this.internalUrlConverter,
        request,
        FetchpStatus.SUCCESS,
      ),
      this.hooks.callHooksWithRequest(
        FetchpHookType.Success,
        request,
        this.internalUrlConverter,
        request,
        deserialized,
      ),
    ]);
  }

  // deno-lint-ignore no-explicit-any
  request<T = any>(method: string, url: string, init?: FetchpRequestInit) {
    const url_ = this.internalUrlConverter(url);

    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const abortController = new AbortController();
    const [awaiterResolve, awaiter] = this.internalAwaiterGenerator<
      Response | undefined
    >();

    let status = FetchpStatus.IDLE;
    // deno-lint-ignore no-explicit-any
    let error: any;
    let request: Request | undefined;

    // -- REQUEST PART -- //
    const promise = awaiter
      .then(() =>
        this.internalRequestStep1InitHeaders(
          headers,
          init,
          (newStatus) => status = newStatus,
        )
      )
      .then(() =>
        this.internalRequestStep2InitRequest(
          method,
          url_,
          headers,
          init,
          abortController,
          (newStatus, newRequest) => {
            status = newStatus;
            request = newRequest;
          },
        )
      )
      .then(([, req]) =>
        this.internalRequestStep3CheckForMocks(
          req,
          abortController,
          (newStatus) => status = newStatus,
        )
      )
      .then(([, req, res]) =>
        this.internalRequestStep4CheckForCache(
          req,
          res,
          abortController,
          (newStatus) => status = newStatus,
        )
      )
      .then(([, req, res]) =>
        this.internalRequestStep5ExecuteRequest(
          req,
          res,
          init,
          abortController,
          (newStatus) => status = newStatus,
        )
      )
      .catch((err) =>
        this.internalRequestOnError(request, err, (newStatus, newError) => {
          status = newStatus;
          error = newError;
        })
      );

    const response: Promise<Response | undefined> = promise.then(([, , res]) =>
      res
    );

    // -- LOAD PART -- //
    const data = promise.then(([state, req, res, err]) =>
      this.internalLoadStep1CheckState(
        state,
        req,
        res,
        err,
        init,
        abortController,
        (newStatus) => status = newStatus,
      )
    ).then(([state, req, res, err]) =>
      this.internalLoadStep2Deserialization<T>(
        state,
        req,
        res,
        err,
        init,
        (newStatus, newError) => {
          status = newStatus;
          error = newError;
        },
      )
    ).then(([, data]) => data);

    const result = {
      get request() {
        return request;
      },
      get response() {
        return response;
      },
      abortController,

      get status() {
        return status;
      },

      get error() {
        return error;
      },

      get data() {
        return data;
      },

      exec: () => {
        awaiterResolve(undefined);

        return result;
      },
    };

    if (init?.immediate !== false) {
      awaiterResolve(undefined);
    }

    return result;
  }
}

// singleton instance for predefined, default fetchp object
const fetchp = new Fetchp();

export {
  CacheRegistry,
  type CacheRegistryInterface,
  Fetchp,
  fetchp,
  fetchp as default,
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
};
