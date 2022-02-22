<template>
  <div class="doneTask__container">
    <div class="tip">新密码必须包含数字、字母、特殊符号，且8位以上</div>
    <a-form layout="inline" :model="formState" @finish="handleFinish">
      <a-form-item>
        <a-input v-model:value="formState.password" placeholder="新密码">
          <template #prefix
            ><LockOutlined style="color: rgba(0, 0, 0, 0.25)"
          /></template>
        </a-input>
      </a-form-item>
      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          :disabled="formState.password === ''"
        >
          修改密码
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script lang="ts">
import aIcon from "@/components/aicon/aicon.vue";
import {
  defineComponent,
  ref,
  reactive,
  onMounted,
  UnwrapRef,
  toRaw,
  watchEffect,
} from "vue";
import { changePassword } from "@/api/login";
import moment from "moment";
import {
  SearchOutlined,
  CalendarTwoTone,
  LockOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

interface FormState {
  password: string;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    SearchOutlined,
    CalendarTwoTone,
    LockOutlined,
  },
  setup() {
    const formState: UnwrapRef<FormState> = reactive({
      password: "",
    });

    const handleFinish = () => {
      var regex = new RegExp(
        "(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9]).{8,30}"
      );

      let password = toRaw(formState).password;
      const valid = regex.test(password);
      if (!valid) {
        message.error("新密码必须包含数字、字母、特殊符号，且8位以上");
      } else {
          changePassword({'password':password}).then((response) => {
              if(response.data.status === 'fail'){
                  message.error("修改密码失败");
              } else if (response.data.status === 'ok'){
                  message.success("修改密码成功");
              }
          })
      }
      console.log("valid");
      console.log(valid);
      console.log("password");
      console.log(password);
    };

    return {
      formState,
      handleFinish,
    };
  },
});
</script>
<style lang="scss" scoped>
.doneTask__container {
  padding: 20px;
}
.tip {
  font-size: 18px;
  margin-bottom: 20px;
}
</style>
