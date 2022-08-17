import { useEffect, useState } from "react";
import {
  fetchp,
  type FetchpInterface,
  type FetchpRequestInit,
  type FetchpResultInterface,
  FetchpStatus,
} from "./fetchp";

const useFetchpBuilder = function useFetchpBuilder(
  fetchpInstance: FetchpInterface,
) {
  return function useFetchp<T>(
    method: string,
    url: string,
    init?: FetchpRequestInit,
  ) {
    const [data, setData] = useState<T>();
    const [status, setStatus] = useState<FetchpStatus>(FetchpStatus.IDLE);
    const [error, setError] = useState<unknown | undefined>();
    const [result, setResult] = useState<FetchpResultInterface>();
    const [doFetch, setDoFetch] = useState(init?.autoFetch);

    useEffect(() => {
      if (!doFetch) {
        return;
      }

      const fetchData = async function fetchData() {
        // try {
        //   const result = fetchpInstance.request<T>(method, url, {
        //     ...(init ?? {}),
        //     autoFetch: true,
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
        setStatus(FetchpStatus.LOADING);

        try {
          const result = fetchpInstance.request<T>(method, url, {
            ...(init ?? {}),
            autoFetch: true,
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
