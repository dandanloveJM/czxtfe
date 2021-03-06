import { createApp } from "vue";
import Antd from "ant-design-vue";
import "@/assets/css/reset.css";
import "ant-design-vue/dist/antd.css";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { globalAxios } from "./request";
// import '@/utils/dragModal'
import { nextTick } from "vue";


const app = createApp(App);

// 使用antd
app.use(Antd);

// 使用全局axios
app.use(globalAxios);

// 使用vuex
app.use(store);

// 使用路由
app.use(router);


app.directive("drag-modal", (el, bindings, vnode) => {
  nextTick(() => {
   

    let visible = vnode.children[0].props.visible;
    let destroyOnClose = vnode.children[0].props.destroyOnClose;

    if (!visible) return;
   
    let modal = document.querySelector<HTMLElement>(".ant-modal");

    let header = document.querySelector<HTMLElement>(".ant-modal-header");

    let isEnd = false;

    let domset = {
      x: document.documentElement.clientWidth / 5, // 默认width 50%
      y: (document.documentElement.clientHeight * 6) / 100, // 根据 15vh 计算
    };
    modal.style.marginTop = domset.y + "px";
    modal.style.marginLeft = domset.x + "px";

    let move = { x: 0, y: 0 };
    header.onmousedown = (event) => {
      isEnd = false;
    
      let startX = event.clientX;
      let startY = event.clientY;
    //   header.left = header.offsetLeft;
    //   header.top = header.offsetTop;

      window.onmousemove = (event) => {
      
        if (isEnd) {
          return;
        }
        let endX = event.clientX;
        let endY = event.clientY;
        move.x = endX - startX;
        move.y = endY - startY;

        modal.style.marginLeft = domset.x + move.x + "px";
        modal.style.marginTop = domset.y + move.y + "px";

       
      };

      header.onmouseup = (event) => {
        isEnd = true;
     

        move.x = event.clientX - startX;
        move.y = event.clientY - startY;

        domset.x += move.x;
        domset.y += move.y;

        modal.style.marginLeft = domset.x + "px";
        modal.style.marginTop = domset.y + "px";

        el.onmousemove = null;
        el.onmouseup = null;
      };

      return false;
    };
  });
});

const aa = import.meta.env.VITE_BASE_URL;

router.isReady().then(() => app.mount("#app"));
