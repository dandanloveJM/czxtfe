<template>
  <div class="doneTask__container">
    <div class="filters-wrapper">
      <div class="search-filter-wrapper">
        <a-form ref="filter-form" :model="filterFormState" layout="inline">
          <a-form-item name="team" label="筛选团队">
            <a-select
              v-model:value="filterFormState.team"
              :options="teamOptions"
              style="width: 120px"
              :allowClear="true"
            />
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
          :rowKey="(record) => record.displayName"
          :loading="tableLoading"
          :pagination="false"
        >
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
import { typeMap, teamMap, TEAMS_OPTIONS } from "@/utils/config";
import { getAllUserRank } from "@/api/display";
import { debounce } from "lodash-es";
import { CalendarTwoTone } from "@ant-design/icons-vue";
import { SelectTypes } from "ant-design-vue/es/select";

interface filterFormState {
  team: string;
  year: string;
}

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
    CalendarTwoTone,
  },
  setup() {
    const TYPE_MAP = typeMap;
    const state = reactive({
      taskList: [],
    });
    const tableLoading = ref<boolean>(false);

    const columns = [
      {
        title: "排名",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "姓名",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "产值",
        dataIndex: "productSum",
        key: "productSum",
      },
      {
        title: "部门",
        dataIndex: "team",
        key: "team",
      },
    ];

    const fetchData = async (year: string, team: string) => {
      const data = await getAllUserRank(year, team).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });

      if (data.length === 0) {
        state.taskList = [];
      }
      state.taskList = data;
    };

    onMounted(() => {
      fetchData("2022", "");
      // watchEffect(() => {
      //   fetchData(2022);
      // });
    });

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

    const handleChange = (value: string) => {
      const year = Number(value);
      console.log(value);
      tableLoading.value = true;
      // fetchData(year);
    };

    const teamOptions = TEAMS_OPTIONS;

    const filterOption = (input: string, option: any) => {
      return option.label.indexOf(input) >= 0;
    };

    const createFilterFormState = () => ({
      team: "",
      year: "2022",
    });

    const filterFormState: UnwrapRef<filterFormState> = reactive(
      createFilterFormState()
    );

    const searchFilters = () => {
      // 拿到filterFormState数据，拼接参数, 发送fetchData请求, 设置loading
      const formData = toRaw(filterFormState);
      const values = Object.values(formData);
      console.log("我看看参数");
      console.log(values);
      tableLoading.value = true;
      if (values[0] == undefined) {
        values[0] = "";
      }

      if (values.length == 2) {
        fetchData(values[1], values[0]);
      }
    };

    return {
      state,
      columns,
      value1: ref("2022"),
      options1,
      handleChange,
      tableLoading,
      teamOptions,
      filterOption,
      filterFormState,
      searchFilters,
      wrapperCol: { span: 14, offset: 4 },
    };
  },
});
</script>
<style lang="scss" scoped>
.doneTask__container {
  padding: 20px;
}
.table-wrapper {
  margin-top: 20px;
}
</style>
