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
          <template #action="">
            <span>
              <a @click="addAdvice">点击上传产值比例建议</a>
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
      <a-form :model="formState" :label-col="labelCol">
        <div class="line-wrapper">
          <a-form-item label="成员" style="width: 45%">
            <a-select v-model:value="formState.member1" show-search :options="state.candidates"
            :filterOption="filterOption" />
          </a-form-item>
          <a-form-item label="产值比例" style="width: 45%">
            <a-input-number v-model:value="formState.value1" />
          </a-form-item>
        </div>
        <div class="line-wrapper">
          <a-form-item label="成员" style="width: 45%">
            <a-select v-model:value="formState.member2" />
          </a-form-item>
          <a-form-item label="产值比例" style="width: 45%">
            <a-input v-model:value="formState.value2" />
          </a-form-item>
        </div>
        <div class="line-wrapper">
          <a-form-item label="成员" style="width: 45%">
            <a-select v-model:value="formState.member3" />
          </a-form-item>
          <a-form-item label="产值比例" style="width: 45%">
            <a-input v-model:value="formState.value3" />
          </a-form-item>
        </div>

        <div class="line-wrapper">
          <a-form-item label="成员" style="width: 45%">
            <a-select v-model:value="formState.member4" />
          </a-form-item>
          <a-form-item label="产值比例" style="width: 45%">
            <a-input v-model:value="formState.value4" />
          </a-form-item>
        </div>
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
import aIcon from "@/components/aicon/aicon.vue";
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
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
  },
];

interface Member {
  userId: string;
  displayName: string;
}
interface FormState {
  label1: string;
  member1: string;
  value1: string;
  member2?: string;
  value2?: string;
  member3?: string;
  value3?: string;
  member4?: string;
  value4?: string;
}

export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
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
      candidates: []
    });
    
    const formState: UnwrapRef<FormState> = reactive({
      label1:"",
      member1: "",
      value1: "",
      member2: "",
      value2: "",
      member3: "",
      value3: "",
      member4: "",
      value4: "",
    });

    const fetchData = async () => {
      const data = await getR1UnfinishedList(20).then(
        (response) => response.data.data
      );
     
      state.taskList = data;
    };

    const fetchCandidates = async () => {
      const candidates = await getAllR1R2R3Users().then((response) => response.data.data)
      const options = candidates.map(item => {
        let tmp = {}
        tmp['value'] = item['id']
        tmp['label'] = item['displayName']
        return tmp
      })
      state.candidates = options
      console.log("---allr1r2r3")
      console.dir(state.candidates)

    }
    onMounted(() => {
      fetchCandidates()
      watchEffect(() => {
        fetchData();
      });
    });

    // 点击表单添加按钮
    const addAdvice = () => {
      visible.value = true;
    };

    const addSubmit = (e: MouseEvent) => {
      visible.value = false;
    };

    const onSubmitForm = () => {
      visible.value = false;
      console.log("submit!", toRaw(formState));
    };

    const onCancel = () => {
      visible.value = false;
    }

    const filterOption = (input: string, option: any) => {
      console.log('--input')
      console.log(input)
      console.log(option.value)
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

   

    return {
      labelCol: { style: { width: "150px", textAlign: "center" } },
      formState,
      typeMap,
      state,
      confirmLoading,
      visible,
      addModal,
      addAdvice,
      addSubmit,
      onSubmitForm,
      filterOption,
      onCancel
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
</style>
