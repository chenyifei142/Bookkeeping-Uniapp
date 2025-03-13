<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import {getCurrentYearRecord} from "@/api/home/billRecord";

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
const currentMonth = new Date().getMonth() + 1;

// 临时年份状态，用于滑动切换
const tempYear = ref(props.selectedYear);
const tempMonth = ref(props.selectedMonth);
// 滑动方向状态
const slideDirection = ref(''); // 'left' 或 'right'
const isAnimating = ref(false);

// 监听弹窗显示状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    getData()
    // 弹窗打开时，初始化临时状态为当前选中的年月
    tempYear.value = props.selectedYear;
    tempMonth.value = props.selectedMonth;
    // 重置滑动方向
    slideDirection.value = '';
  }
});

// 关闭弹窗
const closePopup = () => {
  // 重置临时状态
  tempYear.value = props.selectedYear;
  tempMonth.value = props.selectedMonth;
  emit('update:show', false);
};

// 选择月份
const selectMonth = (year: number, month: number) => {
  // 检查是否超过当前时间
  if (year > currentYear || (year === currentYear && month > currentMonth)) {
    uni.showToast({
      title: '不能选择未来的月份',
      icon: 'none'
    });
    return;
  }

  // 更新临时状态
  tempMonth.value = month;

  // 触发选择事件
  emit('select-month', {year, month});

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
    // 设置动画状态
    isAnimating.value = true;
    
    if (diffX > 0) {
      // 右滑，切换到上一年
      slideDirection.value = 'right';
      setTimeout(() => {
        tempYear.value -= 1;
        // 动画结束后重置状态
        setTimeout(() => {
          isAnimating.value = false;
        }, 300);
      }, 50);
    } else {
      // 左滑，切换到下一年
      if (tempYear.value < currentYear) {
        slideDirection.value = 'left';
        setTimeout(() => {
          tempYear.value += 1;
          // 动画结束后重置状态
          setTimeout(() => {
            isAnimating.value = false;
          }, 300);
        }, 50);
      }
    }

    // 如果切换到当前年份，且临时选中的月份超过当前月份，重置为当前月份
    if (tempYear.value === currentYear && tempMonth.value > currentMonth) {
      tempMonth.value = currentMonth;
    }
    getData()
  }
};

const hasRecordMonth = ref<number[]>([])
const getData = async () => {
  const {data: month} = await getCurrentYearRecord({year: tempYear.value});
  hasRecordMonth.value = month.map((item: string) => Number(item));
}

// 判断指定月份是否有记录
const handleDot = (month: number): boolean => {
  return hasRecordMonth.value.includes(month);
}
</script>

<template>
  <up-popup :show="show" @close="closePopup" mode="bottom" :round="20">
    <div class="month-picker">
      <div class="month-picker-header">
        <div class="title">按月查看</div>
        <!-- <div class="subtitle">点击切换视图模式</div> -->
      </div>
      <div class="date-select" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
        <!-- 年份选择 -->
        <div class="year-section">
          <div 
            class="year-label" 
            :class="{
              'slide-left': slideDirection === 'left' && isAnimating,
              'slide-right': slideDirection === 'right' && isAnimating
            }"
          >
            {{ tempYear }}年
          </div>
        </div>
        <!-- 月份网格 -->
        <div 
          class="months-grid"
          :class="{
            'slide-left': slideDirection === 'left' && isAnimating,
            'slide-right': slideDirection === 'right' && isAnimating
          }"
        >
          <div
              v-for="month in months"
              :key="month"
              class="month-item"
              :class="{
              'active': month === tempMonth,
              'selected-dot': handleDot(month),
              'disabled': tempYear === currentYear && month > currentMonth
            }"
              @click="selectMonth(tempYear, month)"
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
  transition: transform 0.3s ease-out;
}

/* 滑动动画 */
.slide-left {
  animation: slideLeft 0.3s ease-out;
}

.slide-right {
  animation: slideRight 0.3s ease-out;
}

@keyframes slideLeft {
  0% {
    transform: translateX(50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideRight {
  0% {
    transform: translateX(-50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
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
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.month-item {
  text-align: center;
  padding: 12px 0;
  border-radius: 10px;
  background-color: #f5f5f5;
  font-size: 16px;
  color: #000000;
  position: relative;
  transition: all 0.2s ease;
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
