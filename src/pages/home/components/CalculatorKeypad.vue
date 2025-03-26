<template>
  <view>
    <!-- 键盘区域 -->
    <view class="keypad">
      <!-- 数字键盘 -->
      <view class="number-pad">
        <view v-for="num in ['7','8','9','4','5','6','1','2','3','.','0','x']"
             :key="num"
             class="key-btn"
             @tap="num !== 'x' ? handleNumberClick(num) : null"
             :class="{ 'delete-btn': num === 'x' }">
          <template v-if="num === 'x'">
            <view class="key flex-center"
                 @touchstart="handleDeleteLongPress"
                 @touchend="handleDeleteLongPressEnd"
                 @touchcancel="handleDeleteLongPressEnd">
              <up-icon name="backspace" color="000" size="30"></up-icon>
            </view>
          </template>
          <template v-else>
            {{ num }}
          </template>
        </view>
      </view>

      <!-- 操作键盘 -->
      <view class="operation-pad">
        <view class="key-btn date-btn" @tap="handleDateClick">
          {{ formattedDate }}
        </view>
        <view class="key-btn op-btn" @tap="handleMinus">-</view>
        <view class="key-btn op-btn" @tap="handlePlus">+</view>
        <view class="key-btn op-btn" @tap="calculateResult">=</view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-buttons">
      <view class="action-btn secondary flex-center" @tap="handleRecordAgain">再记</view>
      <view class="action-btn primary flex-center" @tap="handleComplete">记一笔</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 定义组件属性
defineProps({
  formattedDate: {
    type: String,
    required: true
  }
});

// 定义事件
const emit = defineEmits(['update', 'showDatePicker', 'completeAction', 'recordAgain']);

// ====================== 计算器状态与方法 ======================
// 基础状态
const amount = ref('0');                     // 当前输入的数字
const displayExpression = ref('');           // 显示的表达式
const isCalculating = ref(false);            // 是否正在计算中
const currentOperation = ref('');            // 当前运算符（+/-）
const previousAmount = ref('0');             // 第一个操作数
const waitingForSecondOperand = ref(false);  // 是否等待第二个操作数输入
const hasStartedSecondOperand = ref(false);  // 是否已开始输入第二个操作数

// 长按删除相关变量
const deleteTimer = ref<number | null>(null);
const isLongPressing = ref(false);

// 向父组件传递状态更新
const updateParent = () => {
  emit('update', {
    amount: amount.value,
    expression: displayExpression.value
  });
};

/**
 * 更新显示的计算表达式
 * 格式：第一个操作数 运算符 第二个操作数
 */
const updateDisplayExpression = () => {
  if (currentOperation.value && previousAmount.value) {
    displayExpression.value = `${previousAmount.value} ${currentOperation.value} ${hasStartedSecondOperand.value ? amount.value : ''}`;
  } else {
    displayExpression.value = '';
  }
  updateParent();
};

/**
 * 格式化数字，去除多余的小数点和零
 * @param num 需要格式化的数字
 * @returns 格式化后的数字字符串
 */
const formatNumber = (num: number): string => {
  // 转换为字符串并最多保留两位小数
  let str = parseFloat(num.toFixed(2)).toString();

  // 如果是整数，不显示小数点
  if (str.indexOf('.') > 0) {
    // 去除末尾的0
    str = str.replace(/0+$/, '');
    // 如果小数点后没有数字，去除小数点
    str = str.replace(/\.$/, '');
  }

  return str;
};

/**
 * 计算结果
 * 执行加减法运算并更新状态
 */
const calculateResult = () => {
  if (!currentOperation.value) return;

  const prev = parseFloat(previousAmount.value);
  const current = parseFloat(amount.value);
  let result = 0;

  switch (currentOperation.value) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
  }

  // 格式化结果，最多保留两位小数
  amount.value = formatNumber(result);
  previousAmount.value = amount.value;
  currentOperation.value = '';
  displayExpression.value = '';
  isCalculating.value = false;
  waitingForSecondOperand.value = false;
  hasStartedSecondOperand.value = false;
  
  updateParent();
};

/**
 * 清空所有数字
 * 重置计算器状态
 */
const clearAllNumbers = () => {
  amount.value = '0';
  currentOperation.value = '';
  displayExpression.value = '';
  previousAmount.value = '0';
  waitingForSecondOperand.value = false;
  hasStartedSecondOperand.value = false;
  isCalculating.value = false;
  
  updateParent();
};

/**
 * 处理数字点击
 * @param num 点击的数字或小数点
 */
const handleNumberClick = (num: string) => {
  if (num === 'x') {
    handleDelete();
    return;
  }

  // 如果等待第二个操作数，且当前输入的是第一个数字
  if (waitingForSecondOperand.value) {
    if (!hasStartedSecondOperand.value) {
      amount.value = '0';
      hasStartedSecondOperand.value = true;
    }
  }

  if (amount.value === '0' && num !== '.') {
    amount.value = num;
  } else {
    // 防止多个小数点
    if (num === '.' && amount.value.includes('.')) return;
    amount.value += num;
  }

  // 如果正在计算中且已开始输入第二个操作数，更新表达式显示
  if (isCalculating.value && hasStartedSecondOperand.value) {
    updateDisplayExpression();
  } else {
    updateParent();
  }
};

/**
 * 执行通用的运算符操作
 * @param operator 运算符 (+ 或 -)
 */
const handleOperator = (operator: string) => {
  // 触觉反馈
  uni.vibrateShort({
    success: () => {}
  });

  // 如果已经有未完成的操作，先计算结果
  if (currentOperation.value && hasStartedSecondOperand.value) {
    calculateResult();
  }

  // 保存当前值和操作
  previousAmount.value = amount.value;
  currentOperation.value = operator;
  waitingForSecondOperand.value = true;
  hasStartedSecondOperand.value = false; // 重置标志，表示还没开始输入第二个操作数
  isCalculating.value = true;

  // 立即更新显示表达式，显示运算符
  updateDisplayExpression();
};

/**
 * 处理加法操作
 */
const handlePlus = () => handleOperator('+');

/**
 * 处理减法操作
 */
const handleMinus = () => handleOperator('-');

/**
 * 处理删除操作
 * 按照三阶段逐步删除：
 * 1. 先删除第二个操作数
 * 2. 再删除运算符
 * 3. 最后逐位删除第一个操作数
 */
const handleDelete = () => {
  // 触觉反馈
  uni.vibrateShort({
    success: () => {}
  });

  // 阶段1: 如果正在计算中且已开始输入第二个操作数
  if (isCalculating.value && hasStartedSecondOperand.value && amount.value !== '0') {
    // 删除第二个操作数的数字
    if (amount.value.length > 1) {
      amount.value = amount.value.slice(0, -1);
    } else {
      // 如果第二个操作数只有一位，设为0并标记为未开始输入
      amount.value = '0';
      hasStartedSecondOperand.value = false;
    }
    updateDisplayExpression();
    return;
  }

  // 阶段2: 如果正在计算中且第二个操作数已被删除为0或还没开始输入第二个操作数
  if (isCalculating.value) {
    // 删除运算符，回到第一个操作数
    amount.value = previousAmount.value; // 恢复显示第一个操作数
    currentOperation.value = '';
    isCalculating.value = false;
    waitingForSecondOperand.value = false;
    displayExpression.value = '';
    updateParent();
    return;
  }

  // 阶段3: 删除第一个操作数
  if (amount.value.length > 1) {
    // 逐位删除第一个操作数
    amount.value = amount.value.slice(0, -1);
  } else if (amount.value !== '0') {
    // 如果只剩一位非零数字，删除后设为0
    amount.value = '0';
  }
  
  updateParent();
};

/**
 * 处理删除键长按开始
 * 启动计时器，如果长按超过500ms则清空所有数字
 */
const handleDeleteLongPress = () => {
  // 清除之前的计时器
  if (deleteTimer.value !== null) {
    clearTimeout(deleteTimer.value);
  }

  // 设置长按标志
  isLongPressing.value = false;

  // 启动新的计时器
  deleteTimer.value = setTimeout(() => {
    isLongPressing.value = true;
    // 长按超过500ms，清空所有数字
    clearAllNumbers();

    // 触发震动反馈
    uni.vibrateLong({
      success: () => {}
    });
  }, 500) as unknown as number; // 类型转换以解决setTimeout返回类型问题
};

/**
 * 处理删除键长按结束
 * 清除计时器
 */
const handleDeleteLongPressEnd = () => {
  if (deleteTimer.value !== null) {
    clearTimeout(deleteTimer.value);
    deleteTimer.value = null;
  }

  // 如果不是长按，则执行普通的删除操作
  if (!isLongPressing.value) {
    handleDelete();
  }

  // 重置长按标志
  isLongPressing.value = false;
};

/**
 * 处理完成按钮点击
 */
const handleComplete = () => {
  // 如果正在计算中，执行计算
  if (isCalculating.value) {
    calculateResult();
    return;
  }
  
  // 否则触发完成记账事件
  emit('completeAction');
};

/**
 * 处理再记按钮点击
 */
const handleRecordAgain = () => {
  clearAllNumbers();
  emit('recordAgain');
};

/**
 * 处理日期按钮点击
 */
const handleDateClick = () => {
  emit('showDatePicker');
};

// 初始化时同步数据到父组件
updateParent();
</script>

<style scoped>
/* 键盘区域布局 */
.keypad {
  display: flex;
  background-color: #FFFFFF;
  gap: 12px;
  margin-bottom: 12px;
}

/* 数字键盘区域 */
.number-pad {
  flex: 3;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* 操作键盘区域 */
.operation-pad {
  flex: 1;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 12px;
}

/* 键盘按钮基础样式 */
.key-btn {
  background-color: rgba(244, 244, 244, .9);
  border: none;
  border-radius: 8px;
  height: 48px;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent; /* 移除默认的蓝色高亮 */
}

.key-btn:active {
  background-color: #f0f0f0; /* 更改为淡灰色 */
}

/* 添加自定义点击效果 */
.key-btn::after {
  content: '';
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, #dedede 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform .3s, opacity .5s;
  border-radius: 8px; /* 保持与按钮相同的圆角 */
}

.key-btn:active::after {
  transform: scale(0, 0);
  opacity: .3;
  transition: 0s;
}

/* 日期按钮样式 */
.date-btn {
  font-size: 14px;
  background-color: #DCE2EE;
  color: #000;
  font-weight: 500;
}

.date-btn:active {
  background-color: #d0e8e7; /* 稍微深一点的淡绿色 */
}

/* 运算符按钮样式 */
.op-btn {
  background-color: #DBE4E1;
  color: #000000;
}

.op-btn:active {
  background-color: #d3e5f0; /* 稍微深一点的淡蓝色 */
}

/* 添加删除键长按效果 */
.delete-btn:active {
  background-color: #f0d0d0; /* 轻微红色背景表示删除操作 */
}

/* 辅助样式 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 底部按钮 */
.bottom-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background-color: #fff;
}

.action-btn {
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  margin-top: 15px;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.action-btn::after {
  content: '';
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.3) 10%, transparent 10.01%);
  background-repeat: no-repeat;
  background-position: 50%;
  transform: scale(10, 10);
  opacity: 0;
  transition: transform .3s, opacity .5s;
  border-radius: 24px;
}

.action-btn:active::after {
  transform: scale(0, 0);
  opacity: .5;
  transition: 0s;
}

.action-btn.primary {
  background-color: #C3EAE5;
  color: #183C3A;
}

.action-btn.secondary {
  background-color: #C3EAE5;
  color: #183C3A;
}
</style> 