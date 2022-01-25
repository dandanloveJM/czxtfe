<template>
  <div class="doneTask__container">
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.rankId"
        >

          <template #teamRank="{ record }">
            <span>{{ TEAM_MAP[record.teamRank] }}</span>
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

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
  },
  setup() {
    const TEAM_MAP = teamMap;
    const state = reactive({
      taskList: [],
    });

    const columns = [
      {
        title: "排名",
        dataIndex: "rankId",
        key: "rankId",
      },
      {
        title: "部门",
         slots: { customRender: "teamRank" },
        key: "teamRank",
      },
      {
        title: "产值",
        dataIndex: "productSum",
        key: "productSum",
      },
    ];

    const fetchData = async () => {
      const data = await getTeamRank().then(
        (response) => response.data.data
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

    return {
      state,
      columns,
      TEAM_MAP,
    };
  },
});
</script>
<style lang="scss" scoped></style>
