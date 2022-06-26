import { request, requestWithMultipart } from "../request";
import { AxiosResponse } from "axios";
import { R1UnfinishedList, AllR1R2R3Users } from "@/types/api/display";
import { ResponseData } from "@/types/api/public";

type ConfigType<T = ResponseData> = Promise<AxiosResponse<T>>;

export const getR1UnfinishedList = (
  name: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
): ConfigType<R1UnfinishedList> => {
  return request({
    url: "R1/displayUnfinishedProjects",
    method: "get",
    params: { query: name, year: year, type: type, number: number, startDate, endDate },
  });
};

export const getAllR1R2R3Users = (): ConfigType<AllR1R2R3Users> => {
  return request({
    url: "allCandidates",
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
    url: "uploadOutputPercent",
    method: "post",
    data: data,
  });
};

export const checkHistoryRequest = (param) => {
  return request({
    url: "history/list",
    method: "get",
    params: { processId: param },
  });
};

export const checkHistoryAdminRequest = (param) => {
  return request({
    url: "admin/history/list",
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
    url: "reject",
    method: "post",
    data: data,
  });
};

export const getR1FinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "R1/displayFinishedProjects",
    method: "get",
    params: { query: query, year: year, type: type, number: number, startDate, endDate },
  });
};

export const getR2UnfinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "R2/unfinishedProjects",
    method: "get",
    params: { query: query, year: year, type: type, number: number, startDate, endDate},
  });
};


export const getR2FinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
   endDate: string
) => {
  return request({
    url: "R2/finishedProjects",
    method: "get",
    params: { query: query, year: year, type: type, number: number , startDate, endDate},
  });
};



export const getR3UnfinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "R3/unfinishedProjects",
    method: "get",
    params: { query: query, year: year, type: type, number: number, startDate, endDate},
  });
};

export const getR3FinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "R3/finishedProjects",
    method: "get",
    params: { query: query, year: year, type: type, number: number, startDate, endDate },
  });
};


export const getR4UnfinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "R4/unfinished/projects",
    method: "get",
    params: { query: query, year: year, type: type, number: number, startDate, endDate},
  });
};

export const getR4FinishedList = (
  query: string,
  number: string,
  type: string,
  year: string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "R4/finished/projects",
    method: "get",
    params: { query: query, year: year, type: type, number: number, startDate, endDate },
  });
};




export const getAllUserRank = (year: string, team: string) => {
  return request({
    url: "userRank",
    method: "get",
    params: { year: year, team: team },
  });
};

export const getR2AllList = (
  query: string,
  number: string,
  type: string,
  year: string
) => {
  return request({
    url: "R2/Projects",
    method: "get",
    params: { query: query, year: year, type: type, number: number },
  });
};

export const startProcess = () => {
  return request({
    url: "start",
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
    url: "uploadTaskInfo",
    method: "post",
    data: data,
  });
};

export const getR3AllList = (
  query: string,
  number: string,
  type: string,
  year: string
) => {
  return request({
    url: "R3/Projects",
    method: "get",
    params: { query: query, year: year, type: type, number: number },
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
    url: "r3/approveTask",
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
    url: "r4/approveTask",
    method: "post",
    data: data,
  });
};

export const getR4AllList = (
  query: string,
  number: string,
  type: string,
  year: string
) => {
  return request({
    url: "R4/Projects",
    method: "get",
    params: { query: query, year: year, type: type, number: number },
  });
};

export const getTeamRank = (param) => {
  return request({
    url: "teamRank",
    method: "get",
    params: { year: param },
  });
};

export const getTeamBonus = (param) => {
  return request({
    url: "teamBonus",
    method: "get",
    params: { year: param },
  });
};



export const getA1FinishedData = (
  query: string,
  number: string,
  type: string,
  year:string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "/A1/Finished/Projects",
    method: "get",
    params: { query: query, type: type, number: number, year, startDate, endDate},
  });
};

export const getA1UnfinishedData = (
  query: string,
  number: string,
  type: string,
  year:string,
  startDate: string,
  endDate: string
) => {
  return request({
    url: "/A1/Unfinished/Projects",
    method: "get",
    params: { query: query, type: type, number: number, year, startDate, endDate},
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
    url: "fillValue",
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
    url: "resetValue",
    method: "post",
    data: data,
  });
};

export const teamPieCharts = () => {
  return request({
    url: "teamPieChart",
    method: "get",
  });
};

export const getBarChart = () => {
  return request({
    url: "barChart",
    method: "get",
  });
};

export const deleteProject = (processId) => {
  let data = new FormData();
  data.append("processId", processId);

  return request({
    url: "deleteProject",
    method: "post",
    data: data,
  });
};


export const getR2PivotParams = (
  team:string
) => {
  return request({
    url: "pivot/chart",
    method: "get",
    params: { team: team},
  });
};