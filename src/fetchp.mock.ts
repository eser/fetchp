import { type Fetchp, type FetchpResult } from "./fetchp";

// interface definitions
// ---------------------
interface FetchpMock extends Fetchp {
  getMockResponseFn(): (request: Request) => Promise<Response>;
  setMockResponseFn(responseFn: (request: Request) => Promise<Response>): void;
}

// underlying members (private)
// ------------------------------
let baseUrl = "";
let dynamicRequestHeadersFn = (headers: Headers) => Promise.resolve();
const mockUrlContents = new Map<string, Response>();
let mockResponseFn = (request: Request) => Promise.resolve(new Response());

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

const getMockResponseFn = function getMockResponseFn() {
  return mockResponseFn;
};

const setMockResponseFn = function setMockResponseFn(
  responseFn: (request: Request) => Promise<Response>,
) {
  mockResponseFn = responseFn;
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

    const request = new Request(requestUrl, requestInit);

    return mockResponseFn(request);
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
const fetchp: FetchpMock = {
  getBaseUrl,
  setBaseUrl,

  getMockUrlContent,
  setMockUrlContent,

  getDynamicRequestHeadersFn,
  setDynamicRequestHeadersFn,

  getMockResponseFn,
  setMockResponseFn,

  request,
};

export {
  type Fetchp,
  fetchp,
  fetchp as default,
  type FetchpMock,
  type FetchpResult,
};
