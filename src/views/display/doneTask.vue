<template>
  <div class="doneTask__container">
    <div class="filters-wrapper">
      <div class="search-filter-wrapper">
        <a-input-search
          v-model:value="searchValue"
          placeholder="搜索项目名称"
          enter-button="搜索"
          size="large"
          @search="onSearch"
        />
      </div>
    </div>
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
          <template #percentage="{ record }">
            <span>{{ record.percentage + "%" }}</span>
          </template>
        </a-table>
      </div>
      <div class="emptyTable" v-else>
        <a-empty />
      </div>
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
  watchEffect,
} from "vue";
import { typeMap } from "@/utils/config";
import { getR1FinishedList } from "@/api/display";
import moment from "moment";
import { SearchOutlined } from "@ant-design/icons-vue";

export default defineComponent({
  name: "el_done",
  components: {
    aIcon,
    SearchOutlined,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
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
        title: "我的比例",
        slots: { customRender: "percentage" },
        key: "percentage",
      },
      {
        title: "我的产值",
        dataIndex: "product",
        key: "product",
      },
    ];

    const fetchData = async (query: string) => {
      const data = await getR1FinishedList(query, 2022).then(
        (response) => response.data.data
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
      fetchData("");
    });

    const searchValue = ref<string>("");
    const onSearch = (searchValue: string) => {
      console.log("use value", searchValue);
      fetchData(searchValue);
    };
    return {
      TYPE_MAP,
      state,
      columns,
      changeTime,
       searchValue,
      onSearch,
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

  .search-filter-wrapper {
  width: 300px;
}

}
</style>
