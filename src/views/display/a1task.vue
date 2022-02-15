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
          <template #action="{ record }">
            <span v-if="record.activityName === 'A1填写产值'">
              <a-button @click="() => check(record)">赋予产值 </a-button>
              <a-divider type="vertical" />
            </span>

            <span>
              <a-button @click="() => checkHistory(record.processId)">
                流程查看
              </a-button>
            </span>
          </template>

          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>

          <template #type="{ record }">
            <span>{{ typeMap[record.type] }}</span>
          </template>
          <template #attachment="{ record }">
            <img
              :src="record.attachment"
              style="width: 200px"
              title="点击显示详情"
              @click="() => showImg(record.attachment)"
            />
            <!-- <a :href="record.attachment">点击查看附件</a> -->
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <a-modal
      title="查看附件原图"
      v-model:visible="showPreview"
      width="1200"
      :footer="null"
    >
      <img :src="state.previewURL" style="max-width: 1100px" />
    </a-modal>

    <a-modal
      ref="history"
      title="查看当前审批流程"
      v-model:visible="showHistory"
      @ok="historyOk"
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

    <a-modal title="审核流程" v-model:visible="showCheck" width="1000px" :footer="null">
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane key="1">
          <template #tab>
            <span class="tab-title-header">
              <AppstoreTwoTone />
              项目详情
            </span>
          </template>
          <a-table
            :columns="columnsWithoutOperation"
            :data-source="state.checkRecord"
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
              <img
                :src="record.attachment"
                style="width: 200px"
                title="点击显示详情"
                @click="() => showImg(record.attachment)"
              />
              <!-- <a :href="record.attachment">点击查看附件</a> -->
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="2">
          <template #tab>
            <span class="tab-title-header">
              <CrownTwoTone />
              产值比例
            </span>
          </template>
          <a-table
            :columns="productColumns"
            :data-source="state.products"
            :rowKey="(record) => record.id"
            :pagination="false"
          >
            <template #percentage="{ record }">
              <span>{{ record.percentage + "%" }}</span>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>

      <header class="header-title-wrapper header-title-wrapper-with-margin-top">
        <EditTwoTone />
        <span class="header-title">流程审批与赋予产值</span>
      </header>

      <a-form ref="formRef2" :model="commentForm">
        <a-form-item name="comment" label="审批意见">
          <a-input v-model:value="commentForm.comment" />
        </a-form-item>
      </a-form>

      <div class="button-wrapper">
        <div class="reject-button">
          <a-button @click="() => rollbackTo('R4check')" danger
            >退回至分管领导
          </a-button>
          <a-button @click="() => rollbackTo('R3check')" danger
            >退回至室主任
          </a-button>
          <a-button @click="() => rollbackTo('fillNumbers')" danger
            >退回，重新填写产值比例
          </a-button>
          <a-button @click="() => rollbackTo('uploadTask')" danger
            >退回，重新上传任务
          </a-button>
        </div>
        <div class="agree">
          <a-button @click="() => setValue()" type="primary"
            >赋予产值
          </a-button>
        </div>
      </div>
    </a-modal>

    <a-modal
      title="设置项目的总产值及完成比例"
      v-model:visible="showModify"
      @ok="resetOk"
      width="600px"
      @cancel="cancelSetValue"
    >
      <a-form ref="a1FormRef" :model="a1FormState">
        <a-form-item name="total" label="项目总产值">
          <a-input-number v-model:value="a1FormState.total" />
        </a-form-item>
        <a-form-item name="ratio" label="完成比例">
          <a-input-number
            v-model:value="a1FormState.ratio"
            :min="0"
            :max="100"
            :formatter="(value) => `${value}%`"
            :parser="(value) => value.replace('%', '')"
          /><span>填写0-100的正整数</span>
        </a-form-item>
      </a-form>
    </a-modal>
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
  watchEffect,
} from "vue";
import {
  RuleObject,
  ValidateErrorEntity,
} from "ant-design-vue/es/form/interface";
import { UploadOutlined } from "@ant-design/icons-vue";
import aIcon from "@/components/aicon/aicon.vue";
import {
  MinusCircleOutlined,
  PlusOutlined,
  AppstoreTwoTone,
  CrownTwoTone,
  EditTwoTone,
} from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import {
  getA1Data,
  getAllR1R2R3Users,
  fillOutputValue,
  checkHistoryRequest,
  rollbackRequest,
  startProcess,
  generateNewProject,
  a1SetProduct,
} from "@/api/display";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import moment from "moment";
import { SelectTypes } from "ant-design-vue/es/select";

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
    title: "附件(点击可放大)",
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

interface A1FormState {
  total: number;
  ratio: number;
}
export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
    PlusOutlined,
    MinusCircleOutlined,
    UploadOutlined,
    AppstoreTwoTone,
    CrownTwoTone,
    EditTwoTone,
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
      currentProcessId: "",
      currentTaskId: "",
      previewURL: "",
      checkRecord: [],
    });
    const commentForm: UnwrapRef<CommentForm> = reactive({
      comment: "",
    });

    const showModify = ref<boolean>(false);
    const a1FormRef = ref();
    const a1FormState: UnwrapRef<A1FormState> = reactive({
      total: 0,
      ratio: 100,
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
        title: "附件(点击可放大)",
        slots: { customRender: "attachment" },
        key: "attachment",
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
      const data = await getA1Data(name, number, type, year).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
      );
      if (data.hasOwnProperty("empty")) {
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

    const rollbackOk = () => {
      //获取填写的comment值
      const newComment = toRaw(commentForm).comment;
      state.currentRollbackRecord["comment"] = newComment;
      // send request
      console.log("传参");
      console.dir(toRaw(state.currentRollbackRecord));
      confirmLoading2.value = true;
      rollbackRequest(toRaw(state.currentRollbackRecord))
        .then((response) => {
          message.success("退回成功");
          confirmLoading2.value = false;
          fetchData("", "", "", "2022");

          showRollback.value = false;
        })
        .catch((err) => {
          console.log(err);
          confirmLoading2.value = false;
          message.error("程序异常");
        });
    };

    const check = (record) => {
      showCheck.value = true;
      const arr = [];
      arr.push(record);
      state.products = record.products;
      state.checkProcessId = record.processId;
      state.checkTaskId = record.taskId;
      state.checkRecord = arr;

      console.dir(record);
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

    const rollbackTo = (targetKey) => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["targetKey"] = targetKey;
      params["comment"] = toRaw(commentForm).comment || "";

      commentForm.comment = "";

      rollbackRequest(params)
        .then((response) => {
          message.success("退回成功");
          fetchData("", "", "", "2022");

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    };

    // const agreeTo = () => {
    //   const params = {};
    //   params["processId"] = state.checkProcessId;
    //   params["taskId"] = state.checkTaskId;
    //   params["comment"] = toRaw(commentForm).comment || "";

    //   commentForm.comment = "";

    //   r4Approve(params)
    //     .then((response) => {
    //       antModal.success({
    //         title: "审核通过成功",
    //       });
    //       fetchData();

    //       showCheck.value = false;
    //       state.checkProcessId = "";
    //       state.checkTaskId = "";
    //     })
    //     .catch((err) => {
    //       console.log(err);
    //       antModal.error({
    //         title: "程序异常",
    //       });
    //     });
    // };

    const setValue = () => {
      showModify.value = true;
      // state.currentProcessId = state.checkRecord.processId;
      // state.currentTaskId = state.checkRecord.taskId;
    };

    const resetOk = () => {
      // 1. 拼接参数 ，发请求，1.关闭modal, 2. 清空state.products
      const params = {};
      const a1FormState2 = toRaw(a1FormState);
      showCheck.value = false;
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["total"] = a1FormState2.total;
      params["ratio"] = a1FormState2.ratio;

      Object.assign(a1FormState, { total: 0, ratio: 100 });

      a1SetProduct(params)
        .then((response) => {
          message.success("设置产值及比例成功");
          fetchData("", "", "", "2022");

          showModify.value = false;
          state.currentProcessId = "";
          state.currentTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    };
    const changeTime = (time) => {
      return moment(time).add(8, "hours").format("lll");
    };
    const showImg = (srcURL: string) => {
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

    const options1 = ref<SelectTypes["options"]>([
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

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const cancelSetValue = () => {
      Object.assign(a1FormState, { total: 0, ratio: 100 });
    };
    return {
      labelCol: { style: { width: "150px", textAlign: "center" } },
      state,
      confirmLoading,
      visible,
      addModal,
      addAdvice,
      addSubmit,

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
      rollbackOk,
      commentForm,
      confirmLoading2,
      showNewProject,

      newFormState,
      typeOptions,
      showCheck,
      productColumns,
      check,
      rollbackTo,

      showModify,
      resetOk,
      setValue,
      a1FormState,
      a1FormRef,
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
      filterOption,
      cancelSetValue,
    };
  },
});
</script>
<style lang="scss" scoped>
.issue__container {
  padding: 0 20px;
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
  justify-content: space-around;

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
.doneTask__container {
  padding: 0 20px;
}
</style>
