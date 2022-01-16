import storage from 'store'
import { AllState } from '../index'
import { ActionContext } from 'vuex'
import { message } from 'ant-design-vue'
import { LoginFrom } from '@/types/views/login'
import { RouterTable } from '@/types/api/login'
import { generator } from '@/utils/parsingRouter'
import { login, info, menu, logout } from '@/api/login'
import store from '@/store'

// 处理用户登录、登出、个人信息、权限路由

export type UserState = {
  displayName: string,
  id?: string,
  avatar: string,
  roleId: string,
  username: string,
  routers?: RouterTable,
  logIn?:boolean
}

const state: UserState = {
  // 昵称
  username: '',
  // 头像
  avatar: '',
  // 角色(鉴权)
  roleId: '',
  // 路由表(原始未解析)
  routers: [],
  displayName:'',
  //是否登录成功
  logIn: false
}

const user = {

  namespaced: true,

  state,

  mutations: {

    // // 设置token
    // setToken (state: UserState, token: string) {
    //   state.token = token
    // },
    setLogIn(state: UserState, logIn: boolean){
      state.logIn = true
    },

    setDisplayname(state: UserState, name: string){
      state.displayName = name
    },
    
    // // 设置用户信息
    setInfo (state: UserState, info: UserState) {
      const { displayName, avatar, roleId, username } = info
      state.displayName = displayName
      state.avatar = avatar
      state.roleId = roleId
      state.username = username
    },

    // 设置路由表(原始未解析)
    setRouters (state: UserState, routers: RouterTable) {
      state.routers = routers
    },

    // 用户退出登录
    clearState (state: UserState) {
      storage.remove('token')
      // 为了重新加载用户信息及路由组
      state.username = ''
    }
  
  },

  actions: {

    // 登录
    login (context: ActionContext<UserState, AllState>, params: LoginFrom) {
      return new Promise((resolve, reject) => {
        login(params).then(e => {
          const data = e.data
          storage.set('logIn', "login")
          context.commit('setLogIn', true)
          resolve(data)
        }).catch(err => {
          console.log("错误")
          console.dir(err)
          reject(err)
        })
      })
    },

    // 获取用户信息
    userInfo (context: ActionContext<UserState, AllState>) {
      return new Promise((resolve, reject) => {
        info().then(e => {
          const info = e.data.data
          console.log('iinfo')
          console.dir(info)
          storage.set('setInfo', info)
          context.commit('setInfo', info)
     
          console.log("store.state.user.displayName!!!!");
          console.dir(state)
          resolve(e)
        }).catch(err => {
          message.error(err.message || err.data.message)
          if (err.data && err.data.code !== -401) {
            reject(err)
          }
        })
      })
    },

    // 获取菜单
    menu (context: ActionContext<UserState, AllState>) {
      return new Promise((resolve) => {
        menu().then(e => {
          const routeTable = e.data.data
          context.commit('setRouters', routeTable)
          // 初始化侧边菜单
          context.rootState.menu.menuRouter = routeTable[0]['children'] || []
          context.rootState.menu.menuId = routeTable[0]['id']
          resolve(generator(routeTable))
        }).catch(err => {
          message.error(err.message || err.data.message)
        })
      })
    },

    // 退出登录
    logout (context: ActionContext<UserState, AllState>) {
      return new Promise((resolve, reject) => {
        logout().then(e => {
          context.commit('clearState')
          resolve(e)
        }).catch(err => {
          message.error(err.message || err.data.message)
          reject(err)
        })
      })
    }

  }

}

export default user