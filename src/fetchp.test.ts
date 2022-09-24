import { fetchp, FetchpHookType, FetchpStatus } from "./fetchp.ts";
import { asserts, mock } from "./deps.ts";

Deno.test("fetchp", { permissions: { net: true } }, async (t) => {
  await t.step("baseUrl setter", () => {
    fetchp.setBaseUrl("http://localhost/");

    asserts.assertEquals(fetchp.baseUrl, "http://localhost/");

    fetchp.setBaseUrl(undefined);
  });

  await t.step("baseUrl transformer", async () => {
    fetchp.setBaseUrl("https://jsonplaceholder.typicode.com");

    const res1 = fetchp.request("GET", "/posts");
    const res2 = fetchp.request("GET", "http://www.google.com");

    await Promise.all([res1.data, res2.data]);

    // asserts.assertExists(await res1.data);
    // asserts.assertExists(await res2.data);

    asserts.assertEquals(
      res1.request?.url.toString(),
      "https://jsonplaceholder.typicode.com/posts",
    );
    asserts.assertEquals(
      res2.request?.url.toString(),
      "http://www.google.com/",
    );
  });

  await t.step("mocks: basic", async () => {
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

    asserts.assertEquals(await response.data, mockContent);

    fetchp.mocks.clear();
  });

  await t.step("hooks: BuildRequestHeaders", async () => {
    const hookSpyFn = mock.spy();

    fetchp.hooks.add(FetchpHookType.BuildRequestHeaders, hookSpyFn);

    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    asserts.assertExists(await response.data);
    mock.assertSpyCalls(hookSpyFn, 1);

    fetchp.hooks.clear();
  });

  await t.step("hooks: NewRequest", async () => {
    const hookSpyFn = mock.spy();

    fetchp.hooks.add(FetchpHookType.NewRequest, hookSpyFn);

    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    asserts.assertExists(await response.data);
    asserts.assert((await response.data).length >= 10);
    asserts.assertStrictEquals(response.status, FetchpStatus.SUCCESS);
    mock.assertSpyCalls(hookSpyFn, 1);

    fetchp.hooks.clear();
  });

  await t.step("hooks: NewRequest with url filter", async () => {
    const hookSpyFn = mock.spy();

    fetchp.hooks.addForUrl(
      FetchpHookType.NewRequest,
      "GET",
      /^https:\/\/jsonplaceholder\.typicode\.com\//,
      hookSpyFn,
    );

    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    asserts.assertExists(await response.data);
    asserts.assert((await response.data).length >= 10);
    asserts.assertStrictEquals(response.status, FetchpStatus.SUCCESS);
    mock.assertSpyCalls(hookSpyFn, 1);

    fetchp.hooks.clear();
  });

  await t.step("disable autofetch", async () => {
    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
      {
        autoFetch: false,
      },
    );

    // asserts.assertEquals(await response.data, undefined);
    asserts.assertStrictEquals(response.status, FetchpStatus.IDLE);

    setTimeout(() => response.exec(), 500);

    asserts.assertExists(await response.data);
    asserts.assert((await response.data).length >= 10);
    asserts.assertStrictEquals(response.status, FetchpStatus.SUCCESS);
  });

  await t.step("caching", async () => {
    const statusFetchingSpyFn = mock.spy();
    const statusLoadingSpyFn = mock.spy();

    const doRequest = () =>
      fetchp.request(
        "GET",
        "https://jsonplaceholder.typicode.com/todos",
        {
          cacheRequest: true,
          statusCallback: (status) => {
            if (status === FetchpStatus.FETCHING) {
              statusFetchingSpyFn();
              return;
            }

            if (status === FetchpStatus.LOADING) {
              statusLoadingSpyFn();
              return;
            }
          },
        },
      );

    const response1 = await doRequest();
    await new Promise((r) => setTimeout(r, 1000));
    const response2 = await doRequest();

    asserts.assertExists(await response1.data);
    asserts.assert((await response1.data).length >= 10);
    asserts.assertStrictEquals(response1.status, FetchpStatus.SUCCESS);

    asserts.assertExists(await response2.data);
    asserts.assert((await response2.data).length >= 10);
    asserts.assertStrictEquals(response2.status, FetchpStatus.SUCCESS);

    mock.assertSpyCalls(statusFetchingSpyFn, 1);
    mock.assertSpyCalls(statusLoadingSpyFn, 2);

    fetchp.cache.clear();
  });

  await t.step("abort request", async () => {
    const response = fetchp.request(
      "GET",
      "https://jsonplaceholder.typicode.com/todos",
    );

    response.abortController.abort();

    asserts.assertEquals(await response.data, undefined);
    asserts.assertStrictEquals(response.status, FetchpStatus.CANCELED);
  });

  await t.step("invalid url", async () => {
    const response = fetchp.request(
      "GET",
      "impossiblescenario://invalid",
    );

    asserts.assertEquals(await response.data, undefined);
    asserts.assertStrictEquals(response.status, FetchpStatus.ERROR);
    asserts.assertExists(response.error);
  });
});
