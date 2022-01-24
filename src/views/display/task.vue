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
          <template #action="{record}">
            <span>
              <a @click="() => addAdvice(record.processId, record.taskId)"
                >点击上传产值比例建议</a
              >
              <a-divider type="vertical" />
              <a>退回</a>
              <a-divider type="vertical" />
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
import { getR1UnfinishedList, getAllR1R2R3Users } from "@/api/display";

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
    };
  },

  setup(props, context) {
    const addModal = ref();
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const state = reactive({
      taskList: [],
      candidates: [],
      processId:'',
      taskId:''
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
      console.log("---allr1r2r3");
      console.dir(state.candidates);
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
        console.log('看看参数')
        console.log(state.processId)
        console.log(state.taskId)
        visible.value = false;
      }
      console.log("submit!", toRaw(dynamicForm));
    };

    const onCancel = () => {
      visible.value = false;
    };

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const typeMap = {
      "1": "采集设计",
      "2": "科研项目",
      "3": "现场处理",
      "4": "质量评价",
      "5": "资料分析",
      "6": "表层调查",
      "7": "测量质控",
      "8": "技术支持",
      "9": "现场支持",
      "10": "党建工作",
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

    return {
      labelCol: { style: { width: "150px", textAlign: "center" } },
      typeMap,
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
