<script setup lang="ts">
import {onBeforeMount, onMounted, ref, reactive} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import QiunDataCharts from "@/components/qiun-data-charts/qiun-data-charts.vue";
import CardBase from "@/components/card/card-base.vue";
import CardBill from "@/components/card/card-bill.vue";
import {getBillRecordList, getTotalExpenseMonthly} from '@/api/home/billRecord'
import DefaultHomePage from "@/components/defaultPage/defaultHomePage.vue";
import {backPage, jumpPage} from "@/utils";
import BasicLayout from "@/components/layout/basic-layout.vue";

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

// 定义交易记录相关接口
interface BillType {
  ID: number;
  name: string;
  icon: string;
}

interface BillItem {
  ID: number;
  price: string | number;
  consumptionTime: string;
  remark?: string;
  type: string;
  iconBg: string;
  BillType: BillType;
}

interface BillGroup {
  consumptionDate: string;
  total: number;
  Data: BillItem[];
}

// 账单列表数据
const billList = ref<BillGroup[]>([])
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

// 格式化日期显示
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';

  // 解析日期字符串为日期对象
  const consumptionDate = new Date(dateStr);
  // 获取当前日期（不含时分秒）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 计算日期差异（天数）
  const timeDiff = Math.floor((consumptionDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  // 获取月份和日期
  const month = consumptionDate.getMonth() + 1;
  const day = consumptionDate.getDate();
  const datePrefix = `${month}月${day}日`;

  // 根据与今天的差异返回不同的文本
  switch (timeDiff) {
    case -2:
      return `${datePrefix} 前天`;
    case -1:
      return `${datePrefix} 昨天`;
    case 0:
      return `${datePrefix} 今天`;
    case 1:
      return `${datePrefix} 明天`;
    case 2:
      return `${datePrefix} 后天`;
    default:
      // 获取星期几
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekday = weekdays[consumptionDate.getDay()];
      return `${datePrefix} 周${weekday}`;
  }
}

onMounted(() => {
  getBillRecords()
  getMonthlyExpense()
})
</script>

<template>
  <basic-layout>
    <default-home-page :is-other-high="15">
      <template #title>
        <div class="flex-center">
          <div class="calendar-icon" style="position: absolute;left: 10px" @click="backPage()">
            <u-icon name="calendar" size="25" bold color="#5E5D5B"></u-icon>
          </div>
          <div class="flex-align-center gap-5">
            <div class="font-bold font-xl color-000">3月</div>
            <div class="color-666 font-xs">3月1日 - 3月31日</div>
          </div>
        </div>
      </template>
      <template #banner>
        <!-- 收支统计 -->
        <div class="summary-cards card-container">
          <div class="summary-card expense">
            <div class="card-header">
              <div class="card-icon">
                <span class="emoji">💸</span>
              </div>
              <div class="card-title">支出</div>
            </div>
            <div class="card-amount">¥{{ monthlyExpense }}</div>
          </div>
          <div class="summary-card income">
            <div class="card-header">
              <div class="card-icon">
                <span class="emoji">💰</span>
              </div>
              <div class="card-title">收入</div>
            </div>
            <div class="card-amount">0</div>
          </div>
        </div>
      </template>
      <template #content>
        <!-- 交易记录列表 -->
        <div class="transactions ">
          <div v-for="(group, index) in billList" :key="index" class="transaction-group">
            <div class="date-header">
              <div class="date">{{ formatDateDisplay(group.consumptionDate) }}</div>
              <div class="daily-summary">
                <div class="unit">支</div>
                <span class="num">¥{{ group.total }}</span>
              </div>
            </div>
            <div class="transaction-items">
              <div v-for="(item, itemIndex) in group.Data" :key="item.ID" class="transaction-item">
                <div class="item-left">
                  <div class="item-icon" :style="{ backgroundColor: item.iconBg }">
                    <span class="emoji">{{ item.BillType.icon }}</span>
                  </div>
                  <div class="item-info">
                    <div class="item-category">{{ item.BillType.name }}</div>
                    <div class="item-time">{{ item.remark || item.consumptionTime.substring(10, 16) }}</div>
                  </div>
                </div>
                <div class="item-amount font-bold" :class="{ 'expense': item.type === 'expense' }">
                  -￥{{ item.price }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </default-home-page>
  </basic-layout>
  <div class="float-action-button icon-add-circle flex-center gap-10"
       @click="jumpPage('pages/home/components/addBillRecord')"
       v-if="!toggle">
    <img class="add-icon" src="@/static/add.png" alt="">
    <span class="color-183">记一笔</span>
  </div>
</template>

<style scoped>
.calendar-icon {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 收支统计卡片样式 */
.summary-cards {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.summary-card {
  flex: 1;
  background-color: rgba(244, 244, 244, .9);
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.card-icon {
  font-size: 20px;
}

.card-title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.card-amount {
  font-size: 24px;
  font-weight: bold;
}

/* 交易记录列表样式 */
.transactions {
  margin-top: 16px;
}

.transaction-group {
  margin-bottom: 16px;
}

.date-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 8px;
  font-size: 14px;
  color: #908F8D;
  font-weight: 500;
}

.daily-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.daily-summary .unit {
  background-color: rgba(244, 244, 244, .9);
  padding: 2px 3px;
  color: #474644;
  font-size: 12px;
  border-radius: 5px;
}

.daily-summary .num {
  font-weight: 600;
  color: #4A4947;
}

.transaction-items {
  background-color: rgba(244, 244, 244, .9);
  border-radius: 12px;
  overflow: hidden;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 3px solid #FFFFFF;
}

.transaction-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-category {
  color: #000000;
  font-size: 16px;
  font-weight: 500;
}

.item-time {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.item-amount {
  font-size: 16px;
  font-weight: 700;
}

.item-amount.expense {
  color: #000;
}

.nav-item span {
  font-size: 12px;
}

.emoji {
  font-style: normal;
}

.add-icon {
  width: 20px;
  height: 20px;
  background-size: 100%;
}
</style>
