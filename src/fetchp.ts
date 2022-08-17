// interface definitions
// ---------------------
import {
  type FetchpHookFn,
  FetchpHookType,
  HookRegistry,
  type HookRegistryInterface,
} from "./hook-registry";
import { MockRegistry, type MockRegistryInterface } from "./mock-registry";

enum FetchpStatus {
  IDLE = "idle",
  LOADING = "loading",
  ERROR = "error",
  CANCELED = "canceled",
  SUCCESS = "success",
}

interface FetchpRequestInit extends RequestInit {
  autoFetch?: boolean;
  statusCallback?: (status: FetchpStatus) => void;
  successCallback?: (data: any) => void;
  errorCallback?: (error: unknown) => void;
  cancelCallback?: () => void;
}

interface FetchpResultInterface<T = any> {
  readonly request: Request | undefined;
  readonly response: Promise<Response | undefined>;
  abortController: AbortController;
  readonly status: FetchpStatus;
  readonly error: unknown | undefined;
  readonly data: Promise<T | undefined>;

  exec(): FetchpResultInterface<T>;
}

interface FetchpInterface {
  baseUrl: string | undefined;
  hooks: HookRegistryInterface;
  mocks: MockRegistryInterface;

  setBaseUrl: (url: string) => void;

  request: <T = any>(
    method: string,
    url: string,
    init?: FetchpRequestInit,
  ) => FetchpResultInterface<T>;
}

// implementation (public)
// -----------------------
class Fetchp implements FetchpInterface {
  baseUrl: string | undefined;
  hooks: HookRegistryInterface;
  mocks: MockRegistryInterface;

  constructor() {
    this.baseUrl = undefined;
    this.hooks = new HookRegistry();
    this.mocks = new MockRegistry();
  }

  setBaseUrl(url: string | undefined) {
    this.baseUrl = url;
  }

  internalFetcher(request: Request) {
    return fetch(request);
  }

  internalDataDeserializer<T>(
    response: Response | undefined,
  ): Promise<T | undefined> {
    if (response === undefined) {
      return Promise.resolve(undefined);
    }

    const contentType = response.headers?.get("content-type");

    if (
      contentType !== null && contentType !== undefined &&
      contentType.startsWith("application/json")
    ) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as Promise<T>;
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
    let error: unknown | undefined;
    let request: Request | undefined;
    let response: Promise<Response | undefined>;

    const promise = awaiter
      .then(() => {
        return Promise.all([
          undefined,
          undefined,
          this.hooks.callGlobalHooks(
            FetchpHookType.BuildRequestHeaders,
            headers,
          ),
        ]);
      })
      .then(() => {
        // headers
        const requestInit = {
          method,
          signal: abortController.signal,
          ...(init ?? {}),
          headers,
        };

        request = new Request(url_, requestInit);

        return Promise.all([
          request,
          undefined,
          undefined,
          this.hooks.callHooksWithRequest(
            FetchpHookType.NewRequest,
            request,
            this.internalUrlConverter,
            request,
          ),
        ]);
      })
      .then(([req]) => {
        const mock = this.mocks.find(
          req,
          (url) => this.internalUrlConverter(url),
        );

        return Promise.all([req, mock?.responseFn?.(req), undefined]);
      })
      .then(([req, res]) => {
        if (res !== undefined) {
          status = FetchpStatus.SUCCESS;

          return Promise.all([
            req,
            res,
            undefined,
            init?.statusCallback?.(status),
            this.hooks.callHooksWithRequest(
              FetchpHookType.StateChange,
              req,
              this.internalUrlConverter,
              req,
              status,
            ),
          ]);
        }

        status = FetchpStatus.LOADING;
        return Promise.all([
          req,
          this.internalFetcher(req),
          undefined,
          init?.statusCallback?.(status),
          this.hooks.callHooksWithRequest(
            FetchpHookType.StateChange,
            req,
            this.internalUrlConverter,
            req,
            status,
          ),
        ]);
      })
      .then(([req, res]) => {
        status = FetchpStatus.SUCCESS;

        return Promise.all([
          req,
          res,
          undefined,
          init?.statusCallback?.(status),
          this.hooks.callHooksWithRequest(
            FetchpHookType.StateChange,
            req,
            this.internalUrlConverter,
            req,
            status,
          ),
        ]);
      })
      .catch((err) => {
        error = err;
        status = FetchpStatus.ERROR;

        return Promise.all([
          undefined,
          undefined,
          err,
          init?.errorCallback?.(err),
          init?.statusCallback?.(status),
          this.hooks.callHooksWithRequest(
            FetchpHookType.StateChange,
            request,
            this.internalUrlConverter,
            request,
            status,
          ),
          this.hooks.callHooksWithRequest(
            FetchpHookType.Error,
            request,
            this.internalUrlConverter,
            request,
            err,
          ),
        ]);
      })
      .finally(() => {
        if (abortController.signal.aborted) {
          status = FetchpStatus.CANCELED;

          return Promise.all([
            undefined,
            undefined,
            undefined,
            init?.cancelCallback?.(),
            init?.statusCallback?.(status),
            this.hooks.callHooksWithRequest(
              FetchpHookType.StateChange,
              request,
              this.internalUrlConverter,
              request,
              status,
            ),
            this.hooks.callHooksWithRequest(
              FetchpHookType.Cancel,
              request,
              this.internalUrlConverter,
              request,
            ),
          ]);
        }
      });

    response = promise.then(([, res, err]) => {
      if (err !== undefined) {
        return undefined;
      }

      return res;
    });

    const data = response.then(async (res) => {
      const serialized = await this.internalDataDeserializer<T>(res);

      return Promise.all([
        serialized,
        init?.successCallback?.(serialized),
        this.hooks.callHooksWithRequest(
          FetchpHookType.Success,
          request,
          this.internalUrlConverter,
          request,
          serialized,
        ),
      ]);
    })
      .then(([serialized]) => serialized);

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

    if (init?.autoFetch !== false) {
      awaiterResolve(undefined);
    }

    return result;
  }
}

// singleton instance for predefined, default fetchp object
const fetchp = new Fetchp();

export {
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
