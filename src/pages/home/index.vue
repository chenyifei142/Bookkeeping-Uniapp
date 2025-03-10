<script setup lang="ts">
import {onBeforeMount, onMounted, ref, reactive} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import QiunDataCharts from "@/components/qiun-data-charts/qiun-data-charts.vue";
import CardBase from "@/components/card/card-base.vue";
import CardBill from "@/components/card/card-bill.vue";
import {getBillRecordList, getTotalExpenseMonthly} from '@/api/home/billRecord'
import DefaultHomePage from "@/components/defaultPage/defaultHomePage.vue";
import {jumpPage} from "@/utils";

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

// 账单列表数据
const billList = ref([])
const currentDayTotal = ref(0)
const pageParams = reactive({
  pageNo: 1,
  pageSize: 5
})
const loading = ref(false)
const hasMore = ref(true)

// 获取账单列表
const getBillRecords = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getBillRecordList(pageParams)
    if (res.code === 0) {
      billList.value = res.data
      currentDayTotal.value = res.data[0].total
    }
  } catch (error) {
    console.error('获取账单列表失败：', error)
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  pageParams.pageNo = 1
  hasMore.value = true
  await getBillRecords()
  uni.stopPullDownRefresh()
}

// 触底加载更多
const onReachBottom = () => {
  if (hasMore.value) {
    getBillRecords()
  }
}

const currentMonth = ref('')
const monthlyExpense = ref(0)
const monthlyBudget = ref(0)
const dailyAvailable = ref(0)

// 计算当月剩余天数
const getRemainingDays = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0).getDate()
  // 当前日期
  const currentDay = today.getDate()
  // 剩余天数（包含今天）
  return lastDay - currentDay + 1
}

// 计算日均可消费金额
const calculateDailyAvailable = () => {
  const remainingBudget = monthlyBudget.value - monthlyExpense.value
  const remainingDays = getRemainingDays()
  dailyAvailable.value = Number((remainingBudget / remainingDays).toFixed(2))

  // 更新环形图数据
  updateChartData()
}

// 更新环形图数据
const updateChartData = () => {
  let ratio = currentDayTotal.value / dailyAvailable.value
  // 确保比率在0到1之间
  ratio = 1 - Math.min(Math.max(ratio, 0), 1)
  let budget = dailyAvailable.value - currentDayTotal.value
  const chartRes = {
    series: [{
      name: "日均可消费",
      color: "#2fc25b",
      data: ratio
    }]
  }
  chartData.value = JSON.parse(JSON.stringify(chartRes))
  opts.value.title.name = budget.toString()
}

// 格式化当前月份
const formatCurrentMonth = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

// 获取月度支出
const getMonthlyExpense = async () => {
  try {
    currentMonth.value = formatCurrentMonth()
    const res = await getTotalExpenseMonthly(currentMonth.value)
    if (res.code === 0) {
      monthlyExpense.value = res?.data?.total || 0
      monthlyBudget.value = res?.data?.balance || 0
      // 计算日均可消费
      calculateDailyAvailable()
    }
  } catch (error) {
    console.error('获取月度支出失败：', error)
  }
}

onMounted(() => {
  getBillRecords()
  getMonthlyExpense()
})
</script>

<template>
  <default-home-page>
    <template #title>
      <div class="flex-align-start" style="padding-left: 12px;">
        <div class="flex-start">
          <span class="font-lg">泽狗呀</span>
        </div>
      </div>
    </template>
    <template #banner>
      <card-base>
        <div class="flx-justify-between width-100 color-E5E">
          <div class="font-xs">{{ currentMonth }}</div>
          <div class="font-xs">
            <up-icon name="setting" color="#fff"></up-icon>
          </div>
        </div>
        <div class="width-100" style="border-bottom: rgba(255,255,255,.3) solid 1px"></div>
        <div class="flx-justify-between width-100" style="height: 150px">
          <div class="flx-align-center">
            <div class="color-0AC font-sm">{{ monthlyExpense }}</div>
            <div class="color-E5E font-xs">本月已消费</div>
          </div>
          <div style="width: 60%;height: 100%">
            <qiun-data-charts type="arcbar" :opts="opts" :chartData="chartData"/>
          </div>
          <div class="flx-align-center">
            <div class="color-0AC font-sm">{{ monthlyBudget }}</div>
            <div class="color-E5E font-xs">剩余预算</div>
          </div>
        </div>
      </card-base>
    </template>
    <template #content>
      <div class="bill-list">
        <card-bill v-for="(item, index) in billList" :key="index" :bill-data="item"></card-bill>
        <div class="loading-text" v-if="loading">加载中...</div>
        <div class="no-more" v-if="!hasMore && billList.length > 0">没有更多数据了</div>
        <div class="empty" v-if="!loading && billList.length === 0">暂无记账数据</div>
      </div>
    </template>
  </default-home-page>
  <div class="float-action-button icon-add-circle" @click="jumpPage('pages/home/components/addBillRecord')"
       v-if="!toggle"/>
</template>

<style scoped lang="scss">
.bill-list {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .loading-text {
    text-align: center;
    color: #999;
    padding: 16px 0;
  }

  .no-more {
    text-align: center;
    color: #999;
    padding: 16px 0;
  }

  .empty {
    text-align: center;
    color: #999;
    padding: 32px 0;
  }
}
</style>
