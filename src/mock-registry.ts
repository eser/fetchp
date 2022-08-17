// interface definitions
// ---------------------
interface MockRegistryItem {
  methods: string[];
  requestUrlPattern: string | RegExp;
  isRegExp: boolean;
  responseFn: () => Response;
}

interface MockRegistryInterface {
  items: MockRegistryItem[];

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    response: Response | (() => Response),
  ): void;

  find(
    request: Request,
    urlConverter?: (url: string) => URL,
  ): { request: Request; responseFn: (() => Response) | undefined };
}

class MockRegistry implements MockRegistry {
  items: MockRegistryItem[];

  constructor() {
    this.items = <MockRegistryItem[]> [];
  }

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    response: Response | (() => Response),
  ): void {
    const methods_ = (methods.constructor === Array)
      ? methods
      : [<string> methods];
    const isRegExp = (requestUrlPattern.constructor === RegExp);
    const responseFn = (response.constructor === Function)
      ? <() => Response> response
      : () => <Response> response;

    this.items.push({
      methods: methods_,
      requestUrlPattern,
      isRegExp,
      responseFn,
    });
  }

  find(request: Request, urlConverter?: (url: string) => URL) {
    const foundMocks = this.items
      .filter((x) => x.methods.includes(request.method))
      .filter((x) => {
        if (x.isRegExp) {
          return (<RegExp> x.requestUrlPattern).test(request.url);
        }

        if (urlConverter !== undefined) {
          const convertedUrl = urlConverter(<string> x.requestUrlPattern)
            .toString();

          return (convertedUrl === request.url);
        }

        return (x.requestUrlPattern === request.url);
      });

    if (foundMocks.length === 0) {
      return {
        request: request,
        responseFn: undefined,
      };
    }

    return {
      request: request,
      responseFn: foundMocks[0]?.responseFn,
    };
  }
}

export { MockRegistry, type MockRegistryInterface, type MockRegistryItem };
