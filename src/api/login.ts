import {request, requestWithCookie} from '../request'
import { AxiosResponse } from 'axios'
import { LoginFrom } from '@/types/views/login'
import { ResponseData } from '@/types/api/public'
import { LoginSuccess, UserInfo, RouterData } from '@/types/api/login'

type ConfigType<T=ResponseData> = Promise<AxiosResponse<T>>

/**
 * @desc: 登录
 * @param { Object } data 输入的账号密码
 */
export const login = (data: LoginFrom): ConfigType<LoginSuccess> => {
  return request({
    url: 'auth/login',
    method: 'post',
    data
  })
}

/**
 * @desc: 获取用户信息
 * @returns data
 */
export const info = (): ConfigType<UserInfo> => {
  return requestWithCookie({
    url: 'userInfo',
    method: 'get',
    withCredentials: true
  })
}

/**
 * @desc: 获取菜单
 */
export const menu = (): ConfigType<RouterData> => {
  return request({
    url: 'user/menu',
    method: 'get',
  })
}

/**
 * @desc: 退出登录
 */
 export const logout = (): ConfigType => {
  return request({
    // url: '/logout',
    url: 'auth/logout',
    method: 'get'
  })
}

export const changePassword = (params) => {
  let data = new FormData();

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      data.append(key, params[key]);
    }
  }
  return request({
    url: "resetPassword",
    method: "post",
    data: data,
  });
};