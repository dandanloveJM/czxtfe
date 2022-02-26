import { request } from "../request";

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

export const getAllR4Types = (type: string, leader: string) => {
  return request({
    url: "r4types",
    method: "get",
    params: { typeId: type, userId:leader },
  });
};


export const changeUserId = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "change/userId/r4type",
    method: "post",
    data: data,
  });
};

export const deleteR4Type = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "delete/r4type",
    method: "post",
    data: data,
  });
}

export const addR4Type = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "add/r4type",
    method: "post",
    data: data,
  });
}

export const getAllR4Users = () => {
  return request({
    url: "/all/r4",
    method: "get",
  });
}