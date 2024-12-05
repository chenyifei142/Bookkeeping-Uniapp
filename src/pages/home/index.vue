<script setup lang="ts">
import {onBeforeMount, onMounted, ref} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import QiunDataCharts from "@/components/qiun-data-charts/qiun-data-charts.vue";
import CardBase from "@/components/card/card-base.vue";
import CardBill from "@/components/card/card-bill.vue";

type menuBtnRectType = {
  top: number;
  height: number;
};
const toggle = ref(false)
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 0))

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())

const chartData = ref({})
const opts = ref({
  color: ["#0ACB79"],
  padding: undefined,
  title: {
    name: "0",
    fontSize: 20,
    color: "#2fc25b"
  },
  subtitle: {
    name: "剩余日均可消费",
    fontSize: 12,
    color: "#E5E5E5"
  },
  extra: {
    arcbar: {
      type: "default",
      lineCap: 'butt',
      width: 12,
      backgroundColor: "#E9E9E9",
      startAngle: 0.88,
      endAngle: 0.12,
      gap: 2,
    }
  }
})
const getServerData = () => {
  setTimeout(() => {
    //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
    let res = {
      series: [
        {
          name: "正确率",
          color: "#2fc25b",
          data: 0.8
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
  <div class="menu-button menu-toggle" style="padding-left: 12px;" :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height}px;`">
    <div class="flex-align-start">
      <div class="flex-start">
        <span class="font-lg">账本名称</span>
        <up-icon name="arrow-down-fill" color="#fff"></up-icon>
      </div>
    </div>
  </div>
  <div class="home-page">
    <div class="home-banner" :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
      <card-base>
        <div class="flx-justify-between width-100 color-E5E">
          <div class="font-xs">2024年8月</div>
          <div class="font-xs">
            <up-icon name="setting" color="#fff"></up-icon>
          </div>
        </div>
        <div class="width-100" style="border-bottom: rgba(255,255,255,.3) solid 1px"></div>
        <div class="flx-justify-between width-100" style="height: 150px">
          <div class="flx-align-center">
            <div class="color-0AC font-sm">1500</div>
            <div class="color-E5E font-xs">剩余预算</div>
          </div>
          <div style="width: 60%;height: 100%">
            <qiun-data-charts type="arcbar" :opts="opts" :chartData="chartData"/>
          </div>
          <div class="flx-align-center">
            <div class="color-0AC font-sm">1500</div>
            <div class="color-E5E font-xs">本月已消费</div>
          </div>
        </div>
      </card-base>
    </div>
    <card-bill v-for="item in 40"></card-bill>
  </div>
  <div class="float-action-button icon-add-circle" v-if="!toggle"/>
</template>

<style scoped lang="scss">
</style>
