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
          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #totalPercentage="{ record }">
            <span>{{ record.totalPercentage + "%" }}</span>
          </template>
          <template #products="{ record }">
            <a @click="() => showProducts(record.products)"
              >点击查看团队成员产值详情</a
            >
          </template>
          <template #action="{ record }">
            <a @click="() => modifyProducts(record.processId)"
              >修改总产值及完成比例</a
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

    <Modal
      title="修改项目的总产值及完成比例"
      v-model:visible="showModify"
      @ok="resetOk"
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
import { getA1Data, a1ModifyProduct } from "@/api/display";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import moment from "moment";

interface A1FormState {
  total: number;
  ratio: number;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    Modal,
    antModal,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      products: [],
      currentProcessId: "",
    });
    const visible = ref<boolean>(false);
    const showModify = ref<boolean>(false);
    const a1FormRef = ref();
    const a1FormState: UnwrapRef<A1FormState> = reactive({
      total: 0,
      ratio: 100,
    });

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
        slots: { customRender: "updatedAt" },
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
      {
        title: "操作",
        key: "action",
        slots: { customRender: "action" },
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
      const data = await getA1Data().then(
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

    const modifyProducts = (processId) => {
      showModify.value = true;
      state.currentProcessId = processId;
    };
    const resetOk = () => {
      // 1. 拼接参数 ，发请求，1.关闭modal, 2. 清空state.products
      const params = {};
      const a1FormState2 = toRaw(a1FormState);
      params["processId"] = state.currentProcessId;
      params["total"] = a1FormState2.total;
      params["ratio"] = a1FormState2.ratio;

      a1ModifyProduct(params)
        .then((response) => {
          antModal.success({
            title: "产值及比例修改成功",
          });
          fetchData();

          showModify.value = false;
          state.currentProcessId = "";
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
      TYPE_MAP,
      state,
      columns,
      productColumns,
      productsOk,
      showProducts,
      visible,
      showModify,
      resetOk,
      modifyProducts,
      a1FormState,
      a1FormRef,
      changeTime,
    };
  },
});
</script>
<style lang="scss" scoped></style>
