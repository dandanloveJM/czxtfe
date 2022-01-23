<template>
  <div class="issue__container">
    <!-- <ul>
      <li v-for="item of state.taskList" :key="item.id">
        <span>{{item.name}}</span>
        <span>{{item.processId}}</span>
        </li>
    </ul> -->
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length>0">
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
          <template #type="{record}">
            <span>{{typeMap[record.type]}}</span>
          </template>
          <template #attachment="{record}">
            <a :href="record.attachment">点击查看附件</a>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty/>
      </div>
    </div>

    <Modal
      ref="addModal"
      title="填写产值比例建议"
      @ok="addSubmit"
      v-model:visible="visible"
      :confirm-loading="confirmLoading"
    >
      <a-form>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
        <a-form-item> 成员：<a-select /> 产值比例: <a-input /> </a-form-item>
      </a-form>
    </Modal>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from "vue";
import aIcon from "@/components/aicon/aicon.vue";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import { getR1UnfinishedList } from "@/api/display";



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
    slots: {customRender: "type"},
    key: "type",
  },
  {
    title: "项目长",
    dataIndex: "ownerName",
    key: "ownerName",
  },
  {
    title: "附件",
    slots: {customRender: "attachment"},
    key: "attachment",
  },

  {
    title: "操作",
    key: "action",
    slots: { customRender: "action" },
  },
];


export default defineComponent({
  name: "issue",
  components: {
    aIcon,
    Modal,
  },
  data() {
    return {
      // data,
      columns,
    };
  },
  setup(props, context) {
    const addModal = ref();
    const visible = ref<boolean>(false);
    const confirmLoading = ref<boolean>(false);
    const state = reactive({
      taskList: [],
    });

    onMounted(async () => {
      const data = await getR1UnfinishedList(20).then(
        (response) => response.data.data
      );
      console.dir(data);
      state.taskList = data;
    });

    // 点击表单添加按钮
    const addAdvice = () => {
      visible.value = true;
    };

    const addSubmit = (e: MouseEvent) => {
      visible.value = false;
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



    return {typeMap, state, confirmLoading, visible, addModal, addAdvice, addSubmit };
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
</style>
