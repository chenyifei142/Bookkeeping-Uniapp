<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { onShow } from "@dcloudio/uni-app";
import { getTotalExpenseMonthly } from '@/api/billRecord'
import { totalExpenditureByCategory } from "@/api/statistics";
import DefaultHomePage from "@/components/defaultPage/defaultHomePage.vue";
import { jumpPage } from "@/utils";
import BasicLayout from "@/components/layout/basic-layout.vue";
import MonthPicker from "@/components/monthPicker/index.vue";
import EChart from "@/uni_modules/e-chart/components/e-chart/e-chart.vue";

// 导入日期工具函数
import {
  formatDateDisplay,
  formatCurrentMonth,
  formatYearMonth,
  formatMonthRange as formatMonthRangeUtil
} from '@/utils/date';

// ====================== 类型定义 ======================

/**
 * 分类支出数据项接口
 */
interface CategoryExpenseItem {
  category: string;
  icon: string;
  price: number;
}

/**
 * 图表数据项接口
 */
interface ChartDataItem {
  value: number;
  name: string;
  itemStyle: {
    color: string;
  };
  originalName?: string;
}

/**
 * 图表选项接口
 */
interface ChartOption {
  series: Array<{
    name: string;
    type: string;
    radius: string[];
    avoidLabelOverlap: boolean;
    center: string[];
    itemStyle: {
      borderRadius: number;
      borderColor: string;
      borderWidth: number;
    };
    label: {
      show: boolean;
      position: string;
      fontSize: number;
      fontWeight: string;
      formatter: string;
      backgroundColor: string;
    };
    emphasis: {
      label: {
        show: boolean;
        fontSize: number;
        fontWeight: string;
      }
    };
    labelLine: {
      show: boolean;
    };
    selectedMode: string;
    data: ChartDataItem[];
  }>;
  graphic: Array<{
    type: string;
    left: string;
    top: string;
    style: {
      text: string;
      textAlign: string;
      fill: string;
      fontSize: number;
      fontWeight?: string;
    };
  }>;
}

// ====================== 响应式状态 ======================

/**
 * 页面公共状态
 */
// 页面滚动状态
const toggle = ref(false);

/**
 * 月份选择相关状态
 */
const showMonthPicker = ref(false);
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const currentMonth = ref('');

/**
 * 月度数据
 */
const monthlyExpense = ref(0);
const monthlyBudget = ref(0);
const total = ref(0);

/**
 * 图表相关状态
 */
const echartRef = ref<any>(null);
let chartInstance: any = null;
const statisticsData = ref<CategoryExpenseItem[]>([]);

/**
 * 页面请求参数
 */
const pageParams = reactive<{
  startTime: string;
  endTime: string;
}>({
  startTime: '',
  endTime: ''
});

/**
 * 图表配置
 */
const option: ChartOption = {
  series: [
    {
      name: '支出分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      center: ['50%', '50%'],
      itemStyle: {
        borderRadius: 0,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: true,
        position: 'inside',
        fontSize: 16,
        fontWeight: 'bold',
        formatter: '{b}',
        backgroundColor: 'transparent'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      selectedMode: 'single',
      data: []
    }
  ],
  graphic: [
    {
      type: 'text',
      left: 'center',
      top: '40%',
      style: {
        text: '总计',
        textAlign: 'center',
        fill: '#666',
        fontSize: 14
      }
    },
    {
      type: 'text',
      left: 'center',
      top: '50%',
      style: {
        text: '¥0',
        textAlign: 'center',
        fill: '#333',
        fontSize: 16,
        fontWeight: 'bold'
      }
    }
  ]
};

// ====================== 计算属性 ======================

/**
 * 格式化显示月份范围
 */
const formatMonthRange = computed(() => {
  return formatMonthRangeUtil(selectedYear.value, selectedMonth.value);
});

/**
 * 格式化金额显示
 */
const formattedMonthlyExpense = computed(() => {
  const num = monthlyExpense.value;
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
});

/**
 * 计算总金额
 */
const totalAmount = computed(() => {
  if (!statisticsData.value || statisticsData.value.length === 0) return 0;
  return statisticsData.value.reduce((sum, item) => sum + Number(item.price), 0);
});

// ====================== 方法定义 ======================

/**
 * 日期和时间处理
 */

/**
 * 设置月份开始和结束时间
 */
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

/**
 * 打开月份选择器
 */
const openMonthPicker = () => {
  showMonthPicker.value = true;
};

/**
 * 处理月份选择
 */
const handleMonthSelect = (data: { year: number, month: number }) => {
  selectedYear.value = data.year;
  selectedMonth.value = data.month;

  // 更新当前月份
  currentMonth.value = formatYearMonth(data.year, data.month);

  // 设置月份的时间范围
  setMonthTimeRange(data.year, data.month);

  // 重新获取数据
  refreshData();
};

/**
 * 数据获取和处理
 */

/**
 * 获取月度支出
 */
const getMonthlyExpense = async () => {
  try {
    const res = await getTotalExpenseMonthly(currentMonth.value);
    if (res.code === 0) {
      monthlyExpense.value = res?.data?.total || 0;
      monthlyBudget.value = res?.data?.balance || 0;
      total.value = res?.data?.count || 0;
    }
  } catch (error) {
    console.error('获取月度支出失败：', error);
  }
};

/**
 * 刷新所有数据
 */
const refreshData = () => {
  getMonthlyExpense();
  loadCategoryData();
};

/**
 * 加载分类数据
 */
const loadCategoryData = async () => {
  try {
    const { data } = await totalExpenditureByCategory({
      type: 'month', 
      time: pageParams.startTime
    });
    
    if (!data || data.length === 0) {
      console.warn('未获取到分类支出数据');
      return;
    }
    
    // 按价格从大到小排序
    const sortedData = [...data].sort((a, b) => b.price - a.price);
    statisticsData.value = sortedData;
    
    // 更新图表数据
    updateChartData(sortedData);
    
    // 更新中心文本显示总金额
    updateCenterTotal();
  } catch (error) {
    console.error('获取分类支出数据失败：', error);
    // 使用默认数据
    setDefaultChartData();
  }
};

/**
 * 图表相关
 */

/**
 * 设置默认图表数据
 */
const setDefaultChartData = () => {
  option.series[0].data = [
    {value: 14, name: '🍔', itemStyle: {color: '#4a6572'}},
    {value: 11, name: '🏥', itemStyle: {color: '#5d7a8c'}},
    {value: 19, name: '⚽', itemStyle: {color: '#7a9aa8'}},
    {value: 12, name: '💴', itemStyle: {color: '#97b4c0'}},
    {value: 8, name: '🏠', itemStyle: {color: '#b5cad3'}},
    {value: 7, name: '🚗', itemStyle: {color: '#c8d9e0'}},
    {value: 20, name: '📱', itemStyle: {color: '#d8e6eb'}}
  ];
  
  // 执行更新
  if (echartRef.value) {
    echartRef.value.setOption(option);
  }
};

/**
 * 更新图表数据
 */
const updateChartData = (data: CategoryExpenseItem[]) => {
  // 设定基础 HSL 颜色
  const baseHue = 172; // 绿色系
  const baseSaturation = 21; // 保持饱和度
  const minLightness = 33; // 第一名的颜色（最深）
  const maxLightness = 75; // 最后名的颜色（最浅）
  
  option.series[0].data = data.map((item, index) => {
    // 计算当前数据项的亮度，排名越靠后，颜色越浅
    const lightness = minLightness + (index / (data.length - 1 || 1)) * (maxLightness - minLightness);
    
    return {
      value: item.price,
      name: item.icon,
      itemStyle: {color: `hsl(${baseHue}, ${baseSaturation}%, ${lightness}%)`} // 生成 HSL 颜色
    };
  });
  
  // 执行更新
  if (echartRef.value) {
    echartRef.value.setOption(option);
  }
};

/**
 * 更新中心总计文本
 */
const updateCenterTotal = () => {
  if (totalAmount.value > 0) {
    option.graphic[0].style.text = '总计';
    option.graphic[1].style.text = `¥${totalAmount.value.toFixed(2)}`;
    
    // 更新图表
    if (echartRef.value) {
      echartRef.value.setOption({
        graphic: option.graphic
      });
    }
  }
};

/**
 * 组件挂载后初始化echarts实例
 */
const initEchart = async () => {
  try {
    // 初始化图表
    const initResult = await echartRef.value.init(option);
    
    // 保存图表实例
    chartInstance = initResult.echartObj;
    
    // 添加点击事件监听
    if (chartInstance) {
      console.log('成功获取到图表实例并添加点击事件');
      
      // 为图表添加点击事件监听
      chartInstance.on('click', function(params: any) {
        console.log('饼图点击事件触发:', params);
        handlePieClick(params);
      });
    }
  } catch (error) {
    console.error('初始化图表失败:', error);
  }
};

/**
 * 处理饼图点击
 */
const handlePieClick = (params: any) => {
  if (!params || !params.data) return;
  
  console.log('处理饼图点击:', params.data);
  
  updateCenterText({
    name: params.data.name,
    value: params.data.value
  });
};

/**
 * 更新中心文本
 */
const updateCenterText = (item: {name: string, value: number}) => {
  console.log('更新中心文本:', item);
  
  // 更新中心文本
  option.graphic[0].style.text = item.name;
  option.graphic[1].style.text = `¥${item.value}`;
  
  // 更新图表
  if (chartInstance) {
    chartInstance.setOption({
      graphic: option.graphic
    });
  } else if (echartRef.value) {
    echartRef.value.setOption({
      graphic: option.graphic
    });
  }
};

/**
 * 工具方法
 */

/**
 * 获取百分比
 */
const getPercentage = (value: number, showUnit = true) => {
  if (totalAmount.value === 0) return '0%';
  const percentage = (value / totalAmount.value) * 100;
  return showUnit ? `${percentage.toFixed(1)}%` : percentage.toFixed(1);
};

/**
 * 获取屏幕宽度
 */
const getScreenWidth = (): number => {
  try {
    const info = uni.getSystemInfoSync();
    return info.windowWidth;
  } catch (e) {
    console.error('获取屏幕信息失败:', e);
    return 375; // 默认值
  }
};

// ====================== 生命周期钩子 ======================

/**
 * 页面显示时触发
 */
onShow(() => {
  // 初始化当前月份
  currentMonth.value = formatCurrentMonth();
  
  // 设置当前月份的时间范围
  setMonthTimeRange(selectedYear.value, selectedMonth.value);
  
  // 初始化图表
  initEchart();
  
  // 获取数据
  refreshData();
});
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
        <!-- 月度概览 -->
        <div class="overview-card">
          <h2 class="section-title">{{ selectedMonth }}月概览</h2>

          <div class="overview-grid">
            <div class="overview-item">
              <div class="item-label">支出</div>
              <div class="item-value">¥{{ formattedMonthlyExpense }}</div>
            </div>

            <div class="overview-item">
              <div class="item-label">收入</div>
              <div class="item-value">0</div>
            </div>

            <div class="overview-item">
              <div class="item-label">结余</div>
              <div class="item-value negative">-¥{{ formattedMonthlyExpense }}</div>
            </div>

            <div class="overview-item">
              <div class="item-label">记账次数</div>
              <div class="item-value">{{ total }}</div>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <!-- 支出分布 -->
        <div class="distribution-card">
          <div class="card-header">
            <h2 class="section-title">支出分布</h2>
          </div>

          <div class="pie-chart-container">
            <div style="width: 100%;height: 100%">
              <e-chart ref="echartRef" @ready="initEchart"/>
            </div>
          </div>

          <!-- 分类详情 -->
          <div class="category-details">
            <div class="category-item" 
                 v-for="(item, index) in statisticsData" 
                 :key="index"
                 @click="updateCenterText({name: item.icon, value: item.price})">
              <div class="category-icon" 
                   :style="{
                     backgroundColor: option.series[0].data[index]?.itemStyle.color
                   }">
                {{ item.icon }}
              </div>
              <div class="category-info">
                <div class="flex-between" style="width: 100%">
                  <div class="category-name">{{ item.name }}</div>
                  <div class="category-percentage">{{ getPercentage(item.price) }}</div>
                </div>
                <up-line-progress 
                    :percentage="Number(getPercentage(item.price, false))" 
                    activeColor="#426561">
                </up-line-progress>
              </div>
              <div class="category-amount">¥{{ item.price }}</div>
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
/* 布局相关样式 */
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 月份选择图标 */
.calendar-icon {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 月度概览样式 */
.overview-card {
  background-color: #F4F4F4;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px;
  color: #666;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.overview-item {
  padding: 10px;
  background-color: #EFEFED;
  border-radius: 8px;
}

.item-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.item-value {
  font-size: 18px;
  font-weight: 600;
}

.negative {
  color: #f44336;
}

/* 支出分布样式 */
.distribution-card {
  background-color: #f4f4f4;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pie-chart-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

/* 分类详情样式 */
.category-details {
  margin-top: 20px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  margin-bottom: 4px;
}

.category-item:active {
  background-color: #f1f1f1;
  transform: scale(0.98);
}

.category-item:hover {
  background-color: #f9f9f9;
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-info {
  flex: 1;
  width: 100%;
}

.category-name {
  font-size: 14px;
  font-weight: 500;
}

.category-percentage {
  font-size: 12px;
  color: #666;
}

.category-amount {
  font-size: 14px;
  font-weight: 500;
  margin-left: 8px;
}

.add-icon {
  width: 20px;
  height: 20px;
  background-size: 100%;
}
</style>
