<template>
  <div class="issue__container">
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.processId"
        >
          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #action="{ record }">
            <span v-if="record.activityName === 'R4审核'">
              <a
                @click="
                  () => check(record.processId, record.taskId, record.products)
                "
                >点击审核</a
              >
              <a-divider type="vertical" />
            </span>

            <span>
              <a @click="() => checkHistory(record.processId)">
                查看当前流程情况
              </a>
            </span>
          </template>
          <template #type="{ record }">
            <span>{{ typeMap[record.type] }}</span>
          </template>
          <template #attachment="{ record }">
            <a :href="record.attachment">点击查看附件</a>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <Modal
      ref="addModal"
      title="填写产值比例建议"
      @ok="onSubmitForm"
      @cancel="onCancel"
      v-model:visible="visible"
      :confirm-loading="confirmLoading"
    >
      <a-form ref="formRef" :model="dynamicForm" :label-col="labelCol">
        <div
          class="line-wrapper"
          v-for="(record, index) in dynamicForm.records"
          :key="index"
        >
          <a-form-item
            :label="record.peopleLabel"
            style="min-width: 45%"
            name="peopleValue"
          >
            <a-select
              v-model:value="record.peopleValue"
              show-search
              :options="state.candidates"
              :filterOption="filterOption"
            />
          </a-form-item>
          <a-form-item
            name="productValue"
            ref="productValue"
            :label="record.productLabel"
            style="min-width: 35%"
          >
            <a-input-number v-model:value="record.productValue" />
          </a-form-item>
          <a-button
            danger
            v-if="dynamicForm.records.length > 1"
            class="dynamic-delete-button"
            :disabled="dynamicForm.records.length === 1"
            @click="removeRecord(record)"
          >
            删除
          </a-button>
        </div>
        <a-form-item>
          <a-button
            type="dashed"
            class="add-record-button"
            @click="addRecord"
            size="large"
          >
            <PlusOutlined />
            点击增加项目成员
          </a-button>
        </a-form-item>
      </a-form>
    </Modal>

    <Modal
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
    </Modal>

    <Modal title="审核流程" v-model:visible="showCheck" :footer="null">
      <a-table
        :columns="productColumns"
        :data-source="state.products"
        :rowKey="(record) => record.id"
      >
        <template #percentage="{ record }">
          <span>{{ record.percentage + "%" }}</span>
        </template>
      </a-table>

      <a-form ref="formRef2" :model="commentForm">
        <a-form-item name="comment" label="审批意见">
          <a-input v-model:value="commentForm.comment" />
        </a-form-item>
      </a-form>

      <div class="button-wrapper">
        <div class="reject-button">
          <a-button @click="() => rollbackTo('R3check')"
            >退回，室主任重新审核</a-button
          >
          <a-button @click="() => rollbackTo('fillNumbers')"
            >退回，重新填写产值比例</a-button
          >
          <a-button @click="() => rollbackTo('uploadTask')"
            >退回，重新上传任务</a-button
          >
        </div>
        <div class="agree">
          <a-button @click="() => agreeTo()" type="primary">审核通过</a-button>
        </div>
      </div>
    </Modal>
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
import { SelectTypes } from "ant-design-vue/es/select";
import aIcon from "@/components/aicon/aicon.vue";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import {
  getR4AllList,
  getAllR1R2R3Users,
  fillOutputValue,
  checkHistoryRequest,
  rollbackRequest,
  startProcess,
  generateNewProject,
  r4Approve,
} from "@/api/display";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import moment from "moment";
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

    const fetchData = async () => {
      const data = await getR4AllList().then(
        (response) => response.data.data.unfinished
      );

      state.taskList = data;
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
      watchEffect(() => {
        fetchData();
      });
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

    const addRecord = () => {
      dynamicForm.records.push({
        peopleLabel: "项目成员",
        peopleValue: "",
        productLabel: "建议产值比例",
        productValue: 100,
      });
    };

    const removeRecord = (item: PeopleAndProductRecord) => {
      let index = dynamicForm.records.indexOf(item);
      if (index !== -1) {
        dynamicForm.records.splice(index, 1);
      }
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
          antModal.error({
            title: "程序异常",
          });
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
          antModal.success({
            title: "退回成功",
          });
          confirmLoading2.value = false;
          fetchData();

          showRollback.value = false;
        })
        .catch((err) => {
          console.log(err);
          confirmLoading2.value = false;
          antModal.error({
            title: "程序异常",
          });
        });
    };

    const check = (processId, taskId, products) => {
      showCheck.value = true;

      state.products = products;
      state.checkProcessId = processId;
      state.checkTaskId = taskId;
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
          antModal.success({
            title: "退回成功",
          });
          fetchData();

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          antModal.error({
            title: "程序异常",
          });
        });
    };

    const agreeTo = () => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["comment"] = toRaw(commentForm).comment || "";

      commentForm.comment = "";

      r4Approve(params)
        .then((response) => {
          antModal.success({
            title: "审核通过成功",
          });
          fetchData();

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
        })
        .catch((err) => {
          console.log(err);
          antModal.error({
            title: "程序异常",
          });
        });
    };
    const changeTime = (time) => {
      return moment(time).add(8, "hours").format("lll");
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
      addRecord,
      removeRecord,
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
      agreeTo,
      changeTime,
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
  justify-content: space-around;

  .reject-button .ant-btn {
    margin-right: 20px;
  }
}
</style>
