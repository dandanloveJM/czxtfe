// @ts-nocheck
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
          <template #type="{ record }">
            <span>{{ TYPE_MAP[record.type] }}</span>
          </template>
          <template #updatedAt="{ record }">
            <span>{{ changeTime(record.updatedAt) }}</span>
          </template>
          <template #totalPercentage="{ record }">
            <span>{{ record.totalPercentage + "%" }}</span>
          </template>
          <template #percentage="{ record }">
            <span>{{ record.percentage + "%" }}</span>
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
      width="1200px"
      :footer="null"
    >
      <img :src="state.previewURL" style="max-width: 1100px" />
    </a-modal>
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
import { getR1FinishedList } from "@/api/display";
import moment from "moment";
import { SearchOutlined, CalendarTwoTone } from "@ant-design/icons-vue";
import { SelectTypes } from "ant-design-vue/es/select";
import { typeMap, TYPE_OPTIONS } from "@/utils/config";

interface filterFormState {
  name: string;
  number: string;
  type: string;
  year: string;
}

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    SearchOutlined,
    CalendarTwoTone,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
      previewURL: "",
    });
    const tableLoading = ref<boolean>(false);
    const showPreview = ref<boolean>(false);

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

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
        title: "我的比例",
        slots: { customRender: "percentage" },
        key: "percentage",
      },
      {
        title: "查看附件(点击可放大)",
        slots: { customRender: "attachment" },
        key: "attachment",
      },
      {
        title: "我的产值",
        dataIndex: "product",
        key: "product",
      },
    ];
    const createFilterFormState = () => ({
      name: "",
      number: "",
      type: "",
      year: "2022",
    });
    const typeOptions = TYPE_OPTIONS;

    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );

    const fetchData = async (
      name: string,
      number: string,
      type: string,
      year: string
    ) => {
      const data = await getR1FinishedList(name, number, type, year).then(
        (response) => {
          tableLoading.value = false;
          return response.data.data;
        }
      );
      if (data.length === 0) {
        state.taskList = [];
      }

      const doneTaskList = data.map((item) => {
        let temp = {};
        temp["processId"] = item.processId;
        temp["name"] = item.project.name;
        temp["number"] = item.project.number;
        temp["type"] = item.project.type;
        temp["updatedAt"] = item.updatedAt;
        temp["totalProduct"] = item.project.totalProduct;
        temp["totalPercentage"] = item.project.totalPercentage;
        temp["percentage"] = item.percentage;
        temp["product"] = item.product;
        return temp;
      });

      state.taskList = doneTaskList;
    };

    const changeTime = (time) => {
      return moment(time).add(8, "hours").format("lll");
    };

    onMounted(() => {
      fetchData("", "", "", "2022");
    });

    const searchValue = ref<string>("");

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

    const showImg = (srcURL) => {
      showPreview.value = true;
      state.previewURL = srcURL;
    };

    return {
      TYPE_MAP,
      state,
      columns,
      changeTime,
      searchValue,

      tableLoading,

      options1,
      typeOptions,
      searchFilters,
      filterFormState,
      wrapperCol: { span: 14, offset: 4 },
      filterOption,
      showImg,
      showPreview,
    };
  },
});
</script>
<style lang="scss" scoped>
.doneTask__container {
  padding: 20px;
}
.filters-wrapper {
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
</style>
