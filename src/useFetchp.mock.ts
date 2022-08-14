import { useEffect, useState } from "react";
import { fetchp, type FetchpResult } from "./fetchp.mock";

enum UseFetchpStatus {
  IDLE = "idle",
  LOADING = "loading",
  ERROR = "error",
  CANCELED = "canceled",
  SUCCESS = "success",
}

const useFetchp = function useFetchp<T = any>(
  method: string,
  url: string,
  autoFetch: boolean = true,
) {
  const [data, setData] = useState<T>();
  const [status, setStatus] = useState<UseFetchpStatus>(UseFetchpStatus.IDLE);
  const [error, setError] = useState<Error | undefined>();
  const [result, setResult] = useState<FetchpResult>();
  const [doFetch, setDoFetch] = useState(autoFetch);

  useEffect(() => {
    if (!doFetch) {
      return;
    }

    const fetchData = async () => {
      setError(undefined);
      setStatus(UseFetchpStatus.LOADING);

      try {
        const result = fetchp.request<T>(method, url);

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

export { useFetchp, useFetchp as default, type UseFetchpStatus };
