// interface definitions
// ---------------------
interface FetchpResult<T = any> {
  response: Promise<Response>;
  abortController: AbortController;
  data: Promise<T>;
}

interface Fetchp {
  getBaseUrl(): string;
  setBaseUrl(url: string): void;

  getMockUrlContent(url: string): Response | undefined;
  setMockUrlContent(url: string, content?: Response): void;

  getDynamicRequestHeadersFn(): (headers: Headers) => Promise<void>;
  setDynamicRequestHeadersFn(
    headersFn: (headers: Headers) => Promise<void>,
  ): void;

  request: <T = any>(
    method: string,
    url: string,
    init?: RequestInit,
  ) => FetchpResult<T>;
}

// underlying members (private)
// ------------------------------
let baseUrl = "";
let dynamicRequestHeadersFn = (headers: Headers) => Promise.resolve();
const mockUrlContents = new Map<string, Response>();

// implementation (public)
// -----------------------
const getBaseUrl = function getBaseUrl() {
  return baseUrl;
};

const setBaseUrl = function setBaseUrl(url: string) {
  baseUrl = url;
};

const getMockUrlContent = function getMockUrlContent(url: string) {
  return mockUrlContents.get(url);
};

const setMockUrlContent = function setMockUrlContent(
  url: string,
  content?: Response,
) {
  if (content === undefined) {
    mockUrlContents.delete(url);

    return;
  }

  mockUrlContents.set(url, content);
};

const getDynamicRequestHeadersFn = function getDynamicRequestHeadersFn() {
  return dynamicRequestHeadersFn;
};

const setDynamicRequestHeadersFn = function setDynamicRequestHeadersFn(
  headersFn: (headers: Headers) => Promise<void>,
) {
  dynamicRequestHeadersFn = headersFn;
};

const request = function request<T = any>(
  method: string,
  url: string,
  init?: RequestInit,
): FetchpResult<T> {
  const requestUrl = `${baseUrl}${url}`;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const abortController = new AbortController();

  const response = dynamicRequestHeadersFn(headers).then(() => {
    const requestInit = {
      method,
      signal: abortController.signal,
      ...(init ?? {}),
      headers,
    };

    console.log("[request]", requestUrl, requestInit);

    const mockUrlContent = mockUrlContents.get(url) ??
      mockUrlContents.get(requestUrl);
    if (mockUrlContent !== undefined) {
      return Promise.resolve(mockUrlContent);
    }

    return fetch(
      requestUrl,
      requestInit,
    );
  });

  const result = {
    response,
    abortController,

    data: response.then((res) => {
      const contentType = res.headers.get("content-type");

      if (contentType !== null && contentType.startsWith("application/json")) {
        return res.json() as Promise<T>;
      }

      return res.text() as unknown as Promise<T>;
    }),
  };

  return result;
};

// this object is our public interface of the cloudstore service
// since it will be exported, it's important not to contain any
// private methods or dependencies from external libraries
const fetchp: Fetchp = {
  getBaseUrl,
  setBaseUrl,

  getMockUrlContent,
  setMockUrlContent,

  getDynamicRequestHeadersFn,
  setDynamicRequestHeadersFn,

  request,
};

export { type Fetchp, fetchp, fetchp as default, type FetchpResult };
