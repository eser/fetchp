import { fetchp } from "./fetchp";

describe("fetchp", () => {
  test("baseUrl setter", () => {
    fetchp.setBaseUrl("http://localhost/");

    expect(fetchp.baseUrl).toEqual("http://localhost/");
  });

  test("baseUrl transformer", () => {
    fetchp.setBaseUrl("https://jsonplaceholder.typicode.com");

    const res1 = fetchp.request("GET", "/posts");
    const res2 = fetchp.request("GET", "http://www.google.com");

    expect(res1.requestUrl.toString()).toEqual(
      "https://jsonplaceholder.typicode.com/posts",
    );
    expect(res2.requestUrl.toString()).toEqual("http://www.google.com/");
  });

  test("mockUrlContent", async () => {
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

    fetchp.setMockUrlContent("/test", mockResponse);

    const response = fetchp.request("GET", "/test");

    expect(await response.data).toEqual(mockContent);
  });
});
