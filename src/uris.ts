// interface definitions
// ---------------------
type FetchpURI =
  | string
  | ((params?: Record<string, string | undefined>) => string);

enum UrlCollectionItemType {
  String = "STRING",
  RegExp = "REGEXP",
  URLPattern = "URLPATTERN",
}

interface UrlCollectionItem<T = unknown> {
  methods: string[];
  requestUrlPattern: string | RegExp | URLPattern;
  requestUrlPatternType: UrlCollectionItemType;
  data: T;
}

interface UrlCollectionInterface<T = unknown> {
  items: UrlCollectionItem<T>[];

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp | URLPattern,
    data: T,
  ): void;

  clear(): void;

  filter(
    method: string,
    uri: FetchpURI,
    urlConverter?: (uri: FetchpURI) => URL,
  ): UrlCollectionItem<T>[];

  filterByRequest(
    request: Request,
    urlConverter?: (uri: FetchpURI) => URL,
  ): UrlCollectionItem<T>[];
}

class UrlCollection<T = unknown> implements UrlCollectionInterface<T> {
  items: UrlCollectionItem<T>[];

  constructor() {
    this.items = <UrlCollectionItem<T>[]> [];
  }

  add(
    methods: string | string[],
    requestUrlPattern: string | RegExp | URLPattern,
    data: T,
  ) {
    const methods_ = methods.constructor === Array
      ? methods
      : [<string> methods];
    const requestUrlPatternType = requestUrlPattern.constructor === RegExp
      ? UrlCollectionItemType.RegExp
      : requestUrlPattern.constructor === URLPattern
      ? UrlCollectionItemType.URLPattern
      : UrlCollectionItemType.String;

    this.items.push({
      methods: methods_,
      requestUrlPattern,
      requestUrlPatternType,
      data,
    });
  }

  clear() {
    this.items = <UrlCollectionItem<T>[]> [];
  }

  filter(
    method: string,
    uri: FetchpURI,
    urlConverter?: (uri: FetchpURI) => URL,
  ) {
    const foundItems = this.items
      .filter((x) => x.methods.includes(method))
      .filter((x) => {
        const uri_ = typeof uri === "function" ? uri() : uri;

        if (x.requestUrlPatternType === UrlCollectionItemType.RegExp) {
          return (<RegExp> x.requestUrlPattern).test(uri_);
        } else if (
          x.requestUrlPatternType === UrlCollectionItemType.URLPattern
        ) {
          return (<URLPattern> x.requestUrlPattern).test(uri_);
        }

        if (urlConverter !== undefined) {
          const convertedUrl = urlConverter(
            <string> x.requestUrlPattern,
          ).toString();

          return convertedUrl === uri;
        }

        return x.requestUrlPattern === uri;
      });

    return foundItems;
  }

  filterByRequest(request: Request, urlConverter?: (uri: FetchpURI) => URL) {
    return this.filter(request.method, request.url, urlConverter);
  }
}

export {
  type FetchpURI,
  UrlCollection,
  type UrlCollectionInterface,
  type UrlCollectionItem,
};
