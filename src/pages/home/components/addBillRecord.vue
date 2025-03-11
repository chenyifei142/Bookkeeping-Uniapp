<script setup lang="ts">
import DefaultHomePage from "@/components/defaultPage/defaultHomePage.vue";
import {backPage} from "@/utils";
import CardTab from "@/components/card/card-tab.vue";
import {computed, ref, onBeforeMount, onMounted} from "vue";
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import {getBillTypeList, saveBillRecord} from "@/api/home/billRecord";

// ====================== 类型定义 ======================
type menuBtnRectType = {
  top: number;
  height: number;
};

type billType = {
  ID: number;
  name: string;
  icon: string;
};

// ====================== 布局与UI相关状态 ======================
const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
const toggle = ref(false)
const currentPage = ref(0)
const touchStartX = ref(0)
const pagesContainer = ref(null)
const show = ref(false);
const value1 = ref(Date.now());

// 页面滚动监听
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 0))

// 获取日期格式化显示
const formattedDate = computed(() => {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`
})

// ====================== 分类相关状态与方法 ======================
const selectedCategory = ref<any>({ID: '', name: '', icon: ''})
const excludeFromAccount = ref(false)
const allCategories = ref<billType[]>([])

// 获取账单分类列表
const getTypeList = async () => {
  const {data: data} = await getBillTypeList()
  allCategories.value = data
}

// 将分类分成每页最多10个（5个一行，共2行）
const categoryPages = computed(() => {
  const pages = []
  allCategories.value.push({ID: 114514, name: '管理分类', icon: 'icon'})
  for (let i = 0; i < allCategories.value.length; i += 10) {
    const page = allCategories.value.slice(i, i + 10)
    pages.push(page)
  }
  selectedCategory.value = pages[0][0]
  return pages
})

// ====================== 计算器状态与方法 ======================
// 基础状态
const amount = ref('0')                      // 当前输入的数字
const displayExpression = ref('')            // 显示的表达式
const isCalculating = ref(false)             // 是否正在计算中
const operationHistory = ref([]);            // 操作历史记录
const currentOperation = ref('');            // 当前运算符（+/-）
const previousAmount = ref('0');             // 第一个操作数
const waitingForSecondOperand = ref(false);  // 是否等待第二个操作数输入
const hasStartedSecondOperand = ref(false);  // 是否已开始输入第二个操作数

// 显示的金额或表达式
const displayAmount = computed(() => {
  // 如果有表达式，优先显示表达式
  if (displayExpression.value) {
    return displayExpression.value;
  }

  // 如果正在等待第二个操作数但还没开始输入
  if (waitingForSecondOperand.value && !hasStartedSecondOperand.value) {
    return previousAmount.value;
  }

  return amount.value;
})

// 完成按钮文本："=" 或 "完成"
const completeButtonText = computed(() => {
  return isCalculating.value ? '=' : '完成';
})

// ====================== 计算器核心功能 ======================

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
}

/**
 * 格式化数字，去除多余的小数点和零
 * @param num 需要格式化的数字
 * @returns 格式化后的数字字符串
 */
const formatNumber = (num: any) => {
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
}

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
}

/**
 * 处理数字点击
 * @param num 点击的数字或小数点
 */
const handleNumberClick = (num: any) => {
  uni.vibrateShort({
    success: function () {
      console.log('success');
    }
  });

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
  }
}

/**
 * 处理加法操作
 * 设置运算符为+并更新状态
 */
const handlePlus = () => {
  uni.vibrateShort({
    success: function () {
      console.log('success');
    }
  });

  // 如果已经有未完成的操作，先计算结果
  if (currentOperation.value && hasStartedSecondOperand.value) {
    calculateResult();
  }

  // 保存当前值和操作
  previousAmount.value = amount.value;
  currentOperation.value = '+';
  waitingForSecondOperand.value = true;
  hasStartedSecondOperand.value = false; // 重置标志，表示还没开始输入第二个操作数
  isCalculating.value = true;

  // 立即更新显示表达式，显示加号
  updateDisplayExpression();
}

/**
 * 处理减法操作
 * 设置运算符为-并更新状态
 */
const handleMinus = () => {
  uni.vibrateShort({
    success: function () {
      console.log('success');
    }
  });

  // 如果已经有未完成的操作，先计算结果
  if (currentOperation.value && hasStartedSecondOperand.value) {
    calculateResult();
  }

  // 保存当前值和操作
  previousAmount.value = amount.value;
  currentOperation.value = '-';
  waitingForSecondOperand.value = true;
  hasStartedSecondOperand.value = false; // 重置标志，表示还没开始输入第二个操作数
  isCalculating.value = true;

  // 立即更新显示表达式，显示减号
  updateDisplayExpression();
}

/**
 * 处理删除操作
 * 按照三阶段逐步删除：
 * 1. 先删除第二个操作数
 * 2. 再删除运算符
 * 3. 最后逐位删除第一个操作数
 */
const handleDelete = () => {
  uni.vibrateShort({
    success: function () {
      console.log('success');
    }
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
}

/**
 * 处理完成或等于按钮
 * 如果正在计算中则执行计算，否则完成记账
 */
const handleComplete = async () => {
  // 如果正在计算中，执行计算
  if (isCalculating.value) {
    calculateResult();
    return;
  }

  const data = await saveBillRecord({
    typeId: selectedCategory.value.toString(),
    price: amount.value,
    consumptionTime: "2025-03-10 15:02:53",
    consumptionDate: "2025-03-10 15:02:53",
  })
  console.log(data, "data")
  // 重置状态
  amount.value = '0';
  currentOperation.value = '';
  operationHistory.value = [];
  previousAmount.value = '0';
  displayExpression.value = '';
  waitingForSecondOperand.value = false;
  hasStartedSecondOperand.value = false;
  isCalculating.value = false;
}

/**
 * 处理再记按钮
 * 记录一笔并重置状态
 */
const handleRecordAgain = () => {
  console.log('再记一笔');

  // 重置所有状态
  amount.value = '0';
  currentOperation.value = '';
  operationHistory.value = [];
  previousAmount.value = '0';
  displayExpression.value = '';
  waitingForSecondOperand.value = false;
  hasStartedSecondOperand.value = false;
  isCalculating.value = false;
}

// ====================== 触摸相关事件处理 ======================

/**
 * 触摸开始事件处理
 * @param e 触摸事件对象
 */
const handleTouchStart = (e: any) => {
  touchStartX.value = e.touches[0].clientX
}

/**
 * 触摸移动事件处理
 * @param e 触摸事件对象
 */
const handleTouchMove = (e: any) => {
  // 可以添加一些视觉反馈，如果需要的话
}

/**
 * 触摸结束事件处理
 * 实现左右滑动切换分类页面
 * @param e 触摸事件对象
 */
const handleTouchEnd = (e: any) => {
  const touchEndX = e.changedTouches[0].clientX
  const diffX = touchEndX - touchStartX.value

  // 如果滑动距离足够大，则切换页面
  if (Math.abs(diffX) > 50) {
    if (diffX > 0 && currentPage.value > 0) {
      // 右滑，显示上一页
      currentPage.value--
    } else if (diffX < 0 && currentPage.value < categoryPages.value.length - 1) {
      // 左滑，显示下一页
      currentPage.value++
    }
  }
}

// ====================== 生命周期钩子 ======================
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())
onMounted(() => {
  getTypeList()
})
</script>

<template>
  <!-- 顶部导航栏 -->
  <div class="menu-button menu-toggle" :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height}px;`">
    <div class="flex-center">
      <div style="position: absolute;left: 10px" @click="backPage()">
        <u-icon name="arrow-left" size="22" color="#fff"></u-icon>
      </div>
      <span class="font-xl">记一笔</span>
    </div>
  </div>

  <div class="home-page">
    <!-- 顶部金额显示卡片 -->
    <div class="home-banner" style="padding: 0 12px"
         :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
      <card-tab isAutoHeight>
        <div class="flx-justify-between width-100">
          <div class="flex-start gap-10 color-E5E">
            <up-icon name="red-packet" color="#fff" size="40"></up-icon>
            <div class="font-sm">{{ selectedCategory.name }}</div>
          </div>
          <div class="color-0AC font-xl font-bold">{{ displayAmount }}</div>
        </div>
      </card-tab>
    </div>

    <!-- 分类选择区域 - 翻页效果 -->
    <div class="categories-container">
      <!-- 分类页面容器 -->
      <div
          class="categories-pages"
          ref="pagesContainer"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
      >
        <div
            v-for="(page, pageIndex) in categoryPages"
            :key="pageIndex"
            class="categories-page"
            :style="{ transform: `translateX(${(pageIndex - currentPage) * 100}%)` }"
        >
          <!-- 第一行分类 - 最多显示5个 -->
          <div class="categories-row">
            <div
                v-for="category in page.slice(0, Math.min(5, page.length))"
                :key="category.ID"
                @click="selectedCategory = category"
                :class="['category-item', selectedCategory.ID === category.ID ? 'active' : '']"
            >
              <div class="icon-wrapper">
                <up-icon name="red-packet" color="#fff" size="30"></up-icon>
              </div>
              <span class="category-name">{{ category.name }}</span>
            </div>
          </div>

          <!-- 第二行分类 - 只有当有超过5个元素时才显示 -->
          <div class="categories-row" v-if="page.length > 5">
            <div
                v-for="category in page.slice(5)"
                :key="category.ID"
                @click="selectedCategory = category"
                :class="['category-item', selectedCategory.ID === category.ID ? 'active' : '']"
            >
              <div class="icon-wrapper">
                <up-icon name="red-packet" color="#fff" size="30"></up-icon>
              </div>
              <span class="category-name">{{ category.name }}</span>
            </div>
            <!-- 如果第二行不足5个，添加空白占位元素以保持布局 -->
            <div v-for="i in 5 - (page.length - 5)" :key="`empty-${i}`" class="category-item-empty"></div>
          </div>
        </div>
      </div>

      <!-- 分页指示器 -->
      <div class="pagination" v-if="allCategories.length > 10">
        <div
            v-for="(_, index) in categoryPages"
            :key="index"
            :class="['indicator', currentPage === index ? 'active' : '']"
            @click="currentPage = index"
        ></div>
      </div>
    </div>

    <!-- 数字键盘区域 -->
    <div class="keypad">
      <!-- 日期选择区域 -->
      <div class="flex-start date-info">
        <div class="date-item">
          <up-datetime-picker
              :show="show"
              v-model="value1"
              mode="datetime"
              @cancel="show = false"
              @confirm="show = false"
          ></up-datetime-picker>
          <div class="flex-start" @click="show = true">
            <up-icon name="calendar" color="#fff" size="25"></up-icon>
            <span>{{ formattedDate }}</span>
          </div>
        </div>
      </div>

      <!-- 计算器按键布局 -->
      <div class="keypad-grid">
        <!-- 第一行: 7, 8, 9, 删除 -->
        <div @click="handleNumberClick('7')" class="key">7</div>
        <div @click="handleNumberClick('8')" class="key">8</div>
        <div @click="handleNumberClick('9')" class="key">9</div>
        <div @click="handleDelete" class="key flex-center">
          <up-icon name="backspace" color="#E5E5E5" size="30"></up-icon>
        </div>

        <!-- 第二行: 4, 5, 6, + -->
        <div @click="handleNumberClick('4')" class="key">4</div>
        <div @click="handleNumberClick('5')" class="key">5</div>
        <div @click="handleNumberClick('6')" class="key">6</div>
        <div @click="handlePlus" class="key">+</div>

        <!-- 第三行: 1, 2, 3, - -->
        <div @click="handleNumberClick('1')" class="key">1</div>
        <div @click="handleNumberClick('2')" class="key">2</div>
        <div @click="handleNumberClick('3')" class="key">3</div>
        <div @click="handleMinus" class="key">-</div>

        <!-- 第四行: ., 0, 再记, 完成/= -->
        <div @click="handleNumberClick('.')" class="key">.</div>
        <div @click="handleNumberClick('0')" class="key">0</div>
        <div @click="handleRecordAgain" class="key record-again">再记</div>
        <div @click="handleComplete" class="key complete">{{ completeButtonText }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.card) {
  padding: 20px 15px !important;
}

/* 页面基础样式 */
.home-page {
  padding: 15px 0 env(safe-area-inset-bottom) 0;
}

.home-banner {
  width: calc(100% - 24px); /* 让它比父容器小 12px */
}

/* 分类区域样式 */
.categories-container {
  position: relative;
  width: calc(100% - 24px); /* 让它比父容器小 12px */
  padding: 0 12px;
}

/* 分类页面容器 */
.categories-pages {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 200px; /* 根据实际内容调整高度 */
}

.categories-page {
  position: absolute;
  width: 100%;
  transition: transform 0.3s ease;
}

.categories-row {
  display: flex;
  justify-content: flex-start; /* 改为flex-start以便处理不足5个的情况 */
  gap: 10px; /* 添加间距 */
  margin-bottom: 30px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 8px;
  background-color: #33363a;
  color: #E5E5E5;
  cursor: pointer;
  width: 16%; /* 略小于20%，以便有一点间距 */
}

.category-item-empty {
  width: 16%; /* 与category-item相同的宽度 */
  visibility: hidden; /* 不可见但占据空间 */
}

.category-item.active {
  background-color: #0ACB79;
  color: white;
}

.icon-wrapper {
  padding: 4px;
  border-radius: 8px;
}

.icon {
  width: 20px;
  height: 20px;
}

.category-name {
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* 分页指示器样式 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: -18px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d1d5db;
  margin: 0 4px;
  cursor: pointer;
}

.indicator.active {
  background-color: #0ACB79;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* 日期信息样式 */
.date-info {
  gap: 16px;
  overflow-x: auto;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  padding: 10px;
  background-color: #33363a;
  border-bottom: rgba(255, 255, 255, .3) 1px solid;
}

.date-info::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.date-item {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, .6);
  white-space: nowrap;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 数字键盘样式 */
.keypad {
  margin-top: auto;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background-color: rgba(255, 255, 255, .3);
}

.key {
  padding: 20px;
  background-color: #33363a;
  text-align: center;
  font-size: 20px;
  border: none;
  cursor: pointer;
  color: #E5E5E5;
}

.record-again {
  font-size: 14px;
}

.complete {
  background-color: #0ACB79;
  font-size: 14px;
}
</style>
