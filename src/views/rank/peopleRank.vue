<template>
  <div class="doneTask__container">
    <div class="table-wrapper">
      <div class="tableWithData" v-if="state.taskList.length > 0">
        <a-table
          :columns="columns"
          :data-source="state.taskList"
          :rowKey="(record) => record.rankId"
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
import { typeMap } from "@/utils/config";
import { getAllUserRank } from "@/api/display";

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
  },
  setup() {
    const TYPE_MAP = typeMap;
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
        title: "姓名",
        dataIndex: "displayName",
        key: "displayName",
      },
      {
        title: "产值",
        dataIndex: "product",
        key: "product",
      },
    ];

    const fetchData = async () => {
      const data = await getAllUserRank().then(
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
    };
  },
});
</script>
<style lang="scss" scoped></style>
