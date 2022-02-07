import { request, requestWithMultipart } from "../request";
import { AxiosResponse } from "axios";
import { R1UnfinishedList, AllR1R2R3Users } from "@/types/api/display";
import { ResponseData } from "@/types/api/public";

type ConfigType<T = ResponseData> = Promise<AxiosResponse<T>>;

export const getR1UnfinishedList = (
  params: any
): ConfigType<R1UnfinishedList> => {
  return request({
    url: "http://localhost:8080/R1/displayUnfinishedProjects",
    method: "get",
    params,
  });
};

export const getAllR1R2R3Users = (): ConfigType<AllR1R2R3Users> => {
  return request({
    url: "http://localhost:8080/allCandidates",
    method: "get",
  });
};

export const fillOutputValue = (params): ConfigType<AllR1R2R3Users> => {
  // console.log("axios看到的是啥啊")
  // console.dir(data)
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "http://localhost:8080/uploadOutputPercent",
    method: "post",
    data: data,
  });
};

export const checkHistoryRequest = (param) => {
  return request({
    url: "http://localhost:8080/history/list",
    method: "get",
    params: { processId: param },
  });
};

export const rollbackRequest = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }
  return request({
    url: "http://localhost:8080/reject",
    method: "post",
    data: data,
  });
};

export const getR1FinishedList = () => {
  return request({
    url: "http://localhost:8080/R1/displayFinishedProjects",
    method: "get",
  });
};

export const getAllUserRank = (param) => {
  return request({
    url: "http://localhost:8080/userRank",
    method: "get",
    params: { year: param },
  });
};

export const getR2AllList = () => {
  return request({
    url: "http://localhost:8080/R2/Projects",
    method: "get",
  });
};

export const startProcess = () => {
  return request({
    url: "http://localhost:8080/start",
    method: "get",
  });
};

export const generateNewProject = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return requestWithMultipart({
    url: "http://localhost:8080/uploadTaskInfo",
    method: "post",
    data: data,
  });
};

export const getR3AllList = () => {
  return request({
    url: "http://localhost:8080/R3/Projects",
    method: "get",
  });
};

export const r3Approve = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return requestWithMultipart({
    url: "http://localhost:8080/r3/approveTask",
    method: "post",
    data: data,
  });
};

export const r4Approve = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return requestWithMultipart({
    url: "http://localhost:8080/r4/approveTask",
    method: "post",
    data: data,
  });
};

export const getR4AllList = () => {
  return request({
    url: "http://localhost:8080/R4/Projects",
    method: "get",
  });
};

export const getTeamRank = (param) => {
  return request({
    url: "http://localhost:8080/teamRank",
    method: "get",
    params: { year: param },
  });
};

export const getTeamBonus = (param) => {
  return request({
    url: "http://localhost:8080/teamBonus",
    method: "get",
    params: { year: param },
  });
};

export const getA1Data = () => {
  return request({
    url: "http://localhost:8080/A1/Projects",
    method: "get",
  });
};

export const a1SetProduct = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "http://localhost:8080/fillValue",
    method: "post",
    data: data,
  });
};


export const a1ModifyProduct = (params) => {
  let data = new FormData();
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }

  return request({
    url: "http://localhost:8080/resetValue",
    method: "post",
    data: data,
  });
}