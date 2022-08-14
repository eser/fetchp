# 💬 [fetchp](https://github.com/eserozvataf/fetchp)

[![build status][build-image]][build-url] [![npm version][npm-image]][npm-url]
[![npm download][npm-download-image]][npm-url]
[![dependencies][dep-image]][dep-url]
[![coverage status][coverage-image]][coverage-url]
[![license][license-image]][license-url]

## What is the fetchp?

Still work in progress...

## Table of Contents

- [Quick start](#quick-start)
- [Usage](#usage)
  - [Basic HTTP Request For Text-Based Data](#basic-http-request-for-text-based-data)
  - [Basic HTTP Request For JSON Data](#basic-http-request-for-json-data)
  - [Aborting a Request](#aborting-a-request)
  - [Setting a Base URL for Requests](#setting-a-base-url-for-requests)
  - [Mocking an URL for Request](#mocking-an-url-for-request)
  - [Mocking for Testing (Buggy ATM)](#mocking-for-testing-buggy-atm)
  - [Using with _**React Hooks**_](#using-with-react-hooks)
  - [Using with _**React Hooks**_, manual fetching](#using-with-react-hooks-manual-fetching)
- [Todo List](#todo-list)
- [Requirements](#requirements)
- [License](#license)
- [Contributing](#contributing)
- [To Support](#to-support)

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
import { fetchp } from "fetchp";

const req = fetchp.request("GET", "https://jsonplaceholder.typicode.com/posts");

// abort it after 500 milliseconds
setTimeout(() => req.abortController.abort(), 500);
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

### Mocking an URL for Request

Assume that your API is not yet built on the backend, and you want to mock its
behavior.

```js
import { fetchp } from "fetchp";

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

fetchp.setMockUrlContent("/hello", mockResponse);

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
import { fetchp } from "fetchp";

fetchp.setBaseUrl("https://jsonplaceholder.typicode.com");

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

### Using with _**React Hooks**_, manual fetching

```js
import { useEffect } from "react";
import { useFetchp } from "fetchp";

function MyComponent(props) {
  const { data, status, isSuccess, doFetch } = useFetchp("GET", "/posts", false);

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

## Todo List

See [GitHub Projects](https://github.com/eserozvataf/fetchp/projects) for more.

- [ ] Fixing the bug in `fetchp/mock` module
- [ ] Add support for middlewares / interceptors
- [ ] Protobuf support
- [ ] Registering serializers / deserializers by content-type
- [ ] Multiple instances of fetchp

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

[Visit my patreon profile at patreon.com/eserozvataf](https://www.patreon.com/eserozvataf)

[build-image]: https://img.shields.io/travis/eserozvataf/fetchp.svg?style=flat-square
[build-url]: https://travis-ci.org/eserozvataf/fetchp
[npm-image]: https://img.shields.io/npm/v/fetchp.svg?style=flat-square
[npm-download-image]: https://img.shields.io/npm/dt/fetchp.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/fetchp
[dep-image]: https://img.shields.io/david/eserozvataf/fetchp.svg?style=flat-square
[dep-url]: https://github.com/eserozvataf/fetchp
[coverage-image]: https://img.shields.io/codecov/c/github/eserozvataf/fetchp.svg?style=flat-square
[coverage-url]: https://codecov.io/gh/eserozvataf/fetchp
[license-image]: https://img.shields.io/npm/l/fetchp.svg?style=flat-square
[license-url]: https://github.com/eserozvataf/fetchp/blob/master/LICENSE
