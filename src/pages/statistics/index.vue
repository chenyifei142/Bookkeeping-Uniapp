<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from "@dcloudio/uni-app"
import BasicLayout from "@/components/layout/basic-layout.vue"
import { getBillRecordList } from '@/api/billRecord'
import {
  formatCurrentMonth,
  formatYearMonth
} from '@/utils/date'

/**
 * 数据状态和响应式变量
 */
// 统计数据
const totalExpense = ref(0)
const totalIncome = ref(0)
const categoryData = ref<any[]>([])
const loading = ref(false)

// 时间相关
const currentMonth = ref('')
const currentYear = ref(new Date().getFullYear())

/**
 * 计算属性
 */
// 格式化金额显示
const formattedTotalExpense = computed(() => {
  return formatAmount(totalExpense.value)
})

const formattedTotalIncome = computed(() => {
  return formatAmount(totalIncome.value)
})

/**
 * 方法
 */
// 格式化金额
const formatAmount = (amount: number) => {
  const parts = amount.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// 初始化数据
const initData = () => {
  // 设置当前月份
  currentMonth.value = formatCurrentMonth()
  
  // 获取统计数据
  getStatisticsData()
}

/**
 * API请求
 */
// 获取统计数据
const getStatisticsData = async () => {
  if (loading.value) return
  loading.value = true
  
  try {
    // 设置请求参数，获取当月数据
    const year = currentYear.value
    const month = parseInt(currentMonth.value.split('-')[1])
    
    // 月份开始日期
    const startDate = new Date(year, month - 1, 1)
    // 月份结束日期
    const endDate = new Date(year, month, 0)
    
    // 格式化日期
    const formatDate = (date: Date) => {
      const y = date.getFullYear()
      const m = (date.getMonth() + 1).toString().padStart(2, '0')
      const d = date.getDate().toString().padStart(2, '0')
      return `${y}-${m}-${d} 00:00:00`
    }
    
    const params = {
      startTime: formatDate(startDate),
      endTime: formatDate(endDate)
    }
    
    const res = await getBillRecordList(params)
    if (res.code === 0) {
      // 计算总收入和支出
      calculateTotals(res.data)
      
      // 处理分类数据
      processCategoryData(res.data)
    }
  } catch (error) {
    console.error('获取统计数据失败：', error)
  } finally {
    loading.value = false
  }
}

// 计算总收入和支出
const calculateTotals = (data: any[]) => {
  let expense = 0
  let income = 0
  
  data.forEach(dayData => {
    dayData.Data.forEach((item: any) => {
      if (item.type === 'expense') {
        expense += parseFloat(item.price)
      } else if (item.type === 'income') {
        income += parseFloat(item.price)
      }
    })
  })
  
  totalExpense.value = expense
  totalIncome.value = income
}

// 处理分类数据
const processCategoryData = (data: any[]) => {
  const categories: Record<string, any> = {}
  
  // 统计每个类别的总金额
  data.forEach(dayData => {
    dayData.Data.forEach((item: any) => {
      const categoryId = item.BillType.id
      const categoryName = item.BillType.name
      const icon = item.BillType.icon
      
      if (!categories[categoryId]) {
        categories[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: icon,
          amount: 0,
          percentage: 0
        }
      }
      
      categories[categoryId].amount += parseFloat(item.price)
    })
  })
  
  // 转换为数组并计算百分比
  const categoryArray = Object.values(categories)
  const total = totalExpense.value
  
  categoryArray.forEach((category: any) => {
    category.percentage = total > 0 ? (category.amount / total * 100).toFixed(2) : 0
  })
  
  // 按金额降序排序
  categoryData.value = categoryArray.sort((a: any, b: any) => b.amount - a.amount)
}

/**
 * 生命周期钩子
 */
onShow(() => {
  initData()
})
</script>

<template>
  <basic-layout>
    <div class="statistics-container">
      <!-- 顶部卡片 -->
      <div class="statistics-header">
        <div class="month-selector">
          <div class="current-month">{{ currentMonth }}</div>
        </div>
        
        <!-- 收支总览卡片 -->
        <div class="overview-cards">
          <div class="card expense-card">
            <div class="card-label">支出 (元)</div>
            <div class="card-amount">{{ formattedTotalExpense }}</div>
          </div>
          
          <div class="card income-card">
            <div class="card-label">收入 (元)</div>
            <div class="card-amount">{{ formattedTotalIncome }}</div>
          </div>
        </div>
      </div>
      
      <!-- 分类统计 -->
      <div class="category-statistics">
        <div class="section-title">支出分类</div>
        
        <div class="category-list">
          <div v-for="category in categoryData" 
               :key="category.id" 
               class="category-item">
            <div class="category-left">
              <div class="category-icon">
                <span class="emoji">{{ category.icon }}</span>
              </div>
              <div class="category-info">
                <div class="category-name">{{ category.name }}</div>
                <div class="category-percentage">{{ category.percentage }}%</div>
              </div>
            </div>
            <div class="category-amount">¥{{ category.amount }}</div>
          </div>
          
          <div v-if="categoryData.length === 0" class="empty-state">
            暂无数据
          </div>
        </div>
      </div>
    </div>
  </basic-layout>
</template>

<style scoped lang="scss">
.statistics-container {
  padding: 16px;
}

.statistics-header {
  margin-bottom: 24px;
}

.month-selector {
  margin-bottom: 16px;
  
  .current-month {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
  }
}

.overview-cards {
  display: flex;
  gap: 12px;
  
  .card {
    flex: 1;
    background-color: rgba(244, 244, 244, .9);
    border-radius: 12px;
    padding: 16px;
    
    .card-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .card-amount {
      font-size: 24px;
      font-weight: bold;
      color: #000;
    }
  }
}

.category-statistics {
  background-color: rgba(244, 244, 244, .9);
  border-radius: 12px;
  padding: 16px;
  
  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
  }
  
  .category-list {
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      
      &:last-child {
        border-bottom: none;
      }
      
      .category-left {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .category-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #f0f0f0;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 20px;
        }
        
        .category-info {
          .category-name {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .category-percentage {
            font-size: 12px;
            color: #999;
          }
        }
      }
      
      .category-amount {
        font-size: 16px;
        font-weight: 600;
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 24px 0;
      color: #999;
    }
  }
}

.emoji {
  font-style: normal;
}
</style>
