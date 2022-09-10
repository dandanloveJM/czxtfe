<template>
  <div class="doneTask__container">
    <h2>用户信息</h2>

    <div class="table-wrapper">
      <a-button @click="() => addUser()">新增用户</a-button>
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.id"
          :loading="tableLoading"
          :pagination="false"
        >
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="新增用户"
        v-model:visible="showCheck"
        width="1000px"
        :destroyOnClose="true"
        @ok="addUserOk"
        :confirm-loading="confirmLoadingNew"
      >
        <a-form
          :model="newUserformState"
          name="basic"
          :label-col="{ span: 8 }"
          :wrapper-col="{ span: 16 }"
        >
          <a-form-item
            label="姓名"
            name="displayName"
            :rules="[{ required: true, message: '请填写姓名' }]"
          >
            <a-input v-model:value="newUserformState.displayName" />
          </a-form-item>

          <a-form-item
            label="用户名(姓名的拼音)"
            name="username"
            :rules="[{ required: true, message: '请输入用户名' }]"
          >
            <a-input v-model:value="newUserformState.username" />
          </a-form-item>

          <a-form-item
            label="密码"
            name="password"
            :rules="[{ required: true, message: '请输入密码' }]"
          >
            <a-input v-model:value="newUserformState.password" />
          </a-form-item>

          <a-form-item name="roleId" label="角色">
            <a-select
              v-model:value="newUserformState.roleId"
              style="width: 120px"
              :options="roleOptions"
              :rules="[{ required: true }]"
            />
          </a-form-item>

          <a-form-item name="department" label="部门">
            <a-select
              v-model:value="newUserformState.department"
              :options="teamOptions"
              style="width: 120px"
              :allowClear="true"
              :rules="[{ required: true }]"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </div>
</template>
<script lang="ts">
import aIcon from "@/components/aicon/aicon.vue";
import { defineComponent, ref, reactive, onMounted, UnwrapRef, toRaw } from "vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import { typeMap, TYPE_OPTIONS, TEAMS_OPTIONS, teamMap } from "@/utils/config";
import { getAllUsers, addUserAPI } from "@/api/admin";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import SelectTypes from "ant-design-vue/es/select";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

interface newUserformState {
  username: string;
  password: string;
  department: string;
  displayName: string;
  teamName: string;
  roleId: string;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    Modal,
    antModal,
    ExclamationCircleOutlined,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      products: [],
      previewURL: "",
      historyData: [],
    });
    const visible = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const confirmLoadingNew = ref<boolean>(false);
    const showCheck = ref<boolean>(false);
   
    const teamOptions = TEAMS_OPTIONS;

    const columns = [
      {
        title: "姓名",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "用户名",
        dataIndex: "username",
        key: "username",
      },
      {
        title: "密码",
        dataIndex: "password",
        key: "password",
      },
      {
        title: "部门",
        dataIndex: "teamName",
        key: "teamName",
      },
    ];

    const fetchData = async (department: string) => {
      const data = await getAllUsers(department).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      state.taskList = data;
    };

    onMounted(() => {
      fetchData("");
    });

    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "2022",
    });
    const typeOptions = TYPE_OPTIONS;

    const filterFormState: UnwrapRef<filterFormState> = reactive(createFilterFormState());

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);
      console.log("我看看参数");
      console.log(values);
      tableLoading.value = true;

      if (values.length == 4) {
        fetchData(values[0]);
      }
    };

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const addUser = () => {
      showCheck.value = true;
    };

    const roleOptions = ref<typeof SelectTypes["options"]>([
      {
        value: "1",
        label: "R1",
      },
      {
        value: "2",
        label: "R2",
      },

      {
        value: "3",
        label: "R3",
      },
      {
        value: "4",
        label: "R4",
      },
      {
        value: "6",
        label: "A1",
      },
    ]);

    const createNewUserformState = () => ({
       username: "",
      password: "Abc@123",
      department: "",
      displayName: "",
      teamName: "",
      roleId: "",
    });

    const newUserformState: UnwrapRef<newUserformState> = reactive(createNewUserformState());


    const checkIfEmpty = (formData) => {
      if (formData["department"] === "") {
        message.error("请选择部门");
        return false;
      }
      if (formData["displayName"] === "") {
        message.error("请输入姓名");
        return false;
      }
      if (formData["password"] === "") {
        message.error("请输入密码");
        return false;
      }
      if (formData["username"] === "") {
        message.error("请输入用户名");
        return false;
      }
      if (formData["roleId"] === "") {
        message.error("请选择角色");
        return false;
      }
      return true
    };
    const addUserOk = () => {
      console.log("表单数据");
      const formData = toRaw(newUserformState);
      console.dir(formData);
      const flag = checkIfEmpty(formData);
      if (!!flag) {
        const params = {};
        Object.assign(params, formData);
        params["teamName"] = teamMap[formData["department"]];
        console.log("拼接参数");
        console.dir(params);
        const submit = addUserAPI(params).then((response)=>{
          confirmLoadingNew.value = false;
                console.log("response");
                console.log(response);
                if (response.data.status === "fail") {
                  message.error(response.data.msg);
                } else {
                  showCheck.value = false;
                  message.success("新建用户成功");

              

                  // 清空表单数据
                  Object.assign(newUserformState, createNewUserformState());

                  fetchData("");
                }

        }).catch((err)=>{
          message.error("增加用户失败")
        })

      }
    };

    return {
      TYPE_MAP,
      state,
      columns,

      visible,

      filterFormState,
      tableLoading,
      searchFilters,
      typeOptions,
      wrapperCol: { span: 14, offset: 4 },

      filterOption,

      showPreview,

      showHistory,
      historyLoading,
      addUser,
      showCheck,
      roleOptions,
      teamOptions,
      newUserformState,
      addUserOk,
      confirmLoadingNew,
    };
  },
});
</script>
<style lang="scss" scoped>
.filters-wrapper {
  margin-top: 30px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;

  .search-filter-wrapper {
    .ant-form {
      display: flex;
    }
  }
  .table-wrapper {
    padding: 20px;
  }

  .header-wrapper {
    font-size: 20px;
    line-height: 1.5;
    margin-left: 40px;
  }
}
.doneTask__container {
  padding: 0 20px;
  h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }
}
</style>
