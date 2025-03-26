<script setup lang="ts">
import {ref, computed, watch, reactive} from 'vue';

// 定义组件的props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  value: {
    type: [Date, String, Number],
    default: () => new Date()
  }
});

// 定义组件的事件
const emit = defineEmits(['update:show', 'confirm']);

// 获取当前日期
const currentDate = new Date();

// 日期时间选择状态（直接使用单独的变量，不使用数组）
const selectedYear = ref(currentDate.getFullYear());
const selectedMonth = ref(currentDate.getMonth());
const selectedDay = ref(currentDate.getDate());
const selectedHour = ref(currentDate.getHours());
const selectedMinute = ref(currentDate.getMinutes());

// 年份数据 - 前后各10年，扩大范围
const years = computed(() => {
  const result = [];
  const startYear = currentDate.getFullYear() - 50;
  const endYear = currentDate.getFullYear() + 50;
  for (let i = startYear; i <= endYear; i++) {
    result.push(i);
  }
  return result;
});

// 月份数据（0-11对应一月到十二月）
const months = computed(() => {
  const result = [];
  for (let i = 0; i < 12; i++) {
    result.push(i);
  }
  return result;
});

// 日期数据（根据当前选择的年月计算天数）
const days = computed(() => {
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate();
  const result = [];
  for (let i = 1; i <= daysInMonth; i++) {
    result.push(i);
  }
  return result;
});

// 小时数据（0-23）
const hours = computed(() => {
  const result = [];
  for (let i = 0; i < 24; i++) {
    result.push(i);
  }
  return result;
});

// 分钟数据（0-59）
const minutes = computed(() => {
  const result = [];
  for (let i = 0; i < 60; i++) {
    result.push(i);
  }
  return result;
});

// 索引值（用于picker-view的显示）
const yearIndex = computed(() => {
  return years.value.findIndex(y => y === selectedYear.value);
});

const monthIndex = computed(() => {
  return selectedMonth.value;
});

const dayIndex = computed(() => {
  return selectedDay.value - 1; // 天数从1开始，索引从0开始
});

const hourIndex = computed(() => {
  return selectedHour.value;
});

const minuteIndex = computed(() => {
  return selectedMinute.value;
});

// 合并为valueArray
const valueArray = computed(() => {
  return [
    Math.max(0, yearIndex.value),
    0, // 年单位列
    monthIndex.value,
    0, // 月单位列
    Math.min(days.value.length - 1, Math.max(0, dayIndex.value)),
    0, // 日单位列
    hourIndex.value,
    0, // 分隔符列
    minuteIndex.value
  ];
});

// 计算当前选择的星期几
const weekday = computed(() => {
  const date = new Date(
      selectedYear.value,
      selectedMonth.value,
      selectedDay.value,
      selectedHour.value,
      selectedMinute.value
  );
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[date.getDay()];
});

// 处理单列变化
const handleColumnChange = (columnIndex: number, value: number) => {
  console.log(`列${columnIndex}变化为:`, value);
  switch (columnIndex) {
    case 0: // 年
      selectedYear.value = years.value[value];
      // 检查日期是否有效(例如2月可能没有30日)
      checkAndFixDay();
      break;
    case 2: // 月
      selectedMonth.value = value;
      // 检查日期是否有效
      checkAndFixDay();
      break;
    case 4: // 日
      selectedDay.value = value + 1; // 天数从1开始，索引从0开始
      break;
    case 6: // 时
      selectedHour.value = value;
      break;
    case 8: // 分
      selectedMinute.value = value;
      break;
      // 单位列不需要处理
    case 1:
    case 3:
    case 5:
    case 7:
      break;
  }

  console.log('当前选择:', {
    年: selectedYear.value,
    月: selectedMonth.value + 1, // 显示时+1，使月份从1开始
    日: selectedDay.value,
    时: selectedHour.value,
    分: selectedMinute.value
  });
};

// 检查并修复日期
const checkAndFixDay = () => {
  // 获取所选月份的最大天数
  const maxDay = new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate();

  // 如果当前选择的日期超过了所选月份的最大天数，则修正为最大天数
  if (selectedDay.value > maxDay) {
    console.log(`修正日期: ${selectedDay.value} -> ${maxDay} (${selectedYear.value}年${selectedMonth.value + 1}月最大天数)`);
    selectedDay.value = maxDay;
  }
};

// 监听索引变化
const handleChange = (e: any) => {
  const newValues = e.detail.value;
  console.log('picker-view change:', newValues);

  // 按列处理变化
  for (let i = 0; i < newValues.length; i++) {
    // 跳过单位列
    if (i === 1 || i === 3 || i === 5 || i === 7) continue;

    if (newValues[i] !== valueArray.value[i]) {
      handleColumnChange(i, newValues[i]);
      break; // 同时只处理一列的变化
    }
  }
};

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false);
};

// 确认选择
const confirmSelection = () => {
  console.log('确认选择');

  // 创建新日期对象
  const selectedDate = new Date(
      selectedYear.value,
      selectedMonth.value,
      selectedDay.value,
      selectedHour.value,
      selectedMinute.value
  );

  console.log('选择的日期:', selectedDate.toLocaleString());

  emit('confirm', selectedDate);
  closePopup();
};

// 选择当前时间
const selectCurrentTime = () => {
  const now = new Date();

  selectedYear.value = now.getFullYear();
  selectedMonth.value = now.getMonth();
  selectedDay.value = now.getDate();
  selectedHour.value = now.getHours();
  selectedMinute.value = now.getMinutes();

  console.log('设置当前时间:', {
    年: selectedYear.value,
    月: selectedMonth.value + 1,
    日: selectedDay.value,
    时: selectedHour.value,
    分: selectedMinute.value
  });
};

// 监听弹窗显示状态，初始化数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    try {
      const date = new Date(props.value);

      selectedYear.value = date.getFullYear();
      selectedMonth.value = date.getMonth();
      selectedDay.value = date.getDate();
      selectedHour.value = date.getHours();
      selectedMinute.value = date.getMinutes();

      console.log('初始化日期:', {
        年: selectedYear.value,
        月: selectedMonth.value + 1,
        日: selectedDay.value,
        时: selectedHour.value,
        分: selectedMinute.value
      });
    } catch (error) {
      console.error('初始化日期出错:', error);
      // 发生错误时使用当前日期
      const now = new Date();
      selectedYear.value = now.getFullYear();
      selectedMonth.value = now.getMonth();
      selectedDay.value = now.getDate();
      selectedHour.value = now.getHours();
      selectedMinute.value = now.getMinutes();
    }
  }
});

// 格式化数字，补零
const formatNumber = (num: number): string => {
  return num.toString().padStart(2, '0');
};

// 格式化当前选择的日期时间
const formattedDateTime = computed(() => {
  return `${selectedYear.value}年${formatNumber(selectedMonth.value + 1)}月${formatNumber(selectedDay.value)}日 ${formatNumber(selectedHour.value)}:${formatNumber(selectedMinute.value)}`;
});

// 格式化月份显示（加1使其显示为1-12月）
const formatMonth = (month: number): string => {
  return formatNumber(month + 1);
};
</script>

<template>
  <up-popup :show="show" @close="closePopup" mode="bottom" :round="20">
    <div class="date-picker">
      <div class="date-picker-header">
        <div class="title">修改日期</div>
      </div>

      <!-- 当前选择的日期显示 -->
      <div class="current-date">
        <div class="date-display">
          <span>- 星期{{ weekday }} -</span>
        </div>
        <div class="current-time-btn" @click="selectCurrentTime">选择当前时间</div>
      </div>

      <!-- 使用picker-view组件 -->
      <picker-view
          class="picker-view"
          :value="valueArray"
          @change="handleChange"
          indicator-style="height: 40px; background-color: rgba(245, 245, 245, 0.5); border-radius: 6px; box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);"
          :mask-style="true"
          indicator-class="picker-indicator"
      >
        <!-- 年份列 -->
        <picker-view-column>
          <view class="picker-item" v-for="year in years" :key="year">
            {{ year }}
          </view>
        </picker-view-column>

        <!-- 年单位列 -->
        <picker-view-column>
          <view class="picker-item">年</view>
        </picker-view-column>

        <!-- 月份列 -->
        <picker-view-column>
          <view class="picker-item" v-for="(month, index) in months" :key="index">
            {{ formatMonth(month) }}
          </view>
        </picker-view-column>

        <!-- 月单位列 -->
        <picker-view-column>
          <view class="picker-item">月</view>
        </picker-view-column>

        <!-- 日期列 -->
        <picker-view-column>
          <view class="picker-item" v-for="day in days" :key="day">
            {{ formatNumber(day) }}
          </view>
        </picker-view-column>

        <!-- 日单位列 -->
        <picker-view-column>
          <view class="picker-item">日</view>
        </picker-view-column>

        <!-- 小时列 -->
        <picker-view-column>
          <view class="picker-item" v-for="hour in hours" :key="hour">
            {{ formatNumber(hour) }}
          </view>
        </picker-view-column>

        <!-- 分隔符列 -->
        <picker-view-column>
          <view class="picker-item">:</view>
        </picker-view-column>

        <!-- 分钟列 -->
        <picker-view-column>
          <view class="picker-item" v-for="minute in minutes" :key="minute">
            {{ formatNumber(minute) }}
          </view>
        </picker-view-column>
      </picker-view>

      <!-- 底部按钮 -->
      <div class="date-picker-footer">
        <div class="confirm-btn" @click="confirmSelection">确定</div>
      </div>
    </div>
  </up-popup>
</template>

<style scoped>
/* 日期选择器样式 */
.date-picker {
  padding: 20px 20px 0 20px;
  background-color: #fff;
  border-radius: 20px;
}

.date-picker-header {
  text-align: center;
}

.date-picker-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.current-date {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 20px;
}

.date-display {
  font-size: 12px;
  color: #666;
}

.selected-date-display {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

/* picker-view样式 */
.picker-view {
  height: 200px;
  width: 100%;
  margin-bottom: 20px;
}

:deep(.picker-item) {
  line-height: 40px;
  text-align: center;
  font-size: 16px;
  color: #000000;
  font-weight: normal;
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
}

:deep(.picker-view-column) {
  position: relative;
}

:deep(.picker-view-column::after) {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 40px;
  background-color: rgba(245, 245, 245, 0.5);
  border-radius: 6px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

:deep(.picker-indicator) {
  background-color: rgba(245, 245, 245, 0.5) !important;
  border-radius: 6px !important;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.picker-item[data-selected="true"]) {
  font-weight: bold;
  color: #000;
  transform: scale(1.05);
  z-index: 3;
}

/* 底部按钮样式 */
.date-picker-footer {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.current-time-btn {
  position: absolute;
  right: 0;
  padding: 5px 10px;
  border-radius: 15px;
  border: 2px solid #C3EAE5;
  font-size: 12px;
  color: #183C3A;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 30px;
  background-color: #C3EAE5;
  color: #183C3A;
  text-align: center;
  font-size: 16px;
}
</style>
