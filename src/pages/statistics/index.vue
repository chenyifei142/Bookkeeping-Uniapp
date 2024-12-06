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
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 20, 0))

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
const selectItemHeight = ref<number>(0);  // 使用 number 来存储总高度
const selectTimeHeight = ref<number>(0);  // 使用 number 来存储总高度
onBeforeMount(async () => {
  menuBtnRect.value = uni.getMenuButtonBoundingClientRect()
})

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
const currentIndex = ref('1')
const selectItem = ref([
  {name: '月', value: '1'},
  {name: '年', value: '2'},
  {name: '自定义', value: '3'},
])

onMounted(() => {
  getServerData()
  const query = uni.createSelectorQuery();

  query.select('.select-box').boundingClientRect((data: any) => {
    selectItemHeight.value += data.height;
  }).exec();

  query.select('.select-time').boundingClientRect((data: any) => {
    selectTimeHeight.value += data.height;
  }).exec();
})
</script>

<template>
  <div class="menu-button menu-toggle" :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height  + selectTimeHeight}px;`">
    <div class="flex-align-start gap-10">
      <div class="flex-center width-100">
        统计
      </div>
      <div class="select-box flx-justify-around width-100" style="gap: 40px" v-if="!toggle">
        <div class="select color-E5E flex-align-center" v-for="item in selectItem" :key="item.value"
             @click="currentIndex=item.value">
          <div>{{ item.name }}</div>
          <div v-show="currentIndex===item.value" class="underline"></div>
        </div>
      </div>
      <div class="select-time flex-center gap-40 width-100">
        <up-icon name="arrow-left" color="#fff"></up-icon>
        <div class="flex-align-center color-E5E gap-10">
          <div class="font-sm flex-center gap-5">
            <div>2024年12月</div>
            <up-icon name="arrow-down-fill" color="#fff" size="10"></up-icon>
          </div>
          <div class="font-xs color-989">12/01-12/31</div>
        </div>
        <up-icon name="arrow-right" color="#fff"></up-icon>
      </div>
    </div>
  </div>
  <div class="home-page">
    <div class="home-banner"
         :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top +selectItemHeight+ selectTimeHeight}px`">
      <div class="box">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.select {
  width: 100%;
  height: 30px;
}

.underline {
  width: 25px;
  height: 3px;
  border-radius: 2px;
  margin-top: 5px;
  background-color: #0ACB79;
}

.box {
  position: relative;
  box-sizing: border-box;
  padding: 15px;
  background-color: #24282E;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 50px 0 rgba(0, 0, 0, 1);
}
</style>
