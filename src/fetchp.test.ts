import { fetchp, FetchpHookType, FetchpStatus } from "./fetchp";

beforeEach(() => {
  fetchp.setBaseUrl(undefined);
  fetchp.cache.items.clear();
});

describe("fetchp", () => {
  test("baseUrl setter", () => {
    fetchp.setBaseUrl("http://localhost/");

    expect(fetchp.baseUrl).toEqual("http://localhost/");
  });

  test("baseUrl transformer", async () => {
    fetchp.setBaseUrl("https://jsonplaceholder.typicode.com");

    const res1 = fetchp.request("GET", "/posts");
    const res2 = fetchp.request("GET", "http://www.google.com");

    await Promise.all([res1.data, res2.data]);

    expect(res1.request!.url.toString()).toEqual(
      "https://jsonplaceholder.typicode.com/posts",
    );
    expect(res2.request!.url.toString()).toEqual("http://www.google.com/");
  });

  test("mocks: basic", async () => {
    const mockContent = { hello: "world" };
    const mockResponse = new Response(
      JSON.stringify(mockContent),
      {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
        },
      },
    );

    fetchp.mocks.add("GET", "http://localhost/test", mockResponse);

    const response = fetchp.request("GET", "http://localhost/test");

    expect(await response.data).toEqual(mockContent);
  });

  test("hooks: BuildRequestHeaders", async () => {
    const hookFn = jest.fn();

    fetchp.hooks.add(FetchpHookType.BuildRequestHeaders, hookFn);

    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    expect(await response.data).toBeDefined();
    expect(hookFn).toHaveBeenCalledTimes(1);
  });

  test("hooks: NewRequest", async () => {
    const hookFn = jest.fn();

    fetchp.hooks.add(FetchpHookType.NewRequest, hookFn);

    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    expect(await response.data).toBeDefined();
    expect((await response.data).length).toBeGreaterThanOrEqual(10);
    expect(response.status).toBe(FetchpStatus.SUCCESS);
    expect(hookFn).toHaveBeenCalledTimes(1);
  });

  test("hooks: NewRequest with url filter", async () => {
    const hookFn = jest.fn();

    fetchp.hooks.addForUrl(
      FetchpHookType.NewRequest,
      "GET",
      /^https:\/\/jsonplaceholder\.typicode\.com\//,
      hookFn,
    );

    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    expect(await response.data).toBeDefined();
    expect((await response.data).length).toBeGreaterThanOrEqual(10);
    expect(response.status).toBe(FetchpStatus.SUCCESS);
    expect(hookFn).toHaveBeenCalledTimes(1);
  });

  test("disable autofetch", async () => {
    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
      {
        autoFetch: false,
      },
    );

    // expect(await response.data).toBeUndefined();
    expect(response.status).toBe(FetchpStatus.IDLE);

    setTimeout(() => response.exec(), 500);

    expect(await response.data).toBeDefined();
    expect(response.status).toBe(FetchpStatus.SUCCESS);
  });

  test("caching", async () => {
    const statusFetchingFn = jest.fn();
    const statusLoadingFn = jest.fn();

    const doRequest = () =>
      fetchp.request(
        "GET",
        "https://jsonplaceholder.typicode.com/todos",
        {
          cacheRequest: true,
          statusCallback: (status) => {
            if (status === FetchpStatus.FETCHING) {
              statusFetchingFn();
              return;
            }

            if (status === FetchpStatus.LOADING) {
              statusLoadingFn();
              return;
            }
          },
        },
      );

    const response1 = await doRequest();
    await new Promise((r) => setTimeout(r, 1000));
    const response2 = await doRequest();

    expect(await response1.data).toBeDefined();
    expect(response1.status).toBe(FetchpStatus.SUCCESS);

    expect(await response2.data).toBeDefined();
    expect(response2.status).toBe(FetchpStatus.SUCCESS);

    expect(statusFetchingFn).toHaveBeenCalledTimes(1);
    expect(statusLoadingFn).toHaveBeenCalledTimes(2);
  });

  test("abort request", async () => {
    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    response.abortController.abort();

    expect(await response.data).toBeUndefined();
    expect(response.status).toBe(FetchpStatus.CANCELED);
  });

  test("invalid url", async () => {
    const response = fetchp.request(
      "GET",
      "impossiblescenario://invalid",
    );

    expect(await response.data).toBeUndefined();
    expect(response.status).toBe(FetchpStatus.ERROR);
    expect(response.error).toBeDefined();
  });
});
