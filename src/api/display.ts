import {request} from '../request'
import { AxiosResponse } from 'axios'
import { R1UnfinishedList} from '@/types/api/display'
import { ResponseData } from '@/types/api/public'

type ConfigType<T=ResponseData> = Promise<AxiosResponse<T>>

export const getR1UnfinishedList = (params: any): ConfigType<R1UnfinishedList> => {
    return request({
      url: 'http://localhost:8080/R1/displayUnfinishedProjects',
      method: 'get',
      params: {'userId':23}
    })
  }