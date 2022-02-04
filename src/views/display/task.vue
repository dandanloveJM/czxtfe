<template>
  <div class="issue__container">
    <!-- <ul>
      <li v-for="item of state.taskList" :key="item.id">
        <span>{{item.name}}</span>
        <span>{{item.processId}}</span>
        </li>
    </ul> -->
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.processId"
        >
          <template #action="{ record }">
            <span v-if="record.taskId">
              <a @click="() => addAdvice(record.processId, record.taskId)"
                >点击上传产值比例建议</a
              >
              <a-divider type="vertical" />
              <a @click="() => rollback(record)">退回到上一节点</a>
              <a-divider type="vertical" />
            </span>
            <span>
              <a @click="() => checkHistory(record.processId)"
                >查看当前流程情况</a
              >
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
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>
    <Modal
      title="查看附件原图"
      v-model:visible="showPreview"
      width="1200"
      :footer="null"
    >
      <img :src="state.previewURL" style="max-width: 1100px" />
    </Modal>

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
            <a-input-number
              v-model:value="record.productValue"
              :formatter="(value) => `${value}%`"
              :parser="(value) => value.replace('%', '')"
            />
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

    <Modal
      ref="reject"
      title="退回到上一流程"
      v-model:visible="showRollback"
      @ok="rollbackOk"
      :confirm-loading="confirmLoading2"
    >
      <a-form ref="formRef2" :model="commentForm">
        <a-form-item name="comment" label="审批意见及退回原因">
          <a-input v-model:value="commentForm.comment" />
        </a-form-item>
      </a-form>
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
import aIcon from "@/components/aicon/aicon.vue";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons-vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import {
  getR1UnfinishedList,
  getAllR1R2R3Users,
  fillOutputValue,
  checkHistoryRequest,
  rollbackRequest,
} from "@/api/display";
import { typeMap } from "@/utils/config";
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
export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
    PlusOutlined,
    MinusCircleOutlined,
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
    const showPreview = ref<boolean>(false);
    const state = reactive({
      taskList: [],
      candidates: [],
      userIdToNameMap: {},
      processId: "",
      taskId: "",
      historyData: [],
      currentRollbackRecord: {},
      previewURL: "",
    });
    const commentForm: UnwrapRef<CommentForm> = reactive({
      comment: "",
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

    const fetchData = async () => {
      const data = await getR1UnfinishedList(20).then(
        (response) => response.data.data
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

    const onSubmitForm = () => {
      // visible.value = false;
      const records = toRaw(dynamicForm).records;
      let sum = 0;
      const peoples = records.map((item) => item.peopleValue);
      const isDuplicates = checkForDuplicates(peoples);
      let isError = 0;
      if (isDuplicates) {
        isError += 1;
        antModal.error({
          title: "项目成员不可以相同",
        });
        return;
      }
      records.forEach((element) => {
        if (element.peopleValue === "") {
          antModal.error({
            title: "请选择一位项目成员",
          });
          isError += 1;
          return;
        } else if (
          !element.productValue ||
          element.productValue < 0 ||
          element.productValue > 100 ||
          !Number.isInteger(element.productValue)
        ) {
          isError += 1;
          antModal.error({
            title: "产值比例建议填写错误",
            content: "产值比例建议需要为0到100的正整数",
          });
          return;
        } else {
          sum += element.productValue;
        }
      });

      if (sum !== 100) {
        console.log(sum);
        isError += 1;
        antModal.error({
          title: "所有成员的产值比例之和必须刚好是100",
        });
        return;
      }

      if (isError === 0) {
        antModal.success({
          title: "填写成功，正在上传数据中",
        });
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
            if (response.data.status === "ok") {
              visible.value = false;
              antModal.success({
                title: "数据上传成功",
              });
              fetchData();
            } else {
              antModal.error({
                title: "程序异常",
              });
            }
          })
          .catch((err) => {
            confirmLoading.value = false;
            antModal.error({
              title: "程序异常",
            });
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

    const rollback = (record) => {
      // 打开Modal
      showRollback.value = true;
      // 拼接参数
      const tmp = {};
      tmp["processId"] = record.processId;
      tmp["taskId"] = record.taskId;
      tmp["targetKey"] = "uploadTask";
      tmp["comment"] = "";
      // 存数据到state
      state.currentRollbackRecord = tmp;
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
    // let checkProductValue = async (rule: RuleObject, value: number) => {
    //   console.log("fuck");
    //   console.log(value);
    //   if (!value) {
    //     return Promise.reject("请输入一个0到100的数字");
    //   }
    //   if (!Number.isInteger(value)) {
    //     return Promise.reject("请输入整数");
    //   }
    //   if (value < 0) {
    //     return Promise.reject("请输入正数");
    //   }
    //   if (value > 100) {
    //     return Promise.reject("请输入小于等于100的正整数");
    //   }
    //   return Promise.resolve();
    // };

    // const rules = {
    //   peopleValue: [
    //     {
    //       required: true,
    //       message: "必须选择一位成员",
    //       trigger: "change",
    //     },
    //   ],
    //   productValue: [
    //     {
    //       required: true,
    //       message: "必须填写一个0到100的正整数",
    //       validator: checkProductValue,
    //       trigger: "change",
    //     },
    //   ],
    // };
    const changeTime = (time) => {
      return moment(time).add(8, "hours").format("lll");
    };
    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };
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
      rollback,
      showRollback,
      rollbackOk,
      commentForm,
      confirmLoading2,
      changeTime,
      showPreview,
      showImg,
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
</style>
