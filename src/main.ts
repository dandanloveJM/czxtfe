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
    console.log("vnode");
    console.log(vnode);

    let visible = vnode.children[0].props.visible;
    let destroyOnClose = vnode.children[0].props.destroyOnClose;

    if (!visible) return;
    console.log("el");
    console.log(el);

    console.log("bindings");
    console.log(bindings);
    let modal = document.querySelector<HTMLElement>(".ant-modal");

    let header = document.querySelector<HTMLElement>(".ant-modal-header");

    let left = 0;
    let top = 0;

    if (!destroyOnClose) {
      left = modal.left || 0;
      top = modal.top || 0;
    }

    let isEnd = false;

    let domset = {
      x: document.documentElement.clientWidth / 4, // 默认width 50%
      y: (document.documentElement.clientHeight * 15) / 100, // 根据 15vh 计算
    };
    modal.style.marginTop = domset.y + "px";
    modal.style.marginLeft = domset.x + "px";

    let move = { x: 0, y: 0 };
    header.onmousedown = (event) => {
      isEnd = false;
      console.log("mousedown");
      let startX = event.clientX;
      let startY = event.clientY;
    //   header.left = header.offsetLeft;
    //   header.top = header.offsetTop;

      modal.onmousemove = (event) => {
        console.log("move");
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
        console.log("mouseup");

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
console.log("aaa:" + aa);

router.isReady().then(() => app.mount("#app"));
