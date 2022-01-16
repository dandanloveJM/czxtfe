import storage from 'store'
import store from '@/store'
import { whiteList } from './basics.router'
import { Router, RouteRecordRaw } from 'vue-router'


const loginPath = '/login'
const defaultPath = '/'

// 权限验证

export const permission = (router: Router) => {
  
  router.beforeEach((to, from, next) => {

    console.log("store.state.user.logIn")
    console.log(store.state.user.logIn)

    // 没有登陆
    if(storage.get("logIn") !== "login"){
      if (whiteList.includes(to.path)) {
        next()
      } else {
        next({path:'/403'})
      }
    } else {
      // 已经登陆了
      console.dir(store.state.user.username)
      if (to.path === loginPath){
        next({ path: defaultPath })
      } else {
        if (!store.state.user.displayName){
          store.dispatch('user/userInfo')
          .then(()=>{
            console.log("store.state.user.displayName");
            console.dir(store.state.user.displayName)
            store.dispatch('user/menu').then((e) => {
              e.forEach((item: RouteRecordRaw) => {
                router.addRoute(item)
                })
                router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/404' })
                const redirect = from.query.redirect as string | undefined
                if (redirect && to.fullPath === redirect) {
                  next({ ...to, replace: true })
                } else {
                  next({ ...to })
                }
            })
          })
        } else {
          next()
        }
       
      }
      // 登陆了只有第一次需要发请求userInfo
      // console.dir(store.state.user)
      // if(store.state.user.username.length===0){
      //   store.dispatch('user/userInfo').then(()=>{
          
      //     next({path: '/'})
      //   }).catch(()=>{
      //     next({path:loginPath})
      //   })
      // }

    }

  

  
    // if (storage.get('token')) {
    //   if (to.path === loginPath) {
    //     next({ path: defaultPath })
    //   } else {
    //     console.log("fuck2")
    //     if (store.state.user.username.length === 0) {
    //       store.dispatch('user/userInfo').then(() => {
    //         console.log("fuck3")
    //         store.dispatch('user/menu').then(e => {
    //           e.forEach((item: RouteRecordRaw) => {
    //             router.addRoute(item)
    //           })
    //           router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/404' })
    //           const redirect = from.query.redirect as string | undefined
    //           if (redirect && to.fullPath === redirect) {
    //             next({ ...to, replace: true })
    //           } else {
    //             next({ ...to })
    //           }
    //         })
    //       }).catch(() => {
    //         storage.remove('token')
    //         next({ path: loginPath, query: { redirect: to.fullPath } })
    //       })
    //     } else {
    //       next()
    //     }
    //   }
    // // } else {
    //   if (whiteList.includes(to.path)) {
    //     next()
    //   } else {
    //     next({ path: loginPath, query: { redirect: to.fullPath } })
    //   }
    // }
  })

}
