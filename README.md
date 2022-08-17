# 💬 [fetchp/fetch+](https://github.com/eserozvataf/fetchp)

[![npm version][npm-image]][npm-url]
[![npm download][npm-download-image]][npm-url]
[![license][license-image]][license-url]

## Table of Contents

- [What is the fetchp/fetch+?](#what-is-the-fetchpfetch)
- [Why? What's the motivation?](#why-whats-the-motivation)
- [Quick start](#quick-start)
- [Usage](#usage)
  - [Basic HTTP Request For Text-Based Data](#basic-http-request-for-text-based-data)
  - [Basic HTTP Request For JSON Data](#basic-http-request-for-json-data)
  - [Aborting a Request](#aborting-a-request)
  - [Setting a Base URL for Requests](#setting-a-base-url-for-requests)
  - [Middlewares / Hooks](#middlewares--hooks)
  - [Middlewares / Hooks (URL Based)](#middlewares--hooks-url-based)
  - [On-Demand Fetching](#on-demand-fetching)
  - [Mocking an URL for Request](#mocking-an-url-for-request)
  - [Mocking for Testing (Buggy ATM)](#mocking-for-testing-buggy-atm)
  - [Using with _**React Hooks**_](#using-with-react-hooks)
  - [Using with _**React Hooks**_, mocking for testing](#using-with-react-hooks-mocking-for-testing)
  - [Using with _**React Hooks**_, manual fetching](#using-with-react-hooks-manual-fetching)
  - [Using with _**Deno**_](#using-with-deno)
- [Todo List](#todo-list)
- [Requirements](#requirements)
- [License](#license)
- [Contributing](#contributing)
- [To Support](#to-support)

## What is the fetchp/fetch+?

**fetchp** is "not an another HTTP client but a fetch wrapper with fluent API
and superpowers". The trailing "p" is a means for "plus".

### Why? What's the motivation?

[fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) is a
standard Web API has already been supported by modern browsers, Deno, node.js,
bun and etc.

We don't need another HTTP client. Still, a web API's target audience is very
broad. APIs like fetch are being designed carefully by the community and
organizations to be used by the general public. Any design mistake can cause
lots of unrecoverable problems. For this reason, they're keeping it simple and
running away from the idea of increasing the extra features they can cover.

So, if you want to use fetch, you may need to wrap it with some extra
functionality time to time. For example, if you call it from a React web
project, checking its loading state almost is a must. Or, if you're writing
automated tests for your application, you need to mock the fetch API.

This is where fetchp comes into play. It still using fetch's native
implementation that brought you by browsers or runtimes themselves, but in the
meantime, it wraps the fetch to provide extra functionality for developers.

Fetchp tries to assemble some tools that are useful and reusable for most of the
projects that fetch doesn't provide.

Moreover, since fetchp is a JavaScript module / npm package, it also follows the
semantic versioning and its API can be evolved in the future without breaking
any project.

## Superpowers

- [x] Fluent API
- [x] React Hooks API
- [x] Abortable requests
- [x] Testing-friendly
- [x] Mocking response for requests (not just for tests)
- [x] Setting Base URL
- [x] Automatic deserialization/parsing by content-types
- [x] On-demand fetching
- [x] Fetch status
- [x] Multiple instances of fetchp
- [x] TypeScript Type Support

More to come see [Todo List](#todo-list) section.

## Quick start

Execute `npm install fetchp` or `yarn add fetchp` to install fetchp and its
dependencies into your project directory.

## Usage

### Basic HTTP Request For Text-Based Data

```js
import { fetchp } from "fetchp";

// you don't need to await request
const req = fetchp.request("GET", "https://www.google.com/");

// you may await data instead...
// once your request is completed, it will return a string
console.log(await req.data);
```

### Basic HTTP Request For JSON Data

```js
import { fetchp } from "fetchp";

const req = fetchp.request("GET", "https://jsonplaceholder.typicode.com/posts");

// since your request will return a json, req.data will return an object
console.log(await req.data);
```

### Aborting a Request

```js
import { fetchp, FetchpStatus } from "fetchp";

const req = fetchp.request("GET", "https://jsonplaceholder.typicode.com/posts");

// abort it after 500 milliseconds
setTimeout(() => req.abortController.abort(), 500);

// you can check status afterwars
assert(req.status === FetchpStatus.CANCELED);
```

### Setting a Base URL for Requests

Assume that you're working with single API on the backend, and you don't want to
repeat yourself by concatenating endpoint URL strings in each request you make.

```js
import { fetchp } from "fetchp";

fetchp.setBaseUrl("https://jsonplaceholder.typicode.com");

const req = fetchp.request("GET", "/posts");

console.log(await req.data);
```

### Middlewares / Hooks

Assume that you're need to add additional headers to each request you make.

```js
import { fetchp, FetchpHookType } from "fetchp";

fetchp.hooks.add(
  FetchpHookType.BuildRequestHeaders,
  (headers) => headers.set("Authorization", `Bearer ${getIdToken()}`);
);

const response = fetchp.request(
  "GET",
  "https://localhost/api/some-restricted-endpoint"",
);
```

### Middlewares / Hooks (URL Based)

Assume that you're need to observe state changes only for the urls in your
filter.

```js
import { fetchp, FetchpHookType } from "fetchp";

fetchp.hooks.addForUrl(
  FetchpHookType.StateChange,
  ["GET", "POST"],
  /^https:\/\/jsonplaceholder\.typicode\.com\//,
  (request, status) =>
    console.log(`[state change] ${request.url} -> ${status}`),
);

const response = fetchp.request(
  "GET",
  "https://jsonplaceholder.typicode.com/todos",
);
```

### On-Demand Fetching

Assume that you don't want to invoke the request immediately. You'll set up an
external trigger for this.

```js
import { fetchp } from "fetchp";

const req = fetchp.request("GET", "/posts", { autoFetch: false });

setTimeout(() => req.exec(), 500);

console.log(await req.data);
```

### Mocking an URL for Request

Assume that your API is not yet built on the backend, and you want to mock its
behavior.

```js
import { fetchp } from "fetchp";

const mockContent = { hello: "world" };
const mockResponse = (request) =>
  new Response(
    JSON.stringify(mockContent),
    {
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json",
      },
    },
  );

fetchp.mocks.add(["GET", "POST"], "/hello", mockResponse);

// mocking is done, let's make a request to the mocked URL
const req = fetchp.request("GET", "/hello");

// it will return { hello: "world" }
console.log(await req.data);
```

### Mocking for Testing (Buggy ATM)

Assume that you want to mock your code without dealing with a test framework and
its interfaces / methods. All you need to do is importing `fetchp/mock` instead
of `fetchp` module.

```js
// just replace fetchp with fetchp/mock
import { fetchp } from "fetchp/mock";

const req = fetchp.request("GET", "/posts");

console.log(await req.data);
```

### Using with _**React Hooks**_

```js
import { useFetchp } from "fetchp";

function MyComponent(props) {
  const { data, isLoading, error } = useFetchp("GET", "/posts");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{JSON.stringify(data)}</div>;
}
```

### Using with _**React Hooks**_, mocking for testing

```js
// just replace fetchp with fetchp/mock
import { useFetchp } from "fetchp/mock";

function MyComponent(props) {
  const { data, isLoading, error } = useFetchp("GET", "/posts");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return <div>{JSON.stringify(data)}</div>;
}
```

### Using with _**React Hooks**_, manual fetching

```js
import { useEffect } from "react";
import { useFetchp } from "fetchp";

function MyComponent(props) {
  const { data, status, isSuccess, doFetch } = useFetchp(
    "GET",
    "/posts",
    false,
  );

  useEffect(() => {
    // fetch data after 500 milliseconds has passed
    setTimeout(() => doFetch(), 500);
  }, []);

  if (!isSuccess) {
    return <div>Status: {status}...</div>;
  }

  return <div>{status}: {JSON.stringify(data)}</div>;
}
```

### Using with _**Deno**_

```js
import { fetchp } from "https://esm.sh/fetchp";

const req = fetchp.request("GET", "https://www.google.com/");

console.log(await req.data);
```

## Todo List

See [GitHub Projects](https://github.com/eserozvataf/fetchp/projects) for more.

- [ ] Fixing the bug in `fetchp/mock` module
- [ ] Add advanced support for hooks / middlewares / interceptors
- [ ] Protobuf support
- [ ] Registering serializers / deserializers by content-type
- [ ] Logging adapters
- [ ] MAYBE: Reducers / Actions?
- [ ] Mechanism for request retries

## Requirements

- node.js (https://nodejs.org/)

## License

Apache 2.0, for further details, please see [LICENSE](LICENSE) file

## Contributing

See [contributors.md](contributors.md)

It is publicly open for any contribution. Bugfixes, new features and extra
modules are welcome.

- To contribute to code: Fork the repo, push your changes to your fork, and
  submit a pull request.
- To report a bug: If something does not work, please report it using
  [GitHub Issues](https://github.com/eserozvataf/fetchp/issues).

## To Support

[Visit my GitHub Sponsors profile at github.com/sponsors/eserozvataf](https://github.com/sponsors/eserozvataf)

[npm-image]: https://img.shields.io/npm/v/fetchp.svg?style=flat-square
[npm-download-image]: https://img.shields.io/npm/dt/fetchp.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fetchp
[license-image]: https://img.shields.io/npm/l/fetchp.svg?style=flat-square
[license-url]: https://github.com/eserozvataf/fetchp/blob/master/LICENSE
