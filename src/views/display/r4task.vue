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
          <a-space>
            日期筛选：
            <a-range-picker v-model:value="filterFormState.range"
            @change="onChangeRangePicker" />
          </a-space>
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
          <template #check="{ record }">
            <span v-if="record.activityName === 'R4审核'">
              <a-tag color="warning">
                <template #icon>
                  <exclamation-circle-outlined />
                </template>
                待审核
              </a-tag>
            </span>
            <span v-else>
              <a-tag color="success">
                <template #icon>
                  <check-circle-outlined />
                </template>
                已审核
              </a-tag>
            </span>
          </template>
          <template #action="{ record }">
            <span v-if="record.activityName === 'R4审核'">
              <a-button @click="() => check(record)">点击审核</a-button>

              <a-divider type="vertical" />
            </span>

            <span>
              <a-button @click="() => checkHistory(record.processId)">流程查看</a-button>
            </span>
          </template>
          <template #type="{ record }">
            <span>{{ typeMap[record.type] }}</span>
          </template>
          <template #attachment="{ record }">
            <a-button @click="() => showImg(record.attachment)">查看任务书</a-button>
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
            <span>{{ record.comment ? record.comment : (record.endTime? "【通过】":"【进行中】") }}</span>
          </template>
        </a-table>
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        title="审核流程"
        v-model:visible="showCheck"
        width="1000px"
        :destroyOnClose="true"
        :footer="null"
      >
        <a-tabs v-model:activeKey="activeKey">
          <a-tab-pane key="1">
            <template #tab>
              <span class="tab-title-header">
                <AppstoreTwoTone />项目详情
              </span>
            </template>
            <a-table
              :columns="columnsWithoutOperation"
              :data-source="[state.checkRecord]"
              :rowKey="(record) => record.processId"
              :pagination="false"
            >
              <template #updatedAt="{ record }">
                <span>{{ changeTime(record.updatedAt) }}</span>
              </template>

              <template #type="{ record }">
                <span>{{ typeMap[record.type] }}</span>
              </template>
              <template #attachment="{ record }">
                <a-button @click="() => showImg(record.attachment)">查看任务书</a-button>
              </template>
            </a-table>
          </a-tab-pane>
          <a-tab-pane key="2">
            <template #tab>
              <span class="tab-title-header">
                <CrownTwoTone />产值比例
              </span>
            </template>
            <a-table
              :columns="productColumns"
              :data-source="state.products"
              :rowKey="(record) => record.id"
              :pagination="true"
            >
              <template #percentage="{ record }">
                <span>{{ record.percentage + "%" }}</span>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>

        <header class="header-title-wrapper header-title-wrapper-with-margin-top">
          <EditTwoTone />
          <span class="header-title">流程审批</span>
        </header>

        <a-form ref="formRef2" :model="commentForm">
          <a-form-item name="comment" label="审批意见">
            <a-input v-model:value="commentForm.comment" />
          </a-form-item>
        </a-form>

        <div class="button-wrapper">
          <div class="reject-button">
            <a-button danger size="large" @click="() => rollbackTo('R3check')">退回，室主任重新审核</a-button>
            <a-button danger size="large" @click="() => rollbackTo('fillNumbers')">退回，重新填写产值比例</a-button>
            <a-button danger size="large" @click="() => rollbackTo('uploadTask')">退回，重新上传任务</a-button>
          </div>
          <div class="agree">
            <a-button @click="() => agreeTo()" type="primary" size="large">审核通过</a-button>
          </div>
        </div>
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
} from "vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import  SelectTypes  from "ant-design-vue/es/select";
import aIcon from "@/components/aicon/aicon.vue";
import {
  MinusCircleOutlined,
  PlusOutlined,
  AppstoreTwoTone,
  CrownTwoTone,
  EditTwoTone,
  CheckCircleOutlined,
} from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message } from "ant-design-vue";
import {
  getR4UnfinishedList,
  getAllR1R2R3Users,
  checkHistoryRequest,
  rollbackRequest,
  r4Approve,
} from "@/api/display";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
// import moment from "moment";
import dayjs from "dayjs";
import { debounce } from "lodash-es";
import type { Dayjs } from 'dayjs';

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
  startDate: string;
  endDate: string,
  range: Dayjs;
}

const columns = [
  {
    title: "任务名",
    dataIndex: "name",
    key: "name",
    width: 250
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
    title: "状态",
    key: "check",
    slots: { customRender: "check" },
    filters: [
      {
        text: '已审核',
        value: '已审核',
      },
      {
        text: '待审核',
        value: '待审核',
      },

    ],
    filterMultiple: false,
    onFilter: (value: string, record) => {
      if (record.activityName === 'R4审核') {
        return value === "待审核"
      } else {
        return value === "已审核"
      }
    },
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
    CheckCircleOutlined
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
        title: "开始时间",
        dataIndex: "startTime",
        key: "startTime",
      },
      {
        title: "结束时间",
        dataIndex: "endTime",
        key: "endTime",
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
      year: string,
      startDate: string,
      endDate: string
    ) => {
      const data = await getR4UnfinishedList(name, number, type, year, startDate, endDate).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
      );
      if (data.hasOwnProperty("empty")) {
        state.taskList = [];
      } else {
        state.taskList = data;
      }
    };

    const fetchCandidates = async () => {
      const candidates = await getAllR1R2R3Users().then(
        (response) => response.data.data
      );
      const options = candidates.map((item) => {
        let tmp = {};
        tmp["value"] = item["id"];
        tmp["label"] = item["displayName"];
        return tmp;
      });
      state.candidates = options;
      const idNameMap = candidates.reduce((accumulator, currentValue) => {
        let id = currentValue["id"];
        let name = currentValue["displayName"];
        accumulator[id] = name;
        return accumulator;
      }, {});
      state.userIdToNameMap = idNameMap;
    };
    onMounted(() => {
      fetchCandidates();
      fetchData("", "", "", ""+dayjs().year(),"","");
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

    const rollbackTo = debounce((targetKey) => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["targetKey"] = targetKey;
      params["comment"] = toRaw(commentForm).comment || "";

      commentForm.comment = "";

      rollbackRequest(params)
        .then((response) => {
          message.success("退回成功");
          fetchData("", "", "", ""+dayjs().year(),"","");

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    }, 1000);

    const agreeTo = debounce(() => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["comment"] = toRaw(commentForm).comment || "";

      commentForm.comment = "";

      r4Approve(params)
        .then((response) => {
          message.success("审核通过成功");
          fetchData("", "", "", ""+dayjs().year(),"","");

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    }, 1000);
    const changeTime = (time) => {
    return dayjs(time).add(8, "hours").format('YYYY年MM月DD日 HH:mm');
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
      startDate: "",
      endDate: "",
      range: null
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
      fetchData(formData.name, formData.number, formData.type, formData.year, formData.startDate, formData.endDate)

    
    };

    const options1 = ref<typeof SelectTypes["options"]>([
      {
        value: ""+dayjs().year(),
        label: ""+dayjs().year(),
      },
      {
        value: ""+(dayjs().year()+1),
        label: ""+(dayjs().year()+1),
      },

      {
        value: ""+(dayjs().year()+2),
        label: ""+(dayjs().year()+2),
      },
    ]);

      const onChangeRangePicker = (value, dateString)=>{
      filterFormState.startDate=dateString.slice(0,1).toString()
      filterFormState.endDate=dateString.slice(1,2).toString()
    }

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
      rollbackTo,
      agreeTo,
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
      onChangeRangePicker
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
