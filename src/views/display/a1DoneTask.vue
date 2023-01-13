<template>
  <div class="doneTask__container">
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
          :rowKey="(record) => record.name"
          :loading="tableLoading"
          :pagination="false"
        >
          <template #type="{ record }">
            <span>{{ TYPE_MAP[record.type] || '' }}</span>
          </template>
          <template #updatedAt="{ record }">
            <span v-if="record.name != '合计'">{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #totalPercentage="{ record }">
            <a-tag v-if="record.name != '合计' && record.totalPercentage < 100" color="warning">
              {{
                (record.totalPercentage + "%") || ''
              }}
            </a-tag>
            <span
              v-else-if="record.name != '合计' && record.totalPercentage == 100"
            >{{ record.totalPercentage + "%" }}</span>
          </template>
          <template #attachment="{ record }">
            <a-button v-if="record.name != '合计'" @click="() => showImg(record.attachment)">查看任务书</a-button>
          </template>
          <template #products="{ record }">
            <a-button v-if="record.name != '合计'" @click="() => showProducts(record.products)">查看产值</a-button>
          </template>
          <template #action="{ record }">
            <a-button v-if="record.name != '合计'" @click="() => modifyProducts(record)">修改总产值及比例</a-button>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
    </div>

    <div v-drag-modal>
      <a-modal
        title="查看团队成员产值详情"
        v-model:visible="visible"
        width="1000px"
        :destroyOnClose="true"
        @ok="productsOk"
      >
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
      </a-modal>
    </div>

    <div v-drag-modal>
      <a-modal
        title="修改项目的总产值及完成比例"
        v-model:visible="showModify"
        @ok="resetOk"
        width="600px"
        :destroyOnClose="true"
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
            />
            <span>填写0-100的正整数</span>
          </a-form-item>
        </a-form>
      </a-modal>
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
} from "vue";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";
import { getA1FinishedData,  a1ModifyProduct } from "@/api/display";
import Modal from "@/components/tableLayout/modal.vue";
import { message, Modal as antModal } from "ant-design-vue";
import dayjs from "dayjs";
import SelectTypes from "ant-design-vue/es/select";
import type { Dayjs } from 'dayjs';

interface A1FormState {
  total: number;
  ratio: number;
}

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
  startDate: string;
  endDate:string;
  range: Dayjs;
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
      previewURL: "",
    });
    const visible = ref<boolean>(false);
    const showModify = ref<boolean>(false);
    const showPreview = ref<boolean>(false);
    const a1FormRef = ref();
    const a1FormState: UnwrapRef<A1FormState> = reactive({
      total: 0,
      ratio: 100,
    });
    const tableLoading = ref<boolean>(false);

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
        // defaultSortOrder: "descend",
        sorter: (a, b) => a.totalProduct - b.totalProduct,
      },
      {
        title: "完成比例",
        slots: { customRender: "totalPercentage" },
        key: "totalPercentage",
        // defaultSortOrder: "descend",
        sorter: (a, b) => a.totalPercentage - b.totalPercentage,
      },
      {
        title: "查看附件",
        slots: { customRender: "attachment" },
        key: "attachment",
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

    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string,
      startDate: string,
      endDate:string
    ) => {
      const data = await getA1FinishedData(name, number, type, year, startDate, endDate).then(
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

    onMounted(() => {
      fetchData("", "","", ""+dayjs().year(), "","");
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

    const modifyProducts = (record) => {
      showModify.value = true;
      state.currentProcessId = record.processId;
      Object.assign(a1FormState, { total: record.totalProduct, ratio: record.totalPercentage });


    };
    const resetOk = () => {
      // 1. 拼接参数 ，发请求，1.关闭modal, 2. 清空state.products
      const params = {};
      const a1FormState2 = toRaw(a1FormState);
      params["processId"] = state.currentProcessId;
      params["total"] = a1FormState2.total;
      params["ratio"] = a1FormState2.ratio;

      Object.assign(a1FormState, { total: 0, ratio: 100 });
      showModify.value = false;

      a1ModifyProduct(params)
        .then((response) => {
          message.success("产值及比例修改成功");
          fetchData("", "","", ""+dayjs().year(), "","");

          state.currentProcessId = "";
        })
        .catch((err) => {
          console.log(err);
          message.error("程序异常");
        });
    };

    const changeTime = (time) => {
      return dayjs(time).add(8, "hours").format('YYYY年MM月DD日 HH:mm');
    };
    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "" + dayjs().year(),
      range: null,
      startDate: "",
      endDate: ""
    });
    const typeOptions = TYPE_OPTIONS;

    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );


    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);

      console.log("我看看参数");
      console.log(formData);


      tableLoading.value = true;

      fetchData(formData.name, formData.number, formData.type, formData.year,formData.startDate, formData.endDate);


    };

    const options1 = ref<typeof SelectTypes["options"]>([
      {
        value: "" + (dayjs().year() - 1),
        label: "" + (dayjs().year() - 1),
      },
      {
        value: "" + dayjs().year(),
        label: "" + dayjs().year(),
      },
      {
        value: "" + (dayjs().year() + 1),
        label: "" + (dayjs().year() + 1),
      },

      {
        value: "" + (dayjs().year() + 2),
        label: "" + (dayjs().year() + 2),
      },
    ]);

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const cancelSetValue = () => {
      Object.assign(a1FormState, { total: 0, ratio: 100 });
    };

    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };

     const onChangeRangePicker = (value, dateString)=>{
     
      filterFormState.startDate=dateString.slice(0,1).toString()
      filterFormState.endDate=dateString.slice(1,2).toString()
    }

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

      filterFormState,
      tableLoading,
      searchFilters,
      typeOptions,
      wrapperCol: { span: 14, offset: 4 },
      options1,
      filterOption,
      cancelSetValue,
      showImg,
      showPreview,
      onChangeRangePicker
    };
  },
});
</script>
<style lang="scss" scoped>
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
