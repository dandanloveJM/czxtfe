<template>
  <div class="doneTask__container">

    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.processId"
        >
          <template #type="{ record }">
            <span>{{ TYPE_MAP[record.type] }}</span>
          </template>
          <template #totalPercentage="{ record }">
          <span>{{ record.totalPercentage + "%" }}</span>
        </template>
          <template #products="{ record }">
            <a @click="() => showProducts(record.products)"
              >点击查看团队成员产值详情</a
            >
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>
    <Modal
      title="查看团队成员产值详情"
      v-model:visible="visible"
      @ok="productsOk"
    >
      <a-table
        :columns="productColumns"
        :data-source="state.products"
        :rowKey="(record) => record.id"
      >
        <template #percentage="{ record }">
          <span>{{ record.percentage + "%" }}</span>
        </template>
      </a-table>
    </Modal>
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
} from "vue";
import { typeMap } from "@/utils/config";
import { getR3AllList } from "@/api/display";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";

export default defineComponent({
  name: "el_done",
  components: {
    aIcon, Modal, antModal
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      products: [],
    });
    const visible = ref<boolean>(false);

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
        title: "完成时间",
        dataIndex: "updatedAt",
        key: "updatedAt",
      },
      {
        title: "任务总产值",
        dataIndex: "totalProduct",
        key: "totalProduct",
      },
      {
        title: "完成比例",
        slots: { customRender: "totalPercentage" },
        key: "totalPercentage",
      },
      {
        title: "查看团队成员产值情况",
        slots: { customRender: "products" },
        key: "products",
      },
    ];

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
      {
        title: "承担产值",
        dataIndex: "product",
        key: "product",
      },
    ];

    const fetchData = async () => {
      const data = await getR3AllList().then(
        (response) => response.data.data.finished
      );
      if (data.length === 0) {
        state.taskList = [];
      }

      state.taskList = data;
    };

    onMounted(() => {
      watchEffect(() => {
        fetchData();
      });
    });

    const showProducts = (products) => {
      // 1.打开Modal 2.存数据
      visible.value = true;
      state.products = products;
    };
    const productsOk = () => {
      // 1.关闭modal, 2. 清空state.products
      visible.value = false;
      state.products = [];
    };

    return {
      TYPE_MAP,
      state,
      columns,
      productColumns,
      productsOk,
      showProducts,
      visible,
    };
  },
});
</script>
<style lang="scss" scoped></style>
