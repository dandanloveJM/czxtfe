<template>
  <div class="doneTask__container">
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <header class="header-wrapper">
          <CalendarTwoTone />
          <span>按年度筛选：</span>
          <a-select
            ref="select"
            v-model:value="value1"
            style="width: 120px"
            :options="options1"
            @change="handleChange"
          >
          </a-select>
        </header>

        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.rankId"
          :loading="tableLoading"
        >
          <template #team="{ record }">
            <span>{{ TEAM_MAP[record.team] }}</span>
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
import { teamMap } from "@/utils/config";
import { getTeamRank } from "@/api/display";
import { CalendarTwoTone } from "@ant-design/icons-vue";
import { SelectTypes } from "ant-design-vue/es/select";

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
    CalendarTwoTone,
  },
  setup() {
    const TEAM_MAP = teamMap;
    const state = reactive({
      taskList: [],
    });
    const tableLoading = ref<boolean>(false);

    const columns = [
      {
        title: "排名",
        dataIndex: "rankId",
        key: "rankId",
      },
      {
        title: "部门",
        slots: { customRender: "team" },
        key: "team",
      },
      {
        title: "产值",
        dataIndex: "allBonus",
        key: "allBonus",
      },
    ];

    const fetchData = async (year: number) => {
      const data = await getTeamRank(year).then((response) => {
        tableLoading.value = false;
        return response.data.data;
      });
      if (data.length === 0) {
        state.taskList = [];
      }

      state.taskList = data;
    };

    onMounted(() => {
      fetchData(2022);
      // watchEffect(() => {

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
      fetchData(year);
    };

    return {
      state,
      columns,
      TEAM_MAP,
      value1: ref("2022"),
      options1,
      handleChange,
      tableLoading,
    };
  },
});
</script>
<style lang="scss" scoped>
.table-wrapper {
  padding: 20px;
  .header-wrapper {
    font-size: 20px;
    line-height: 1.5;
    margin-bottom: 30px;
  }
}
</style>
