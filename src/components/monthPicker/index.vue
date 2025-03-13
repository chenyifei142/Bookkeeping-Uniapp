<script setup lang="ts">
import { ref, computed } from 'vue';

// 定义组件的props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  selectedYear: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  selectedMonth: {
    type: Number,
    default: () => new Date().getMonth() + 1
  }
});

// 定义组件的事件
const emit = defineEmits(['update:show', 'select-month']);

// 月份列表
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentYear = new Date().getFullYear();

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false);
};

// 选择月份
const selectMonth = (year: number, month: number) => {
  // 检查是否超过当前时间
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    uni.showToast({
      title: '不能选择未来的月份',
      icon: 'none'
    });
    return;
  }

  // 触发选择事件
  emit('select-month', { year, month });
  
  // 关闭弹窗
  closePopup();
};

// 添加触摸事件处理函数
const touchStartX = ref(0);

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
};

const handleTouchMove = (e: TouchEvent) => {
  // 可以添加一些视觉反馈，如果需要的话
};

const handleTouchEnd = (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diffX = touchEndX - touchStartX.value;

  // 如果滑动距离足够大，则切换年份
  if (Math.abs(diffX) > 50) {
    let newYear = props.selectedYear;
    
    if (diffX > 0) {
      // 右滑，切换到上一年
      newYear -= 1;
    } else {
      // 左滑，切换到下一年
      if (props.selectedYear < currentYear) {
        newYear += 1;
      }
    }
    
    // 触发年份变更事件
    if (newYear !== props.selectedYear) {
      emit('select-month', { year: newYear, month: props.selectedMonth });
    }
  }
};

// 格式化显示月份范围
const formatMonthRange = computed(() => {
  const year = props.selectedYear;
  const month = props.selectedMonth;

  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startDate = `${month}月1日`;
  const endDate = `${month}月${lastDay.getDate()}日`;

  return `${startDate} - ${endDate}`;
});
</script>

<template>
  <up-popup :show="show" @close="closePopup" mode="bottom" :round="20" :closeOnClickOverlay="false">
    <div class="month-picker">
      <div class="month-picker-header">
        <div class="title">按月查看</div>
        <!-- <div class="subtitle">点击切换视图模式</div> -->
      </div>
      <div class="date-select" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
        <!-- 年份选择 -->
        <div class="year-section">
          <div class="year-label">{{ selectedYear }}年</div>
        </div>
        <!-- 月份网格 -->
        <div class="months-grid">
          <div
            v-for="month in months"
            :key="month"
            class="month-item"
            :class="{
              'active': month === selectedMonth,
              'selected-dot': month === selectedMonth,
              'disabled': selectedYear === currentYear && month > new Date().getMonth() + 1
            }"
            @click="selectMonth(selectedYear, month)"
          >
            {{ month }}月
          </div>
        </div>
      </div>
    </div>
  </up-popup>
</template>

<style scoped>
/* 月份选择器样式 */
.month-picker {
  padding-top: 20px;
}

.month-picker-header {
  text-align: center;
  margin-bottom: 20px;
}

.month-picker-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.year-section {
  display: flex;
  justify-content: start;
  position: relative;
  overflow: hidden;
}

.year-label {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding: 5px 15px;
  border-radius: 20px;
  position: relative;
  z-index: 1;
}

.year-section::before, .year-section::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 20px;
  background: linear-gradient(to right, rgba(245, 245, 245, 1), rgba(245, 245, 245, 0)) !important;
  z-index: 0;
}

.year-section::before {
  left: 0;
}

.year-section::after {
  right: 0;
  background: linear-gradient(to left, rgba(245, 245, 245, 1), rgba(245, 245, 245, 0)) !important;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  padding: 10px;
}

.month-item {
  text-align: center;
  padding: 12px 0;
  border-radius: 10px;
  background-color: #f5f5f5;
  font-size: 16px;
  color: #000000;
  position: relative;
}

.month-item.active {
  border: 2px solid #183C3A;
}

.selected-dot::after {
  content: '';
  position: absolute;
  top: 5px;
  right: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #183C3A;
}

.month-item.disabled {
  opacity: 0.5;
  color: #999;
  cursor: not-allowed;
  background-color: #eee;
}

.month-item.disabled:active {
  background-color: #eee;
}

.month-item.disabled::after {
  display: none;
}
</style> 