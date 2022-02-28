import { App } from 'vue'
// import sessionStorage from 'store'
import router from '@/router'
import { regAxios } from './install'
import { message } from 'ant-design-vue'
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { Router, RouteRecordRaw } from 'vue-router'
import localCache from '@/utils/localCache'


// 创建axios实例

// 全局设置带cookie!
axios.defaults.withCredentials = true



export const request = axios.create({
  baseURL: import.meta.env.VITE_REQUEST_BASE_URL as string,
  // baseURL: "http://localhost:8080",
  timeout: 60000000
})

export const requestWithMultipart = axios.create({
  baseURL: import.meta.env.VITE_REQUEST_BASE_URL as string,
  // baseURL: "http://localhost:8080",
  timeout: 60000000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

export const requestWithCookie = axios.create({
  baseURL: import.meta.env.VITE_REQUEST_BASE_URL as string,
  timeout: 6000,
  withCredentials: true
})

/**
 * @desc: 异常拦截处理器
 * @param { Object } error 错误信息
 */
const errorHandler = (error: AxiosError): AxiosError | Promise<AxiosError> => {
  message.error(error.message)
  return Promise.reject(error)
}

/**
 * @desc: 请求发送前拦截
 * @param { Object } config 配置参数
 */
request.interceptors.request.use((config: AxiosRequestConfig): AxiosRequestConfig => {
  // config.headers['token'] = sessionStorage.get('token') || ''
  return config
}, errorHandler)


/**
 * @desc: 服务端响应后拦截
 * @param { Object } response 返回的数据
 */
request.interceptors.response.use((response: AxiosResponse): AxiosResponse | Promise<AxiosResponse> => {
  if (response.status === 200) {
    console.log('ok')
    console.dir(response);
    return response
    
  } else if (response.data.msg === "expire") {
    // 登录失效
    localCache.clearCache()
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    return Promise.reject(response)
  } else if (response.status===403){
    router.push({path:'/403'})
    return Promise.reject(response)
  }
  else {
    return Promise.reject(response)
  }
}, errorHandler)

export const globalAxios = {
  install (app: App) {
    app.use(regAxios, request)
  }
}

