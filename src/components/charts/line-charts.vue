<script setup lang="ts">

import CardTab from "@/components/card/card-tab.vue";
import QiunDataCharts from "@/components/qiun-data-charts/qiun-data-charts.vue";
import {onMounted, ref} from "vue";

const chartData = ref({})
const opts = ref({
  color: ['0ACB79'],
  padding: [15, 5, 0, 0],
  dataLabel: false,
  dataPointShape: false,
  enableScroll: false,
  legend: {
    show: false
  },
  xAxis: {
    labelCount: 6, //默认显示个数
    disableGrid: true
  },
  yAxis: {
    gridType: "dash",
    dashLength: 2,
    data: [
      {
        min: 0,
        max: 150
      }
    ]
  },
  extra: {
    line: {
      type: "straight",
      width: 2,
      activeType: "hollow",
      linearType: "custom",
      onShadow: true,
      animation: "horizontal"
    }
  }
})
const getServerData = () => {
  setTimeout(() => {
    //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
    let res = {
      categories: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
      series: [
        {
          name: "成交量A",
          linearColor: [
            [
              0,
              "#1890FF"
            ],
            [
              0.25,
              "#00B5FF"
            ],
            [
              0.5,
              "#00D1ED"
            ],
            [
              0.75,
              "#00E6BB"
            ],
            [
              1,
              "#90F489"
            ]
          ],
          setShadow: [
            3,
            8,
            10,
            "#0ACB79"
          ],
          data: []
        },
      ]
    };
    const arr = []
    for (let i = 0; i < 30; i++) {
      arr.push(Math.floor(Math.random() * 100))
    }
    res.series[0].data = arr
    chartData.value = JSON.parse(JSON.stringify(res));
  }, 500);
}
onMounted(() => {
  getServerData()
})
</script>

<template>
  <card-tab>
    <div style="width: 100%;height: 100%">
      <qiun-data-charts type="line" :opts="opts" :chartData="chartData" :canvas2d="true"/>
    </div>
  </card-tab>
</template>

<style scoped>

</style>
