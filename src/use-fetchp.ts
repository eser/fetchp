import { useEffect, useState } from "react";
import {
  fetchp,
  type FetchpInterface,
  type FetchpRequestInit,
  type FetchpResultInterface,
  FetchpStatus,
} from "./fetchp.ts";

const useFetchpBuilder = function useFetchpBuilder(
  fetchpInstance: FetchpInterface,
) {
  // deno-lint-ignore no-explicit-any
  return function useFetchp<T = any>(
    method: string,
    url: string,
    init?: FetchpRequestInit,
  ) {
    const [data, setData] = useState<T>();
    const [status, setStatus] = useState<FetchpStatus>(FetchpStatus.IDLE);
    // deno-lint-ignore no-explicit-any
    const [error, setError] = useState<any>();
    const [result, setResult] = useState<FetchpResultInterface>();
    const [doFetch, setDoFetch] = useState(init?.immediate ?? true);

    useEffect(() => {
      if (!doFetch) {
        return;
      }

      const fetchData = async function fetchData() {
        // try {
        //   const result = fetchpInstance.request<T>(method, url, {
        //     ...(init ?? {}),
        //     immediate: true,
        //     statusCallback: (newStatus) => {
        //       setStatus(newStatus);
        //     },
        //     errorCallback: (newError) => setError(newError),
        //     successCallback: (newData) => setData(newData),
        //     // cancelCallback: () => {},
        //   });

        //   setResult(result);
        // } catch (error) {
        //   setError(error);
        //   console.error(error);
        //   setStatus(FetchpStatus.ERROR);
        // }

        setError(undefined);
        setStatus(FetchpStatus.FETCHING);

        try {
          const result = fetchpInstance.request<T>(method, url, {
            ...(init ?? {}),
            immediate: true,
          });

          setResult(result);
          setData(await result.data);
          if (result.abortController.signal.aborted) {
            setStatus(FetchpStatus.CANCELED);
          } else {
            setStatus(FetchpStatus.SUCCESS);
          }
        } catch (error) {
          setError(error);
          console.error(error);
          setStatus(FetchpStatus.ERROR);
        }
      };

      fetchData();
    }, [doFetch]);

    return {
      doFetch: () => setDoFetch(true),
      data,
      status,
      isIdle: (status === FetchpStatus.IDLE),
      isFetching: (status === FetchpStatus.FETCHING),
      isLoading: (status === FetchpStatus.LOADING),
      isError: (status === FetchpStatus.ERROR),
      isCanceled: (status === FetchpStatus.CANCELED),
      isSuccess: (status === FetchpStatus.SUCCESS),
      error,
      result,
    };
  };
};

const useFetchp = useFetchpBuilder(fetchp);

export { FetchpStatus, useFetchp, useFetchp as default, useFetchpBuilder };
