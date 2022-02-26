<template>
  <div class="doneTask__container">
    <div class="filters-wrapper">
      <div class="search-filter-wrapper">
        <a-form ref="filter-form" :model="filterFormState" layout="inline">
          <a-form-item name="leader" label="分管领导">
            <a-select
              v-model:value="filterFormState.leader"
              show-search
              :options="state.options2"
              style="width: 120px"
              :filterOption="filterOption"
              :allowClear="true"
            />
          </a-form-item>

          <a-form-item name="type" label="项目类型">
            <a-select
              v-model:value="filterFormState.type"
              show-search
              :options="typeOptions"
              style="width: 120px"
              :filterOption="filterOption"
              :allowClear="true"
            />
          </a-form-item>

          <a-form-item :wrapper-col="wrapperCol">
            <a-button type="primary" @click="searchFilters">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>
      <div class="button-wrapper">
        <a-button @click="showAddNewModal">新增数据</a-button>
      </div>
    </div>
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.id"
          :loading="tableLoading"
        >
          <template #displayName="{ record }">
            <div class="editable-cell">
              <div
                v-if="editableData[record.id]"
                class="editable-cell-input-wrapper"
              >
                <a-select
                  v-model:value="editableData[record.id].displayName"
                  :options="options1"
                  @change="save(record.id, record)"
                />
              </div>
              <div v-else class="editable-cell-text-wrapper">
                {{ record.displayName || " " }}
                <edit-outlined
                  class="editable-cell-icon"
                  @click="edit(record.id)"
                />
              </div>
            </div>
          </template>

          <template #action="{ record }">
            <span>
              <a-button primary danger @click="() => deleteTask(record.id)">
                删除
              </a-button>
            </span>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="增加新数据"
        v-model:visible="showAddNewData"
        width="1000px"
        :destroyOnClose="true"
        :footer="null"
      >
        <a-form layout="inline">
          <a-form-item name="leader" label="分管领导">
            <a-select
              v-model:value="newFormState.leader"
              show-search
              :options="state.options2"
              style="width: 120px"
              :filterOption="filterOption"
              :allowClear="true"
            />
          </a-form-item>
          <a-form-item name="type" label="项目类型">
            <a-select
              v-model:value="newFormState.type"
              show-search
              :options="typeOptions"
              style="width: 120px"
              :filterOption="filterOption"
              :allowClear="true"
            />
          </a-form-item>
          <a-button @click="submit">确认添加</a-button>
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
  watchEffect,
  createVNode,
  computed,
} from "vue";
import {
  ExclamationCircleOutlined,
  CheckOutlined,
  EditOutlined,
} from "@ant-design/icons-vue";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import {
  getAllR4Types,
  changeUserId,
  deleteR4Type,
  addR4Type,
  getAllR4Users,
} from "@/api/admin";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import { cloneDeep } from "lodash-es";
import { SelectTypes } from "ant-design-vue/es/select";

interface filterFormState {
  type: string;
  leader: string;
}

interface DataItem {
  displayName: string;
  typeId: string;
  description: string;
}

interface newFormState {
  leader: string;
  type: string;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    Modal,
    antModal,
    ExclamationCircleOutlined,
    CheckOutlined,
    EditOutlined,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      products: [],
      previewURL: "",
      historyData: [],
      r4Users: [],
      options1: [],
      options2: [],
    });
    const visible = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const showAddNewData = ref<boolean>(false);

    const columns = [
      {
        title: "分管领导",
        slots: { customRender: "displayName" },
        key: "displayName",
      },
      //   {
      //     title: "任务类型编号",
      //     dataIndex: "typeId",
      //     key: "typeId",
      //     sorter: (a, b) => a.typeId - b.typeId,
      //   },
      {
        title: "任务类型",
        dataIndex: "description",
        key: "description",
      },
      {
        title: "操作",
        key: "action",
        slots: { customRender: "action" },
      },
    ];

    const createFilterFormState = () => ({
      type: "",
      leader: "",
    });
    const typeOptions = TYPE_OPTIONS;

    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);
      tableLoading.value = true;

      if (values.length == 2) {
        fetchData(values[0], values[1]);
      }
    };

    const fetchData = async (type: string, leader: string) => {
      const data = await getAllR4Types(type, leader).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      if (data.hasOwnProperty("empty")) {
        state.taskList = [];
      } else {
        state.taskList = data;
      }
    };

    const fetchR4Users = async () => {
      const data = await getAllR4Users().then((response) => {
        return response.data.data;
      });
      state.r4Users = data;

      state.options1 = state.r4Users.map((item) => {
        const tmp = {};
        tmp["value"] = item.displayName;
        tmp["label"] = item.displayName;
        return tmp;
      });

      state.options2 = state.r4Users.map((item) => {
        const tmp = {};
        tmp["value"] = item.id;
        tmp["label"] = item.displayName;
        return tmp;
      });
    };

    onMounted(() => {
      fetchR4Users();
      fetchData("", "");
    });

    const editableData: UnwrapRef<Record<string, DataItem>> = reactive({});

    const edit = (id: string) => {
      editableData[id] = cloneDeep(
        toRaw(state.taskList).filter((item) => id === item.id)[0]
      );

      console.log("key");
      console.log(id);
      console.log("editableData[key]");
      console.dir(editableData[id]);
    };
    const save = (id: string, record) => {
      console.log("我看看参数");
      console.dir(editableData[id]);
      const displayName = editableData[id].displayName;
      const recordId = record.id;
      console.log("我看看参数");
      console.log(editableData[id].displayName);

      Object.assign(
        toRaw(state.taskList).filter((item) => id === item.id)[0],
        editableData[id]
      );

      delete editableData[id];

      changeUserId({ displayName: displayName, id: recordId }).then(
        (response) => {
          if (response.data.status === "fail") {
            message.error(response.data.msg);
          } else {
            message.success("修改成功");
            fetchData("", "");
          }
        }
      );
    };
    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const options1 = ref<SelectTypes["options"]>([
      {
        value: "李正佳",
        label: "李正佳",
      },
      {
        value: "胡峰",
        label: "胡峰",
      },

      {
        value: "敬龙江",
        label: "敬龙江",
      },
      {
        value: "王扶国",
        label: "王扶国",
      },
    ]);

    const deleteTask = (id) => {
      deleteR4Type({ id: id }).then((response) => {
        if (response.data.status === "fail") {
          message.error(response.data.msg);
          fetchData("", "");
        } else {
          message.success(response.data.msg);
          fetchData("", "");
        }
      });
    };

    const showAddNewModal = () => {
      showAddNewData.value = true;
    };

    const createNewFormState = () => ({
      leader: "",

      type: "",
    });

    const newFormState: UnwrapRef<filterFormState> = reactive(
      createNewFormState()
    );

    const options2 = ref<SelectTypes["options"]>([
      {
        value: "11",
        label: "李正佳",
      },
      {
        value: "27",
        label: "胡峰",
      },

      {
        value: "12",
        label: "敬龙江",
      },
      {
        value: "13",
        label: "王扶国",
      },
    ]);

    const submit = () => {
      console.log("newFormState");
      console.log(toRaw(newFormState));
      const obj = toRaw(newFormState);
      if (obj["leader"] === "" || obj["type"] === "") {
        message.error("请同时选择分管领导和任务类型噢~");
        return;
      }
      const userid = obj["leader"];
      const typeId = obj["type"];
      const description = TYPE_MAP[typeId];
      const params = {
        userId: obj["leader"],
        typeId: typeId,
        description: description,
      };

      addR4Type(params).then((response) => {
        showAddNewData.value = false;

        if (response.data.status === "fail") {
          message.error(response.data.msg);
        } else {
          message.success(response.data.msg);
        }

        fetchData("", "");
      });
      console.log("params");
      console.dir(params);
    };

    return {
      TYPE_MAP,
      state,
      columns,

      visible,

      tableLoading,

      wrapperCol: { span: 14, offset: 4 },

      showPreview,
      filterOption,
      showHistory,
      historyLoading,

      filterFormState,
      typeOptions,
      searchFilters,
      editableData,
      edit,
      save,
      options1,
      deleteTask,
      showAddNewData,
      showAddNewModal,
      options2,
      newFormState,
      submit,
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
}
.editable-cell {
  position: relative;
  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 24px;
  }

  .editable-cell-text-wrapper {
    display: flex;
    padding: 5px 24px 5px 5px;
  }

  .editable-cell-icon,
  .editable-cell-icon-check {
    position: absolute;
    left: 50px;
    width: 20px;
    cursor: pointer;
  }

  .editable-cell-icon {
    margin-top: 4px;
    display: none;
  }

  .editable-cell-icon-check {
    line-height: 28px;
  }

  .editable-cell-icon:hover,
  .editable-cell-icon-check:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}
.editable-cell:hover .editable-cell-icon {
  display: flex;
  justify-content: flex-end;
}

.button-wrapper {
  margin-left: 30px;
}
</style>
