<script setup lang="ts">

import CardTab from "@/components/card/card-tab.vue";
import QiunDataCharts from "@/components/qiun-data-charts/qiun-data-charts.vue";
import {onMounted, ref} from "vue";

const chartData = ref({})
const opts = ref({
  rotate: false,
  rotateLock: false,
  color: ["#1890FF","#91CB74","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
  padding: [5,5,5,5],
  dataLabel: true,
  enableScroll: false,
  legend: {
    show: false,
    position: "right",
    lineHeight: 25
  },
  title: {
    name: "",
    fontSize: 15,
    color: "#666666"
  },
  subtitle: {
    name: "",
    fontSize: 25,
    color: "#7cb5ec"
  },
  extra: {
    ring: {
      ringWidth: 20,
      centerColor:'#24282E',
      activeOpacity: 0.5,
      activeRadius: 30,
      offsetAngle: 0,
      labelWidth: 15,
      border: false,
      borderWidth: 3,
      borderColor: "#FFFFFF"
    }
  }
})
const getServerData = () => {
  setTimeout(() => {
    //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
    let res = {
      series: [
        {
          data: [{"name":"一班","value":50},{"name":"二班","value":30},{"name":"三班","value":20},{"name":"四班","value":18},{"name":"五班","value":8}]
        }
      ]
    };
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
      <qiun-data-charts
          type="ring"
          :opts="opts"
          :chartData="chartData"
      />
    </div>
  </card-tab>
</template>

<style scoped>

</style>
