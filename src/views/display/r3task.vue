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

          <template #check="{ record }">
            <span v-if="record.activityName === 'R3审核'">
              <a-tag color="warning">
                <template #icon>
                  <exclamation-circle-outlined />
                </template>
                待审核
              </a-tag>
            </span>
            <span v-else-if="record.activityName === 'R2/R1填写产值分配建议'">
              <a-tag color="blue">
                <template #icon>
                  <exclamation-circle-outlined />
                </template>
                待分配产值
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
            <span v-if="record.activityName === 'R2/R1填写产值分配建议' && record.pmId === userId">
              <a-button @click="() => addAdvice(record.processId, record.taskId)">产值分配</a-button>
              <a-divider type="vertical" />
            </span>

            <span v-if="record.activityName === 'R3审核'">
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
        :footer="null"
        :destroyOnClose="true"
      >
        <img :src="state.previewURL" style="max-width: 1100px" />
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        ref="addModal"
        title="填写产值比例建议"
        v-model:visible="visible"
        :confirm-loading="confirmLoading"
        @ok="onSubmitForm"
        @cancel="onCancel"
        width="1000px"
        :destroyOnClose="true"
        :maskClosable="false"
      >
        <template #footer>
          <a-button key="back" @click="handleCancel">暂存并关闭</a-button>
          <a-button
            key="submit"
            type="primary"
            :loading="confirmLoading"
            @click="onSubmitForm"
          >确认并发送</a-button>
        </template>
        <a-form ref="formRef" :model="dynamicForm" :label-col="labelCol">
          <div class="line-wrapper" v-for="(record, index) in dynamicForm.records" :key="index">
            <a-form-item :label="record.peopleLabel" style="min-width: 45%" name="peopleValue">
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
              <a-input-number
                v-model:value="record.productValue"
                :formatter="(value) => `${value}%`"
                :parser="(value) => value.replace('%', '')"
                :max="100"
                :min="0"
              />
            </a-form-item>
            <a-button
              danger
              v-if="dynamicForm.records.length > 1"
              class="dynamic-delete-button"
              :disabled="dynamicForm.records.length === 1"
              @click="removeRecord(record)"
            >删除</a-button>
          </div>
          <div class="product_sum_calculator">
            <div style="min-width: 45%"></div>
            <div style="min-width: 35%">
              <CalculatorTwoTone />
              当前产值比例总和: {{ adviceProductSum }}
            </div>
          </div>
          <a-form-item>
            <a-button type="dashed" class="add-record-button" @click="addRecord" size="large">
              <PlusOutlined />点击增加项目成员
            </a-button>
          </a-form-item>
        </a-form>
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

    <div v-drag-modal>
      <a-modal
        title="审核流程"
        v-model:visible="showCheck"
        width="1200px"
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
          <div class="check-form-label">
            <a-form-item name="comment" label="审批意见" class="label-style">
              <a-input v-model:value="commentForm.comment" />
            </a-form-item>
          </div>
        </a-form>

        <div class="button-wrapper">
          <div class="reject-button">
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
  computed,
} from "vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import SelectTypes from "ant-design-vue/es/select";
import aIcon from "@/components/aicon/aicon.vue";
import {
  MinusCircleOutlined,
  PlusOutlined,
  AppstoreTwoTone,
  CrownTwoTone,
  EditTwoTone,
  CalculatorTwoTone,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message } from "ant-design-vue";
import {
  getR3UnfinishedList,
  getAllR1R2R3Users,
  fillOutputValue,
  checkHistoryRequest,
  rollbackRequest,
  r3Approve,
} from "@/api/display";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
// import moment from "moment";
import dayjs from "dayjs";
import localStorageStore from "@/utils/localStorageStore";
import localCache from "@/utils/localCache";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

const filterDict = {
  '待审核': ['R3审核'],
  '已审核': ['R4审核', 'A1填写产值'],
  '待分配产值': ['R2/R1填写产值分配建议']
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
      {
        text: '待分配产值',
        value: '待分配产值',
      },
    ],
    filterMultiple: false,
    onFilter: (value: string, record) => {
      console.log('-----filter')
      console.log(filterDict[value])
      console.log(record.activityName)
      console.log(filterDict[value].indexOf(record.activityName) === 0)
      return filterDict[value].indexOf(record.activityName) === 0
      // if (record.activityName === 'R3审核') {
      //   return value === "待审核"
      // } else if (record.activityName === 'R2/R1填写产值分配建议') {
      //   return value === '待分配产值'
      // }
      // else {
      //   return value === "已审核"
      // }
    },
  },
  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
  },
];


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
    CalculatorTwoTone,
    CheckCircleOutlined,
    ExclamationCircleOutlined
  },
  data() {
    return {
      columns,
      typeMap,
    };
  },

  setup() {
    const addModal = ref();
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const showHistory = ref<boolean>(false);
    const historyLoading = ref<boolean>(false);
    const showRollback = ref<boolean>(false);
    const confirmLoading2 = ref<boolean>(false);
    const showNewProject = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const showCheck = ref<boolean>(false);
    const tableLoading = ref<boolean>(false);
    const state = reactive({
      taskList: [],
      candidates: [],
      userIdToNameMap: {},
      processId: "",
      taskId: "",
      historyData: [],
      currentRollbackRecord: {},
      checkRecord: {},
      checkProcessId: "",
      checkTaskId: "",
      products: [],
      previewURL: "",
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

    const typeOptions = TYPE_OPTIONS;
    console.log("typeOptions");
    console.dir(typeOptions);

    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string
    ) => {
      const data = await getR3UnfinishedList(name, number, type, year).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
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
      fetchData("", "", "", "2022");
    });

    // 点击表单添加按钮
    const addAdvice = (processId: string, taskId: string) => {
      visible.value = true;
      state.processId = processId;
      state.taskId = taskId;
      dynamicForm.records = localStorageStore.getCache(processId) || [
        {
          peopleLabel: "项目成员",
          peopleValue: "",
          productLabel: "建议产值比例",
          productValue: 100,
        },
      ];
    };

    const addSubmit = () => {
      visible.value = false;
    };

    const checkForDuplicates = (array) => {
      return new Set(array).size !== array.length;
    };

    const onSubmitForm = () => {
      // visible.value = false;
      const records = toRaw(dynamicForm).records;
      let sum = 0;
      const peoples = records.map((item) => item.peopleValue);
      const isDuplicates = checkForDuplicates(peoples);
      let isError = 0;
      if (isDuplicates) {
        isError += 1;
        message.error("项目成员不可以相同");
        return;
      }
      records.forEach((element) => {
        if (element.peopleValue === "") {
          message.error("请选择一位项目成员");
          isError += 1;
          return;
        } else if (
          !element.productValue ||
          element.productValue < 0 ||
          element.productValue > 100 ||
          !Number.isInteger(element.productValue)
        ) {
          isError += 1;
          message.error("产值比例建议填写错误,需要为0到100的正整数");
          return;
        } else {
          sum += element.productValue;
        }
      });

      if (sum !== 100) {
        console.log(sum);
        isError += 1;
        message.error("所有成员的产值比例之和必须刚好是100");
        return;
      }

      if (isError === 0) {
        message.success("填写成功，正在上传数据中");
        // TODO 构造参数 发送请求
        confirmLoading.value = true;

        let params = buildParam(
          toRaw(state.candidates),
          records,
          state.processId,
          state.taskId
        );

        fillOutputValue(params)
          .then((response) => {
            confirmLoading.value = false;
            //  删除缓存
            localStorageStore.deleteCache(state.processId);
            if (response.data.status === "ok") {
              visible.value = false;
              message.success("数据上传成功");
              fetchData("", "", "", "2022");
            } else {
              message.error(response.data.msg);
            }
          })
          .catch(() => {
            confirmLoading.value = false;
            message.error("程序异常");
          });
      }
      console.log("submit!", toRaw(dynamicForm));
    };

    const buildParam = (candidates, records, processId, taskId) => {
      const param = {};
      param["processId"] = processId;
      param["taskId"] = taskId;

      const data = records.map((item) => {
        let temp = {};
        temp["userId"] = "" + item.peopleValue;
        temp["percentage"] = "" + item.productValue;
        temp["displayName"] = toRaw(state.userIdToNameMap)[item.peopleValue];
        return temp;
      });
      param["data"] = JSON.stringify(data);
      return param;
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
        .catch(() => {
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
        .then(() => {
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

      state.products = record.products;
      state.checkRecord = record;
      state.checkProcessId = record.processId;
      state.checkTaskId = record.taskId;
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
        .then(() => {
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

    const agreeTo = () => {
      const params = {};
      params["processId"] = state.checkProcessId;
      params["taskId"] = state.checkTaskId;
      params["comment"] = toRaw(commentForm).comment || "";

      console.log("参数");
      console.log(params);

      r3Approve(params)
        .then(() => {
          message.success("审核通过成功");
          fetchData("", "", "", "2022");

          showCheck.value = false;
          state.checkProcessId = "";
          state.checkTaskId = "";
          commentForm.comment = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    };
    const changeTime = (time) => {
      return dayjs(time).add(8, "hours").format('YYYY年MM月DD日 HH:mm');
    };
    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };

    const handleCancel = () => {
      localStorageStore.setCache(state.processId, dynamicForm.records);
      visible.value = false;
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

    const adviceProductSum = computed(() => {
      const value = dynamicForm.records.reduce((accumulator, currentItem) => {
        return accumulator + currentItem.productValue;
      }, 0);
      console.log("value22");
      console.log(value);
      return value;
    });

    return {
      labelCol: { style: { width: "150px", textAlign: "center" } },
      state,
      confirmLoading,
      visible,
      addModal,
      addAdvice,
      addSubmit,
      onSubmitForm,
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
      showPreview,
      showImg,
      handleCancel,
      columnsWithoutOperation,
      activeKey: ref("1"),
      labelColOfCheck: { style: { fontSize: "18px" } },

      filterFormState,
      tableLoading,
      searchFilters,

      wrapperCol: { span: 14, offset: 4 },
      options1,
      adviceProductSum,
      userId: localCache.getCache("setInfo")['id']
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
.product_sum_calculator {
  display: flex;
  justify-content: center;
  font-size: 18px;
}
</style>
