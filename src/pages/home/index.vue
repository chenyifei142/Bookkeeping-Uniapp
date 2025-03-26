<script setup lang="ts">
import {onMounted, ref, reactive, computed} from 'vue'
import {onShow} from "@dcloudio/uni-app";
import _ from "lodash";
import {getBillRecordList, getTotalExpenseMonthly} from '@/api/billRecord'
import DefaultHomePage from "@/components/defaultPage/defaultHomePage.vue";
import {jumpPage} from "@/utils";
import BasicLayout from "@/components/layout/basic-layout.vue";
import MonthPicker from "@/components/monthPicker/index.vue";

// 导入日期工具函数
import {
  formatDateDisplay,
  formatCurrentMonth,
  formatYearMonth,
  formatMonthRange as formatMonthRangeUtil
} from '@/utils/date';

/**
 * 数据状态和响应式变量
 */
// 页面滚动状态
const toggle = ref(false)

// 账单列表数据
const billList = ref<any[]>([])
const currentDayTotal = ref(0)
const loading = ref(false)
const hasMore = ref(true)

// 月份选择相关状态
const showMonthPicker = ref(false)
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

// 月度数据
const currentMonth = ref('')
const monthlyExpense = ref(0)
const monthlyBudget = ref(0)

// 页面请求参数
const pageParams = reactive<any>({
  startTime: '',
  endTime: ''
})

/**
 * 计算属性
 */
// 格式化显示月份范围
const formatMonthRange = computed(() => {
  return formatMonthRangeUtil(selectedYear.value, selectedMonth.value);
})

// 格式化金额显示
const formattedMonthlyExpense = computed(() => {
  const num = monthlyExpense.value;
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
})

/**
 * 方法
 */
// 设置月份开始和结束时间
const setMonthTimeRange = (year: number, month: number) => {
  // 月份开始日期
  const startDate = new Date(year, month - 1, 1);
  // 月份结束日期（下个月的第0天就是当前月的最后一天）
  const endDate = new Date(year, month, 0);

  // 格式化日期字符串
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d} 00:00:00`;
  };

  pageParams.startTime = formatDate(startDate);
  pageParams.endTime = formatDate(endDate);
};

// 打开月份选择器
const openMonthPicker = () => {
  showMonthPicker.value = true
}

// 处理月份选择
const handleMonthSelect = (data: { year: number, month: number }) => {
  selectedYear.value = data.year;
  selectedMonth.value = data.month;

  // 更新当前月份
  currentMonth.value = formatYearMonth(data.year, data.month);

  // 设置月份的时间范围
  setMonthTimeRange(data.year, data.month);

  // 重新获取数据
  refreshData();
}

/**
 * API请求
 */
// 获取账单列表
const getBillRecords = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const res = await getBillRecordList(pageParams)
    if (res.code === 0) {
      billList.value = res.data
    }
  } catch (error) {
    console.error('获取账单列表失败：', error)
  } finally {
    loading.value = false
  }
}

// 获取月度支出
const getMonthlyExpense = async () => {
  try {
    const res = await getTotalExpenseMonthly(currentMonth.value)
    if (res.code === 0) {
      monthlyExpense.value = res?.data?.total || 0
      monthlyBudget.value = res?.data?.balance || 0
    }
  } catch (error) {
    console.error('获取月度支出失败：', error)
  }
}

// 刷新所有数据
const refreshData = () => {
  getBillRecords();
  getMonthlyExpense();
}

/**
 * 生命周期钩子
 */
onShow(() => {
  // 初始化当前月份
  currentMonth.value = formatCurrentMonth();

  // 设置当前月份的时间范围
  setMonthTimeRange(selectedYear.value, selectedMonth.value);

  // 获取数据
  refreshData();
})
</script>

<template>
  <basic-layout>
    <default-home-page :is-other-high="15" @update:toggle="toggle = $event">
      <!-- 顶部标题栏 -->
      <template #title>
        <div class="flex-center" style="height: 100%">
          <div class="calendar-icon" style="position: absolute;left: 10px" @click="openMonthPicker">
            <u-icon name="calendar" size="25" bold color="#5E5D5B"></u-icon>
          </div>
          <div class="flex-align-center gap-5">
            <div class="font-bold font-xl color-000">{{ selectedMonth }}月</div>
            <div class="color-666 font-xs">{{ formatMonthRange }}</div>
          </div>
        </div>
      </template>
      
      <!-- 收支统计卡片 -->
      <template #banner>
        <div class="summary-cards card-container">
          <!-- 支出卡片 -->
          <div class="summary-card expense">
            <div class="card-header">
              <div class="card-icon">
                <span class="emoji">💸</span>
              </div>
              <div class="card-title">支出</div>
            </div>
            <div class="card-amount">¥{{ formattedMonthlyExpense }}</div>
          </div>
          
          <!-- 收入卡片 -->
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
      
      <!-- 交易记录列表 -->
      <template #content>
        <div class="transactions">
          <div v-for="(group, index) in billList" 
               :key="index" 
               class="transaction-group">
            <!-- 日期头部 -->
            <div class="date-header">
              <div class="date">{{ formatDateDisplay(group.consumptionDate) }}</div>
              <div class="daily-summary">
                <div class="unit">支</div>
                <span class="num">¥{{ group.total }}</span>
              </div>
            </div>
            
            <!-- 交易项目列表 -->
            <div class="transaction-items">
              <div v-for="item in group.Data" 
                   :key="item.ID" 
                   class="transaction-item">
                <div class="item-left">
                  <div class="item-icon" :style="{ backgroundColor: item.iconBg }">
                    <span class="emoji">{{ item.BillType.icon }}</span>
                  </div>
                  <div class="item-info">
                    <div class="item-category">{{ item.BillType.name }}</div>
                    <div class="item-time">{{ item.consumptionTime.substring(10, 16) }}</div>
                    <div class="item-time" v-if="item.remark">{{ item.remark}}</div>
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

  <!-- 月份选择器组件 -->
  <month-picker
      v-model:show="showMonthPicker"
      :selected-year="selectedYear"
      :selected-month="selectedMonth"
      @select-month="handleMonthSelect"
  />

  <!-- 添加记录按钮 -->
  <div class="float-action-button icon-add-circle flex-center gap-10"
       @click="jumpPage('pages/home/components/addBillRecord')"
       v-show="true"
       :class="{'button-hidden': toggle}">
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
  font-size: 12px;
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
