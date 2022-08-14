import { useFetchpBuilder, type UseFetchpStatus } from "./useFetchp";
import { fetchp } from "./fetchp.mock";

const useFetchpMock = useFetchpBuilder(fetchp);

export {
  useFetchpBuilder,
  useFetchpMock as default,
  useFetchpMock as useFetchp,
  type UseFetchpStatus,
};
