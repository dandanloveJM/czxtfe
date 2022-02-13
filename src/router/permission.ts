import store from "@/store";
import { whiteList } from "./basics.router";
import { Router, RouteRecordRaw } from "vue-router";
import localCache from "@/utils/localCache";

const loginPath = "/login";
const defaultPath = "/";

// 权限验证

export const permission = (router: Router) => {
  router.beforeEach((to, from, next) => {
    //   if (!localCache.getCache("setInfo") || store.state.user.routers?.length==0){
    //     store.dispatch('user/userInfo')
    //     .then(()=>{
    //       store.dispatch('user/menu').then((e) => {
    //         e.forEach((item: RouteRecordRaw) => {
    //           router.addRoute(item)
    //           console.log("---Luyou")
    //           console.dir(item)
    //           })
    //           router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/404' })
    //           const redirect = from.query.redirect as string | undefined
    //           if (redirect && to.fullPath === redirect) {
    //             next({ ...to, replace: true })
    //           } else {
    //             next({ ...to })
    //           }
    //       })
    //     })
    //   }else{
    //     next()
    //   }

    //   })
    // }

    //没有登陆
    if (!localCache.getCache("login")) {
      console.log("没登录");
      if (whiteList.includes(to.path)) {
        next();
      } else {
        next({ path: "/403" });
      }
    } else {
      // 已经登陆了
      console.log("登录了");
      if (to.path === loginPath) {
        next({ path: defaultPath });
      } else {
        if (!localCache.getCache("setInfo")) {
          store.dispatch("user/userInfo").then(() => {
            store.dispatch("user/menu").then((e) => {
              e.forEach((item: RouteRecordRaw) => {
                router.addRoute(item);
                console.log("---Luyou");
                console.dir(item);
              });
              router.addRoute({ path: "/:pathMatch(.*)*", redirect: "/404" });
              const redirect = from.query.redirect as string | undefined;
              if (redirect && to.fullPath === redirect) {
                next({ ...to, replace: true });
              } else {
                next({ ...to });
              }
            });
          });
        } else if (store.state.user.routers?.length == 0) {
          store.dispatch("user/userInfo").then(() => {
            store.dispatch("user/menu").then((e) => {
              e.forEach((item: RouteRecordRaw) => {
                router.addRoute(item);
                console.log("-重新获取--Luyou");
                console.dir(item);
              });
              router.addRoute({ path: "/:pathMatch(.*)*", redirect: "/404" });
              const redirect = from.query.redirect as string | undefined;
              if (redirect && to.fullPath === redirect) {
                next({ ...to, replace: true });
              } else {
                next({ ...to });
              }
            });
          });
        } else {
          next();
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
  });
};

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
// })

// }
