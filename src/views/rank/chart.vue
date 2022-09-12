<template>
  <div class="doneTask__container">
    <h2>不同任务类型的总产值及数量分布</h2>
    <div id="main" style="width: 1250px; height: 400px"></div>
    <h2>团队产值分布</h2>
    <div class="pie-charts-wrapper">
      <div class="pie1-wrapper">
        <h2>支持一室</h2>
        <div
          v-show="state.pieChartParams.Z1.length > 0"
          id="pie1"
          style="width: 700px; height: 500px"
        ></div>
        <a-empty
          v-show="state.pieChartParams.Z1.length === 0"
          style="width: 700px; height: 500px"
        ></a-empty>
      </div>
      <div class="pie1-wrapper">
        <h2>支持二室</h2>
        <div
          v-show="state.pieChartParams.Z2.length > 0"
          id="pie2"
          style="width: 700px; height: 500px"
        ></div>
        <a-empty
          v-show="state.pieChartParams.Z2.length === 0"
          style="width: 700px; height: 500px"
        ></a-empty>
      </div>
      <div class="pie1-wrapper">
        <h2>方法一室</h2>
        <div
          v-show="state.pieChartParams.F1.length > 0"
          id="pie3"
          style="width: 700px; height: 500px"
        ></div>
        <a-empty
          v-show="state.pieChartParams.F1.length === 0"
          style="width: 700px; height: 500px"
        ></a-empty>
      </div>
      <div class="pie1-wrapper">
        <h2>方法二室</h2>
        <div
          v-show="state.pieChartParams.F2.length > 0"
          id="pie4"
          style="width: 700px; height: 500px"
        ></div>
        <a-empty
          v-show="state.pieChartParams.F2.length === 0"
          style="width: 700px; height: 500px"
        ></a-empty>
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
import { teamPieCharts, getBarChart, getTeamRank } from "@/api/display";
import { CalendarTwoTone } from "@ant-design/icons-vue";
import * as echarts from "echarts";

export default defineComponent({
  name: "el_user_rank",
  components: {
    aIcon,
    CalendarTwoTone,
  },
  setup() {
    const TEAM_MAP = teamMap;
    const state = reactive({
      pieChartParams: {
        Z1: [],
        Z2: [],
        F1: [],
        F2: [],
      },
      barChartParams: [],
    });

    const localMap = {
      Z1: ["pie1", "支持一室"],
      Z2: ["pie2", "支持二室"],
      F1: ["pie3", "方法一室"],
      F2: ["pie4", "方法二室"],
    };

    const fetchData = async () => {
      const data = await teamPieCharts().then((response) => {
        return response.data.data;
      });

      const rankData = await getTeamRank("2022").then((response) => {
        return response.data.data;
      });

      const localRankMap = {};
      for (const item of rankData) {
        const key = item.team;
        const value = item.allBonus;
        localRankMap[key] = value;

        if (["Z1", "Z2", "F1", "F2"].indexOf(key) >= 0) {
          const teamSum = data[key].reduce((previous, current) => {
            return previous + current.sum;
          }, 0);
          data[key].push({
            name: "其他",
            department: key,
            sum: Math.round(value - teamSum),
          });
        }
      }

      state.pieChartParams = data;

      const pies = toRaw(state.pieChartParams);

      for (let key in pies) {
        if (pies[key].length > 0) {
          // 有数据才画Echarts图
          const arr = pies[key];
          const pieParams = arr.map((item) => {
            const temp = {};
            temp["name"] = item.name;
            temp["value"] = item.sum;
            return temp;
          });
          const total_sum = pieParams.reduce((perviousValue, current) => {
            return perviousValue + current.value;
          }, 0);

          drawPie(
            localMap[key][0],
            localMap[key][1] + "总产值\n" + localRankMap[key],
            pieParams
          );
        }
      }
    };

    const echartInit = (sum, count) => {
      if (document.getElementById("main").hasAttribute("_echarts_instance_")) {
        document.getElementById("main").removeAttribute("_echarts_instance_");
      }

      const myChart = echarts.init(document.getElementById("main"));
      // 指定图表的配置项和数据
      const colors = ["#5470C6", "#91CC75"];
      const option = {
        color: colors,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
        },
        grid: {
          right: "20%",
        },
        legend: {
          data: ["总产值", "数量"],
        },
        xAxis: [
          {
            type: "category",
            axisTick: {
              alignWithLabel: true,
            },
            // prettier-ignore
            data: [
            "采集设计",
            "科研项目",
            "现场处理",
            "质量评价",
            "资料分析",
            "表层调查",
            "测量质控",
            "技术支持",
            "现场支持",
            "党建工作",
          ],
            axisLabel: {
              fontSize: 16,
              formatter: function (value: string) {
                const headTwo = value.slice(0, 2);
                const endTwo = value.slice(2);
                const newValue = headTwo + "\n" + endTwo;
                return newValue;
              },
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            name: "总产值",
            position: "left",
            alignTicks: true,
            axisLine: {
              show: true,
              lineStyle: {
                color: colors[0],
              },
            },
            axisLabel: {
              formatter: "{value}",
            },
          },
          {
            type: "value",
            name: "数量",
            position: "right",
            alignTicks: true,
            offset: 80,
            axisLine: {
              show: true,
              lineStyle: {
                color: colors[1],
              },
            },
            axisLabel: {
              formatter: "{value} 个",
            },
          },
        ],
        series: [
          {
            name: "总产值",
            type: "bar",
            data: sum,
          },
          {
            name: "数量",
            type: "bar",
            yAxisIndex: 1,
            data: count,
          },
        ],
      };

      // 使用刚指定的配置项和数据显示图表。
      myChart.setOption(option);
    };

    const drawPie = (divId: string, text: string, data: object) => {
      const myChart = echarts.init(document.getElementById(divId));

      const option = {
        tooltip: {
          trigger: "item",
        },
        title: {
          text: text,
          left: "center",
          top: "center",
          textStyle: {
            fontSize: 20,
            color: "#666",
          },
        },
        legend: {
          orient: "vertical",
          right: 10,
          top: 20,
          bottom: 20,
        },
        series: [
          {
            name: "产值",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: true,
              position: "left",
              formatter: "{b}:{d}%",
            },

            labelLine: {
              show: true,
            },
            data: data,
          },
        ],
      };

      myChart.setOption(option);
    };

    const fetchBarChartData = async () => {
      const data = await getBarChart().then((response) => {
        return response.data.data;
      });
      state.barChartParams = data;
      const arr = toRaw(state.barChartParams);
      const sum = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (const element of arr) {
        const index = element["type"] - 1;
        sum.splice(index, 1, element["sum"]);
        count.splice(index, 1, element["count"]);
      }

      echartInit(sum, count);
    };

    onMounted(() => {
      fetchData();
      fetchBarChartData();
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
