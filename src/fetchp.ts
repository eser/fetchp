// interface definitions
// ---------------------
interface FetchpResultInterface<T = any> {
  requestUrl: URL;
  response: Promise<Response>;
  abortController: AbortController;
  data: Promise<T>;
}

interface FetchpInterface {
  baseUrl: string;
  dynamicRequestHeadersFn: (headers: Headers) => Promise<void>;
  mockUrlContents: Map<string, Response>;

  setBaseUrl: (url: string) => void;
  setMockUrlContent(url: string, content?: Response): void;
  setDynamicRequestHeadersFn(
    headersFn: (headers: Headers) => Promise<void>,
  ): void;

  request: <T = any>(
    method: string,
    url: string,
    init?: RequestInit,
  ) => FetchpResultInterface<T>;
}

// implementation (public)
// -----------------------
class Fetchp implements FetchpInterface {
  baseUrl: string;
  dynamicRequestHeadersFn: (headers: Headers) => Promise<void>;
  mockUrlContents: Map<string, Response>;

  constructor() {
    this.baseUrl = "";
    this.dynamicRequestHeadersFn = (headers: Headers) => Promise.resolve();
    this.mockUrlContents = new Map<string, Response>();
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setDynamicRequestHeadersFn(headersFn: (headers: Headers) => Promise<void>) {
    this.dynamicRequestHeadersFn = headersFn;
  }

  setMockUrlContent(url: string, content?: Response) {
    if (content === undefined) {
      this.mockUrlContents.delete(url);

      return;
    }

    this.mockUrlContents.set(url, content);
  }

  internalFetcher(requestUrl: URL, requestInit: RequestInit) {
    return fetch(requestUrl, requestInit);
  }

  internalDataDeserializer<T>(response: Response) {
    const contentType = response.headers.get("content-type");

    if (
      contentType !== null && contentType.startsWith("application/json")
    ) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as Promise<T>;
  }

  request<T = any>(method: string, url: string, init?: RequestInit) {
    const requestUrl = new URL(url, this.baseUrl);

    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const abortController = new AbortController();

    const response = this.dynamicRequestHeadersFn(headers).then(() => {
      const requestInit = {
        method,
        signal: abortController.signal,
        ...(init ?? {}),
        headers,
      };

      // console.log("[request]", requestUrl, requestInit);

      const mockUrlContent = this.mockUrlContents.get(url) ??
        this.mockUrlContents.get(requestUrl.toString());
      if (mockUrlContent !== undefined) {
        return Promise.resolve(mockUrlContent);
      }

      return this.internalFetcher(requestUrl, requestInit);
    });

    const result = {
      requestUrl,
      response,
      abortController,

      data: response.then((res) => this.internalDataDeserializer<T>(res)),
    };

    return result;
  }
}

// singleton instance for predefined, default fetchp object
const fetchp = new Fetchp();

export {
  Fetchp,
  fetchp,
  fetchp as default,
  type FetchpInterface,
  type FetchpResultInterface,
};
