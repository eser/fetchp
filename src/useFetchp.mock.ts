import { type FetchpStatus, useFetchpBuilder } from "./useFetchp";
import { fetchp } from "./fetchp.mock";

const useFetchpMock = useFetchpBuilder(fetchp);

export {
  FetchpStatus,
  useFetchpBuilder,
  useFetchpMock as default,
  useFetchpMock as useFetchp,
};
