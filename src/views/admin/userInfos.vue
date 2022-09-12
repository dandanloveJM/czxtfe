<template>
  <div class="doneTask__container">
    <h2>
      <a-space>
        <contacts-two-tone />
        <span>用户信息</span>
      </a-space>
    </h2>

    <div class="filters-wrapper">
      <div class="search-filter-wrapper">
        <a-form ref="filter-form" :model="filterFormState" layout="inline">
          <a-form-item name="department" label="部门">
            <a-select
              v-model:value="filterFormState.department"
              show-search
              :options="teamOptions"
              style="width: 120px"
              :allowClear="true"
            />
          </a-form-item>
          <a-form-item name="id" label="姓名">
            <a-select
              v-model:value="filterFormState.id"
              show-search
              :options="state.candidates"
              :filterOption="filterOption"
              style="width: 120px"
              :allowClear="true"
            />
          </a-form-item>

          <a-form-item :wrapper-col="wrapperCol">
            <a-button type="primary" @click="searchFilters">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="button-class">
        <a-button type="primary" @click="() => addUser()">新增用户</a-button>
      </div>
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.id"
          :loading="tableLoading"
          :pagination="false"
          bordered
        >
          <template #bodyCell="{ column, text, record }">
            <template
              v-if="
                ['username', 'displayName', 'password', 'teamName'].includes(
                  column.dataIndex
                )
              "
            >
              <div>
                <a-input
                  v-if="
                    editableData[record.id] &&
                    ['username', 'displayName', 'password'].includes(column.dataIndex)
                  "
                  v-model:value="editableData[record.id][column.dataIndex]"
                  style="width: 200px"
                />
                <a-select
                  v-else-if="editableData[record.id] && column.dataIndex === 'teamName'"
                  v-model:value="editableData[record.id]['department']"
                  :options="teamOptions"
                  style="width: 120px"
                  :allowClear="true"
                >
                </a-select>
                <template v-else-if="column.dataIndex === 'teamName'">
                  <!-- {{text}} -->
                  {{ teamMap[record.department] }}
                </template>
                <template v-else>
                  {{ text }}
                </template>
              </div>
            </template>

            <template v-else-if="column.key === 'action'">
              <div class="editable-row-operations">
                <span v-if="editableData[record.id]">
                  <a-typography-link @click="save(record.id)">保存</a-typography-link>
                  <a-popconfirm title="确定取消吗?" @confirm="cancel(record.id)">
                    <a>取消</a>
                  </a-popconfirm>
                </span>
                <span v-else>
                  <a @click="edit(record.id)">编辑用户</a>
                </span>
              </div>
            </template>

            <template v-else-if="column.key === 'delete'">
              <span>
                <a-button primary danger @click="() => deleteUser(record.id)"
                  >删除用户</a-button
                >
              </span>
            </template>
          </template>
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
import {
  defineComponent,
  ref,
  reactive,
  onMounted,
  UnwrapRef,
  toRaw,
  createVNode,
} from "vue";
import { ExclamationCircleOutlined, ContactsTwoTone } from "@ant-design/icons-vue";
import { typeMap, TYPE_OPTIONS, TEAMS_OPTIONS, teamMap } from "@/utils/config";
import { getAllUsers, addUserAPI, deleteUserAPI, updateUserAPI } from "@/api/admin";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import SelectTypes from "ant-design-vue/es/select";
import { cloneDeep } from "lodash-es";
import { getAllR1R2R3Users } from "@/api/display";
import { debounce, throttle } from "lodash-es";

interface filterFormState {
  id: string;
  department: string;
}

interface newUserformState {
  username: string;
  password: string;
  department: string;
  displayName: string;
  teamName: string;
  roleId: string;
}

interface newUserinfoState {
  username: string;
  password: string;
  department: string;
  displayName: string;
  teamName: string;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    Modal,
    antModal,
    ExclamationCircleOutlined,
    ContactsTwoTone,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      products: [],
      previewURL: "",
      historyData: [],
      candidates: [],
      userIdToNameMap: {},
    });
    const visible = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const confirmLoadingNew = ref<boolean>(false);
    const showCheck = ref<boolean>(false);
    const editableData: UnwrapRef<Record<string, newUserinfoState>> = reactive({});

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
      {
        title: "编辑",
        dataIndex: "action",
        key: "action",
      },
      {
        title: "删除",
        dataIndex: "delete",
        key: "delete",
      },
    ];

    const fetchData = async (id, department: string) => {
      const data = await getAllUsers(id, department).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      state.taskList = data;
      const options = data.map((item) => {
        let tmp = {};
        tmp["value"] = item["id"];
        tmp["label"] = item["displayName"];
        return tmp;
      });
      state.candidates = options;

    };

    const edit = (key: string) => {
      console.log("key: " + key);

      editableData[key] = cloneDeep(
        state.taskList.filter((item) => {
          return item.id === key;
        })[0]
      );

      console.log("edit");
      console.dir(editableData[key]);
    };
    const save = debounce(
      (key: string) => {
        Object.assign(
          state.taskList.filter((item) => key === item.id)[0],
          editableData[key]
        );

        const params = cloneDeep(toRaw(editableData[key]));
        delete editableData[key];
        const newParams = {};
        newParams["username"] = params.username;
        newParams["password"] = params.password;
        newParams["displayName"] = params.displayName;
        newParams["department"] = params.department;
        newParams["teamName"] = teamMap[params["department"]];
        newParams["userId"] = params.id;

        updateUserAPI(newParams)
          .then((response) => {
            if (response.data.status === "fail") {
              message.error(response.data.msg);
            } else {
              message.success("修改用户成功");
            }
            fetchData("", "");
          })
          .catch((err) => {
            message.error("修改失败");
          });
      },
      3000,
      {
        leading: true,
        trailing: false,
      }
    );
    const cancel = (key: string) => {
      delete editableData[key];
    };

    onMounted(() => {
      fetchData("", "");
    });

    const createFilterFormState = () => ({
      id: "",
      department: "",
    });
    const typeOptions = TYPE_OPTIONS;

    const filterFormState: UnwrapRef<filterFormState> = reactive(createFilterFormState());

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);
      console.log("我看看参数");
      console.dir(formData);
      console.log(values);
      tableLoading.value = true;

      // if (values.length == 2) {
      //   fetchData(values[0]);
      // }
      const idParam = formData.id ? formData.id : "0";
      const departmentParam = formData.department ? formData.department : "";
      fetchData(idParam, departmentParam);
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

    const newUserformState: UnwrapRef<newUserformState> = reactive(
      createNewUserformState()
    );

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
      return true;
    };
    const addUserOk = debounce(
      () => {
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
          const submit = addUserAPI(params)
            .then((response) => {
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

                fetchData("", "");
              }
            })
            .catch((err) => {
              message.error("增加用户失败");
            });
        }
      },
      3000,
      {
        leading: true,
        trailing: false,
      }
    );

    const deleteUser = debounce(
      (id) => {
        antModal.confirm({
          title: "您确认删除此用户吗？",
          icon: createVNode(ExclamationCircleOutlined),
          onOk() {
            deleteUserAPI({ userId: id })
              .then((response) => {
                if (response.data.status === "ok") {
                  message.success("删除成功");
                  fetchData("", "");
                }
              })
              .catch((err) => {
                message.error("删除失败");
              });
          },
          onCancel() {
            console.log("Cancel");
          },
          class: "test",
        });
      },
      3000,
      {
        leading: true,
        trailing: false,
      }
    );

    

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
      deleteUser,
      edit,
      save,
      cancel,
      editableData,
      teamMap,
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
    .button-class {
      margin-bottom: 20px;
    }
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
    margin-top: 20px;
  }
}

.editable-row-operations a {
  margin-right: 8px;
}

.table-wrapper {
  .button-class {
    margin-bottom: 20px;
  }
}
</style>
