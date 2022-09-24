import { FetchpStatus, useFetchpBuilder } from "./use-fetchp.ts";
import { fetchp } from "./fetchp.mock.ts";

const useFetchpMock = useFetchpBuilder(fetchp);

export {
  FetchpStatus,
  useFetchpBuilder,
  useFetchpMock as default,
  useFetchpMock as useFetchp,
};
