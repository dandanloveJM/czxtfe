<template>
  <div class="doneTask__container">
    <h2>团队成员产值分布情况</h2>
    <div id="main" style="width: 1250px; height: 400px"></div>
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
import { teamMap, pivotTypeMap } from "@/utils/config";
import { getR2PivotParams } from "@/api/display";
import { CalendarTwoTone } from "@ant-design/icons-vue";
import * as echarts from "echarts";
import localCache from "@/utils/localCache";
import dayjs from "dayjs";

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
    CalendarTwoTone,
  },
  setup() {
    const TEAM_MAP = teamMap;
    const state = reactive({
      pivotParams: {},
    });

    const fetchData = async () => {
      const department = localCache.getCache("setInfo").department;
      const year = dayjs().year()

      const data = await getR2PivotParams(department, year).then((response) => {
        return response.data.data;
      });

      state.pivotParams = data;

      const pivotParams = toRaw(state.pivotParams);
      echartInit(pivotParams);
    };

    const makeSeries = (obj) => {
      const arr = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && key != "users") {
          const temp = {};
          temp["name"] = pivotTypeMap[key];
          temp["type"] = "bar";
          temp["stack"] = "total";
          temp["label"] = {
            show: true,
            formatter: function (params) {
              if (params.value == 0) {
                return "";
              } else {
                return params.value;
              }
            },
          };
          temp["emphasis"] = {
            focus: "series",
          };

          temp["data"] = obj[key].map(Number);
          arr.push(temp);
        }
      }

      return arr;
    };

    const echartInit = (pivotParams) => {
      if (document.getElementById("main").hasAttribute("_echarts_instance_")) {
        document.getElementById("main").removeAttribute("_echarts_instance_");
      }

      const myChart = echarts.init(document.getElementById("main"));
      // 指定图表的配置项和数据

      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            // Use axis to trigger tooltip
            type: "shadow", // 'shadow' as default; can also be 'line' or 'shadow'
          },
        },
        legend: {},
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
        },
        yAxis: {
          type: "category",
          data: pivotParams.users,
        },
        series: makeSeries(pivotParams),
      };

      // 使用刚指定的配置项和数据显示图表。
      myChart.setOption(option);
    };

    onMounted(() => {
      fetchData();
    });

    return {
      state,

      echartInit,
    };
  },
});
</script>
<style lang="scss" scoped>
.doneTask__container {
  padding-left: 20px;
  h2 {
    font-size: 20px;
    font-weight: 600;
  }
}

.pie-charts-wrapper {
  display: flex;
  flex-wrap: wrap;
}
</style>
