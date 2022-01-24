import { request } from "../request";
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
  let data = new FormData()
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key])      
    }
  }

  return request({
    url: "http://localhost:8080/uploadOutputPercent",
    method: "post",
    data: data,
  });
}


export const checkHistoryRequest = (param) => {
  return request({
    url: "http://localhost:8080/history/list",
    method: "get",
    params:{"processId": param}
  });
}


export const rollbackRequest = (params) => {
  let data = new FormData()
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key])      
    }
  }
  return request({
    url: "http://localhost:8080/reject",
    method: "post",
    data: data
  });
}

export const getR1FinishedList = () => {
  return request({
    url: "http://localhost:8080/R1/displayFinishedProjects",
    method: "get",
  });
}