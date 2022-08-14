import { fetchp } from "./fetchp";

describe("fetchp", () => {
  test("baseUrl", () => {
    fetchp.setBaseUrl("http://localhost/");

    expect(fetchp.getBaseUrl()).toEqual("http://localhost/");
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
