// interface definitions
// ---------------------
interface UrlCollectionItem<T = unknown> {
  methods: string[];
  requestUrlPattern: string | RegExp;
  isRegExp: boolean;
  data: T;
}

interface UrlCollectionInterface<T = unknown> {
  items: UrlCollectionItem<T>[];

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    data: T,
  ): void;

  clear(): void;

  filter(
    method: string,
    url: string,
    urlConverter?: (url: string) => URL,
  ): UrlCollectionItem<T>[];

  filterByRequest(
    request: Request,
    urlConverter?: (url: string) => URL,
  ): UrlCollectionItem<T>[];
}

class UrlCollection<T = unknown> implements UrlCollectionInterface<T> {
  items: UrlCollectionItem<T>[];

  constructor() {
    this.items = <UrlCollectionItem<T>[]> [];
  }

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp,
    data: T,
  ) {
    const methods_ = (methods.constructor === Array)
      ? methods
      : [<string> methods];
    const isRegExp = (requestUrlPattern.constructor === RegExp);

    this.items.push({
      methods: methods_,
      requestUrlPattern,
      isRegExp,
      data,
    });
  }

  clear() {
    this.items = <UrlCollectionItem<T>[]> [];
  }

  filter(method: string, url: string, urlConverter?: (url: string) => URL) {
    const foundItems = this.items
      .filter((x) => x.methods.includes(method))
      .filter((x) => {
        if (x.isRegExp) {
          return (<RegExp> x.requestUrlPattern).test(url);
        }

        if (urlConverter !== undefined) {
          const convertedUrl = urlConverter(<string> x.requestUrlPattern)
            .toString();

          return (convertedUrl === url);
        }

        return (x.requestUrlPattern === url);
      });

    return foundItems;
  }

  filterByRequest(request: Request, urlConverter?: (url: string) => URL) {
    return this.filter(request.method, request.url, urlConverter);
  }
}

export { UrlCollection, type UrlCollectionInterface, type UrlCollectionItem };
