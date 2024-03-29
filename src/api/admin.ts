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
    params: { typeId: type, userId: leader },
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
};

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
};

export const getAllR4Users = () => {
  return request({
    url: "/all/r4",
    method: "get",
  });
};

export const reallocateProduct = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "reallocate/bonus",
    method: "post",
    data: data,
  });
};

export const getAllUsers = (id, department) => {
  return request({
    url: "/all/users",
    method: "get",
    params: { id, department },
  });
};

export const addUserAPI = (params) => {
  return request({
    url: "add/user",
    method: "post",
    data: params,
  });
};

export const deleteUserAPI = (params) => {
  return request({
    url: "delete/user",
    method: "post",
    data: params,
  });
};


export const updateUserAPI = (params) => {
  return request({
    url: "update/userinfo",
    method: "post",
    data: params,
  });
};


