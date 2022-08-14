import { useEffect, useState } from "react";
import {
  fetchp,
  type FetchpInterface,
  type FetchpResultInterface,
} from "./fetchp";

enum UseFetchpStatus {
  IDLE = "idle",
  LOADING = "loading",
  ERROR = "error",
  CANCELED = "canceled",
  SUCCESS = "success",
}

const useFetchpBuilder = function useFetchpBuilder<T = any>(
  fetchpInstance: FetchpInterface,
) {
  return function useFetchp<T>(
    method: string,
    url: string,
    autoFetch: boolean = true,
  ) {
    const [data, setData] = useState<T>();
    const [status, setStatus] = useState<UseFetchpStatus>(UseFetchpStatus.IDLE);
    const [error, setError] = useState<unknown | undefined>();
    const [result, setResult] = useState<FetchpResultInterface>();
    const [doFetch, setDoFetch] = useState(autoFetch);

    useEffect(() => {
      if (!doFetch) {
        return;
      }

      const fetchData = async function fetchData() {
        setError(undefined);
        setStatus(UseFetchpStatus.LOADING);

        try {
          const result = fetchpInstance.request<T>(method, url);

          setResult(result);
          setData(await result.data);
          if (result.abortController.signal.aborted) {
            setStatus(UseFetchpStatus.CANCELED);
          } else {
            setStatus(UseFetchpStatus.SUCCESS);
          }
        } catch (error) {
          setError(error);
          console.error(error);
          setStatus(UseFetchpStatus.ERROR);
        }
      };

      fetchData();
    }, [doFetch]);

    return {
      doFetch: () => setDoFetch(true),
      data,
      status,
      isIdle: (status === UseFetchpStatus.IDLE),
      isLoading: (status === UseFetchpStatus.LOADING),
      isError: (status === UseFetchpStatus.ERROR),
      isCanceled: (status === UseFetchpStatus.CANCELED),
      isSuccess: (status === UseFetchpStatus.SUCCESS),
      error,
      result,
    };
  };
};

const useFetchp = useFetchpBuilder(fetchp);

export {
  useFetchp,
  useFetchp as default,
  useFetchpBuilder,
  type UseFetchpStatus,
};
