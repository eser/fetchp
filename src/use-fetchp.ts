import React from "npm:react";
import { type FetchpURI } from "./uris.ts";
import {
  fetchp,
  type FetchpInterface,
  type FetchpRequestInit,
  type FetchpResultInterface,
  FetchpStatus,
} from "./fetchp.ts";

const useFetchpBuilder = (
  fetchpInstance: FetchpInterface,
) => {
  // deno-lint-ignore no-explicit-any
  const useFetchp = <T = any>(
    method: string,
    uri: FetchpURI,
    init?: FetchpRequestInit,
  ) => {
    const [data, setData] = React.useState<T>();
    const [status, setStatus] = React.useState<FetchpStatus>(FetchpStatus.IDLE);
    // deno-lint-ignore no-explicit-any
    const [error, setError] = React.useState<any>();
    const [result, setResult] = React.useState<FetchpResultInterface>();
    const [doFetch, setDoFetch] = React.useState<
      [
        FetchpRequestInit | undefined,
        (value: unknown) => void,
        // deno-lint-ignore no-explicit-any
        (reason?: any) => void,
      ] | undefined
    >(undefined);

    React.useEffect(() => {
      if (doFetch === undefined) {
        return;
      }

      const fetchData = async () => {
        // try {
        //   const result = fetchpInstance.request<T>(method, uri, {
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
          const finalInit = {
            ...(init ?? {}),
            ...(doFetch[0] ?? {}),
            immediate: true,
          };
          const result = fetchpInstance.request<T>(method, uri, finalInit);

          setResult(result);
          doFetch[1]?.(result);

          const localData = await result.data;
          setData(localData);

          if (result.abortController.signal.aborted) {
            setStatus(FetchpStatus.CANCELED);
          } else {
            setStatus(FetchpStatus.SUCCESS);
          }
        } catch (error) {
          setError(error);
          doFetch[2]?.(error);
          console.error(error);
          setStatus(FetchpStatus.ERROR);
        }
      };

      fetchData();
    }, [doFetch]);

    return {
      doFetch: (init?: FetchpRequestInit) =>
        new Promise<T>((resolve, reject) =>
          setDoFetch([init, resolve, reject])
        ),
      data,
      status,
      isIdle: status === FetchpStatus.IDLE,
      isFetching: status === FetchpStatus.FETCHING,
      isLoading: status === FetchpStatus.LOADING,
      isError: status === FetchpStatus.ERROR,
      isCanceled: status === FetchpStatus.CANCELED,
      isSuccess: status === FetchpStatus.SUCCESS,
      error,
      result,
    };
  };

  return useFetchp;
};

const useFetchp = useFetchpBuilder(fetchp);

export { FetchpStatus, useFetchp, useFetchp as default, useFetchpBuilder };
