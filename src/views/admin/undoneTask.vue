<template>
  <div class="issue__container">
    <div class="filters-wrapper">
      <div class="search-filter-wrapper">
        <a-form ref="filter-form" :model="filterFormState" layout="inline">
          <a-form-item name="name" label="项目名称">
            <a-input v-model:value="filterFormState.name" />
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
          <a-form-item name="number" label="项目编号">
            <a-input v-model:value="filterFormState.number" />
          </a-form-item>
          <a-form-item name="year" label="按年度筛选">
            <a-select
              v-model:value="filterFormState.year"
              style="width: 120px"
              :options="options1"
            />
          </a-form-item>
          <a-form-item :wrapper-col="wrapperCol">
            <a-button type="primary" @click="searchFilters">搜索</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.processId"
          :loading="tableLoading"
        >
          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #action="{ record }">
            <span>
              <a-button @click="() => checkHistory(record.processId)">
                流程查看
              </a-button>
            </span>
            <a-divider type="vertical" />
            <span>
              <a-button
                primary
                danger
                @click="() => deleteTask(record.processId)"
              >
                删除项目
              </a-button>
            </span>
          </template>
          <template #type="{ record }">
            <span>{{ typeMap[record.type] }}</span>
          </template>
          <template #attachment="{ record }">
            <a-button @click="() => showImg(record.attachment)"
              >查看任务书</a-button
            >
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="查看附件原图"
        v-model:visible="showPreview"
        width="1200px"
        :destroyOnClose="true"
        :footer="null"
      >
        <img :src="state.previewURL" style="max-width: 1100px" />
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        ref="history"
        title="查看当前审批流程"
        v-model:visible="showHistory"
        @ok="historyOk"
        width="1000px"
        :destroyOnClose="true"
      >
        <a-spin v-if="historyLoading" />
        <a-table
          v-else
          :dataSource="state.historyData"
          :columns="historyColumns"
          :rowKey="(record) => record.processId"
        >
          <template #comment="{ record }">
            <span>{{ record.comment ? record.comment : "无" }}</span>
          </template>
        </a-table>
      </a-modal>
    </div>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  onMounted,
  UnwrapRef,
  toRaw,
  createVNode,
} from "vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import aIcon from "@/components/aicon/aicon.vue";
import {
  MinusCircleOutlined,
  PlusOutlined,
  AppstoreTwoTone,
  CrownTwoTone,
  EditTwoTone,
  ExclamationCircleOutlined,
} from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import { checkHistoryRequest, deleteProject } from "@/api/display";
import { getAdminAllList } from "@/api/admin";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
// import moment from "moment";
import dayjs from "dayjs";
import  SelectTypes  from "ant-design-vue/es/select";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

const columns = [
  {
    title: "任务名",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "任务书编号",
    dataIndex: "number",
    key: "number",
  },
  {
    title: "任务类型",
    slots: { customRender: "type" },
    key: "type",
  },
  {
    title: "上传任务时间",
    slots: { customRender: "updatedAt" },
    key: "updatedAt",
  },
  {
    title: "项目长",
    dataIndex: "ownerName",
    key: "ownerName",
  },
  {
    title: "附件",
    slots: { customRender: "attachment" },
    key: "attachment",
  },
  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
  },
];

interface Member {
  userId: string;
  displayName: string;
}

interface PeopleAndProductRecord {
  peopleLabel: string;
  peopleValue: string;
  productLabel: string;
  productValue: number;
}

interface CommentForm {
  comment: string | undefined;
}

interface newFormState {
  name: string;
  number: string;
  type: string;
  fileList: [];
  taskId: string;
  processId: string;
  nextAssignee: string;
}

interface FileItem {
  uid: string;
  name?: string;
  status?: string;
  response?: Response;
  url: string;
}

interface FileInfo {
  file: FileItem;
  fileList: FileItem[];
}
export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
    PlusOutlined,
    MinusCircleOutlined,
    UploadOutlined,
    CrownTwoTone,
    AppstoreTwoTone,
    EditTwoTone,
    ExclamationCircleOutlined,
  },
  data() {
    return {
      columns,
      typeMap,
    };
  },

  setup(props, context) {
    const addModal = ref();
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const showRollback = ref<boolean>(false);
    const confirmLoading2 = ref<boolean>(false);
    const showNewProject = ref<boolean>(false);
    const formRef3 = ref();
    const showCheck = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const state = reactive({
      taskList: [],
      candidates: [],
      userIdToNameMap: {},
      processId: "",
      taskId: "",
      historyData: [],
      currentRollbackRecord: {},
      checkProcessId: "",
      checkTaskId: "",
      products: [],
      previewURL: "",
      checkRecord: {},
    });
    const commentForm: UnwrapRef<CommentForm> = reactive({
      comment: "",
    });

    const newFormState: UnwrapRef<newFormState> = reactive({
      name: "",
      number: "",
      type: "",
      fileList: [],
      taskId: "",
      processId: "",
      nextAssignee: "",
    });
    const formRef = ref();
    const dynamicForm: UnwrapRef<{
      records: PeopleAndProductRecord[];
    }> = reactive({
      records: [
        {
          peopleLabel: "项目成员",
          peopleValue: "",
          productLabel: "建议产值比例",
          productValue: 100,
        },
      ],
    });
    const columnsWithoutOperation = [
      {
        title: "任务名",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "任务书编号",
        dataIndex: "number",
        key: "number",
      },
      {
        title: "任务类型",
        slots: { customRender: "type" },
        key: "type",
      },
      {
        title: "上传任务时间",
        slots: { customRender: "updatedAt" },
        key: "updatedAt",
      },
      {
        title: "项目长",
        dataIndex: "ownerName",
        key: "ownerName",
      },
      {
        title: "附件",
        slots: { customRender: "attachment" },
        key: "attachment",
      },
    ];

    const historyColumns = [
      {
        title: "时间",
        dataIndex: "time",
        key: "time",
      },
      {
        title: "流程节点",
        dataIndex: "activityName",
        key: "activityName",
      },
      {
        title: "操作人",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "审核意见",
        slots: { customRender: "comment" },
        key: "comment",
      },
    ];

    const typeOptions = TYPE_OPTIONS;
    console.log("typeOptions");
    console.dir(typeOptions);

    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string
    ) => {
      const data = await getAdminAllList(name, number, type, year).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
      );
      if (data.hasOwnProperty("empty") || data.unfinished.length === 0) {
        state.taskList = [];
      } else {
        state.taskList = data.unfinished;
      }
    };

    onMounted(() => {
      fetchData("", "", "", "2022");
    });

    // 点击表单添加按钮
    const addAdvice = (processId: string, taskId: string) => {
      visible.value = true;
      state.processId = processId;
      state.taskId = taskId;
    };

    const addSubmit = (e: MouseEvent) => {
      visible.value = false;
    };

    const checkForDuplicates = (array) => {
      return new Set(array).size !== array.length;
    };

    const onCancel = () => {
      visible.value = false;
    };

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const checkHistory = (processId: string) => {
      showHistory.value = true;
      historyLoading.value = true;
      console.log(showHistory.value);
      checkHistoryRequest(processId)
        .then((response) => {
          const historyData = response.data.data;
          state.historyData = historyData;
          historyLoading.value = false;
        })
        .catch((err) => {
          message.error("程序异常");
        });
    };

    const historyOk = () => {
      showHistory.value = false;
      state.historyData = [];
    };

    const check = (record) => {
      showCheck.value = true;

      state.products = record.products;
      state.checkProcessId = record.processId;
      state.checkTaskId = record.taskId;
      state.checkRecord = record;
    };

    const productColumns = [
      {
        title: "团队成员",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "承担比例",
        slots: { customRender: "percentage" },
        key: "percentage",
      },
    ];

  

 
    const changeTime = (time) => {
      return dayjs(time).add(8, "hours").format("lll");
    };

    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };

    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "2022",
    });

    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);
      console.log("我看看参数");
      console.log(values);
      tableLoading.value = true;

      if (values.length == 4) {
        fetchData(values[0], values[1], values[2], values[3]);
      }
    };

    const options1 = ref<typeof SelectTypes["options"]>([
      {
        value: "2022",
        label: "2022",
      },
      {
        value: "2023",
        label: "2023",
      },

      {
        value: "2024",
        label: "2024",
      },
    ]);

    const deleteTask = (processId: string) => {
      antModal.confirm({
        title: "您确认删除此项目吗？",
        icon: createVNode(ExclamationCircleOutlined),
        onOk() {
          deleteProject(processId)
            .then((response) => {
              message.success("删除成功");
              fetchData("", "", "", "2022");
            })
            .catch((err) => {
              console.log(err);
            });
        },
        onCancel() {
          console.log("Cancel");
        },
        class: "test",
      });
    };

    return {
      labelCol: { style: { width: "150px", textAlign: "center" } },
      state,
      confirmLoading,
      visible,
      addModal,
      addAdvice,
      addSubmit,

      filterOption,
      onCancel,
      dynamicForm,

      // rules,
      formRef,
      checkHistory,
      historyOk,
      showHistory,
      historyLoading,
      historyColumns,
      showRollback,

      commentForm,
      confirmLoading2,
      showNewProject,

      newFormState,
      typeOptions,
      showCheck,
      productColumns,
      check,

      changeTime,
      showPreview,
      showImg,
      columnsWithoutOperation,
      activeKey: ref("1"),
      labelColOfCheck: { style: { fontSize: "18px" } },

      filterFormState,
      tableLoading,
      searchFilters,
      wrapperCol: { span: 14, offset: 4 },
      options1,
      deleteTask
    };
  },
});
</script>
<style lang="scss" scoped>
.issue__container {
  padding: 20px;
  font-size: 14px;
  & .icons {
    display: flex;
    margin: 0;
    padding: 0;
    & li {
      margin-right: 10px;
      list-style: none;
      font-size: 24px;
      cursor: pointer;
    }
  }
}
.line-wrapper {
  display: flex;
  justify-content: center;
}

.add-record-button {
  width: 100%;
}

.table-wrapper {
  margin-top: 30px;
}

.button-wrapper {
  margin-top: 30px;
  display: flex;
  justify-content: center;

  .reject-button .ant-btn {
    margin-right: 20px;
  }
}

.header-title-wrapper {
  font-size: 22px;
  margin-bottom: 10px;
  .header-title {
    margin-left: 10px;
  }
}

.header-title-wrapper-with-margin-top {
  margin-top: 20px;
}

.tab-title-header {
  font-size: 20px;
}
.label-wrapper {
  font-size: 18px;
}

.label-style > :first-child > label {
  font-size: 18px;
}

.check-form-label .label-style label {
  font-size: 18px;
}

.ant-form-item-label > label {
  font-size: 18px;
}

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

.issue__container {
  padding: 0 20px;
}
</style>
