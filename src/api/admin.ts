import { request} from "../request";

export const getAdminAllList = (
    query: string,
    number: string,
    type: string,
    year: string
  ) => {
    return request({
      url: "allProjects",
      method: "get",
      params: { query: query, year: year, type: type, number: number },
    });
  };