<script setup lang="ts">
import {backPage, jumpPage, showToast} from "@/utils";
import {computed, ref, onBeforeMount, onMounted} from "vue";
import {onPageScroll} from "@dcloudio/uni-app";
import _, { round } from "lodash";
import {getBillTypeList, saveBillRecord} from "@/api/billRecord";
import DatePicker from "@/components/datePicker/index.vue";

// ====================== 类型定义 ======================
type MenuBtnRectType = {
  top: number;
  height: number;
};

type BillType = {
  id: number;
  name: string;
  icon: string;
  children?: BillType[];
};

// ====================== 布局与UI相关状态 ======================
const menuBtnRect = ref<MenuBtnRectType>({top: 0, height: 0})
const toggle = ref(false)
const currentPage = ref(0)
const touchStartX = ref(0)
const pagesContainer = ref(null)
const showDatePicker = ref(false);
const selectedDate = ref(new Date());
const showSubCategoryPicker = ref(false);
const currentParentCategory = ref<BillType | null>(null);

// 备注相关状态
const remark = ref(''); // 备注内容
const showRemarkInput = ref(false); // 是否显示备注输入框

// 页面滚动监听
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 100))

// 获取日期格式化显示
const formattedDate = computed(() => {
  const date = new Date(selectedDate.value);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`;
})

// 日期时间相关状态
const formattedConsumptionDate = computed(() => {
  const date = new Date(selectedDate.value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
});

// 处理日期选择确认
const handleDateConfirm = (date: Date) => {
  console.log('接收到的日期:', date.toLocaleString());
  // 创建一个新的日期对象，确保Vue能检测到变化
  selectedDate.value = new Date(date);
  showDatePicker.value = false;

  // 调试输出
  console.log('更新后的日期:', selectedDate.value.toLocaleString());
  console.log('格式化后的日期:', formattedDate.value);
};

// ====================== 分类相关状态与方法 ======================
const selectedCategory = ref<Partial<BillType & { parentCategory?: BillType }>>({id: undefined, name: '', icon: ''})
const allCategories = ref<BillType[]>([])
const manageCategoryItem = {id: 114514, name: '管理分类', icon: 'icon'}

// 获取账单分类列表
const getTypeList = async () => {
  try {
    const {data} = await getBillTypeList()
    allCategories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    showToast('获取分类列表失败，请重试')
  }
}

// 将分类分成每页最多10个（5个一行，共2行）
const categoryPages = computed(() => {
  const pages: BillType[][] = []
  // 创建新数组，避免修改原数组
  const categories = [...allCategories.value, manageCategoryItem]

  for (let i = 0; i < categories.length; i += 10) {
    const page = categories.slice(i, i + 10)
    pages.push(page)
  }
  return pages
})

const handleSelectedCategory = (category: BillType) => {
  if (category.id === 114514) {
    jumpPage('pages/CategoryManagement/index')
    return;
  }

  // 如果有子分类，显示子分类选择弹窗
  if (category.children && category.children.length > 0) {
    currentParentCategory.value = category;
    showSubCategoryPicker.value = true;
    return;
  }

  // 没有子分类，直接选择
  selectedCategory.value = category;
}

// 处理子分类选择
const handleSubCategorySelect = (subCategory: BillType) => {
  // 保存子类信息和父类信息
  selectedCategory.value = {
    ...subCategory,
    parentCategory: currentParentCategory.value || undefined
  };
  showSubCategoryPicker.value = false;
  currentParentCategory.value = null;
}

// 关闭子分类选择弹窗
const closeSubCategoryPicker = () => {
  showSubCategoryPicker.value = false;
  currentParentCategory.value = null;
}

// ====================== 计算器状态与方法 ======================
// 基础状态
const amount = ref('0')                      // 当前输入的数字
const displayExpression = ref('')            // 显示的表达式
const isCalculating = ref(false)             // 是否正在计算中
const operationHistory = ref<string[]>([])   // 操作历史记录
const currentOperation = ref('')             // 当前运算符（+/-）
const previousAmount = ref('0')             // 第一个操作数
const waitingForSecondOperand = ref(false)  // 是否等待第二个操作数输入
const hasStartedSecondOperand = ref(false)  // 是否已开始输入第二个操作数

// 长按删除相关变量
const deleteTimer = ref<number | null>(null)
const isLongPressing = ref(false)

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
  console.log(amount.value, "amount.value")
  return amount.value;
})

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
 * 清空所有数字
 * 重置计算器状态
 */
const clearAllNumbers = () => {
  amount.value = '0'
  currentOperation.value = ''
  displayExpression.value = ''
  previousAmount.value = '0'
  waitingForSecondOperand.value = false
  hasStartedSecondOperand.value = false
  isCalculating.value = false
}

/**
 * 处理数字点击
 * @param num 点击的数字或小数点
 */
const handleNumberClick = (num: string) => {
  if (num === 'x') {
    handleDelete()
    return;
  }
  // uni.vibrateShort({
  //   success: function () {
  //     console.log('success');
  //   }
  // });

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
 * 执行通用的运算符操作
 * @param operator 运算符 (+ 或 -)
 */
const handleOperator = (operator: string) => {
  // 触觉反馈
  uni.vibrateShort({
    success: () => {
    }
  })

  // 如果已经有未完成的操作，先计算结果
  if (currentOperation.value && hasStartedSecondOperand.value) {
    calculateResult()
  }

  // 保存当前值和操作
  previousAmount.value = amount.value
  currentOperation.value = operator
  waitingForSecondOperand.value = true
  hasStartedSecondOperand.value = false // 重置标志，表示还没开始输入第二个操作数
  isCalculating.value = true

  // 立即更新显示表达式，显示运算符
  updateDisplayExpression()
}

/**
 * 处理加法操作
 */
const handlePlus = () => handleOperator('+')

/**
 * 处理减法操作
 */
const handleMinus = () => handleOperator('-')

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
    success: () => {
    }
  })

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
      success: () => {
      }
    })
  }, 500) as unknown as number; // 类型转换以解决setTimeout返回类型问题
}

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
}

/**
 * 重置所有状态
 */
const resetAllState = () => {
  amount.value = '0';
  currentOperation.value = '';
  operationHistory.value = [];
  previousAmount.value = '0';
  displayExpression.value = '';
  waitingForSecondOperand.value = false;
  hasStartedSecondOperand.value = false;
  isCalculating.value = false;
  remark.value = '';
}

/**
 * 切换备注输入框的显示状态
 */
const toggleRemarkInput = () => {
  showRemarkInput.value = !showRemarkInput.value;
}

/**
 * 确认备注输入
 */
const confirmRemark = () => {
  showRemarkInput.value = false;
}

/**
 * 处理再记按钮
 * 记录一笔并重置状态
 */
const handleRecordAgain = () => {
  resetAllState();
};

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

  if (!selectedCategory.value.id) {
    showToast('请选择类别！');
    return;
  }

  try {
    const response = await saveBillRecord({
      typeId: selectedCategory.value.id.toString(),
      price: amount.value,
      consumptionTime: formattedConsumptionDate.value,
      consumptionDate: formattedConsumptionDate.value,
      remark: remark.value,
    });

    if (response.code === 0) {
      backPage();
    } else {
      showToast(response.msg || '保存失败');
    }
  } catch (error) {
    console.error('保存账单记录失败:', error);
    showToast('保存失败，请重试');
  }
};

// ====================== 触摸相关事件处理 ======================

/**
 * 触摸开始事件处理
 * @param e 触摸事件对象
 */
const handleTouchStart = (e: any) => {
  touchStartX.value = e.touches[0].clientX;
};

/**
 * 触摸移动事件处理
 * @param e 触摸事件对象
 */
const handleTouchMove = (_: any) => {
  // 可以添加一些视觉反馈，如果需要的话
};

/**
 * 触摸结束事件处理
 * 实现左右滑动切换分类页面
 * @param e 触摸事件对象
 */
const handleTouchEnd = (e: any) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diffX = touchEndX - touchStartX.value;

  // 如果滑动距离足够大，则切换页面
  if (Math.abs(diffX) > 50) {
    if (diffX > 0 && currentPage.value > 0) {
      // 右滑，显示上一页
      currentPage.value--;
    } else if (diffX < 0 && currentPage.value < categoryPages.value.length - 1) {
      // 左滑，显示下一页
      currentPage.value++;
    }
  }
};

// ====================== 生命周期钩子 ======================
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())
onMounted(() => {
  getTypeList()
})
</script>

<template>
  <!-- 顶部导航栏 -->
  <div class="menu-button menu-toggle"
       :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height+15}px;`">
    <div class="flex-center">
      <div style="position: absolute;left: 10px" @click="backPage()">
        <u-icon name="arrow-left" size="22" color="#000"></u-icon>
      </div>
      <div class="flex-align-center gap-5">
        <div class="font-bold font-xl color-000">记一笔</div>
        <!-- 分页指示器 -->
        <div class="pagination" v-if="allCategories.length > 9">
          <div v-for="(_, index) in categoryPages"
               :key="index"
               :class="['indicator', currentPage === index ? 'active' : '']"
               @click="currentPage = index">
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="home-page">
    <!-- 顶部金额显示卡片 -->
    <div class="home-banner"
         style="padding: 0 12px"
         :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
    </div>

    <!-- 分类选择区域 - 翻页效果 -->
    <div class="categories-container">
      <!-- 分类页面容器 -->
      <div class="categories-pages"
           ref="pagesContainer"
           @touchstart="handleTouchStart"
           @touchmove="handleTouchMove"
           @touchend="handleTouchEnd">
        <div v-for="(page, pageIndex) in categoryPages"
             :key="pageIndex"
             class="categories-page"
             :style="{ transform: `translateX(${(pageIndex - currentPage) * 100}%)` }">

          <!-- 第一行分类 - 最多显示5个 -->
          <div class="categories-row">
            <div v-for="category in page.slice(0, Math.min(5, page.length))"
                 :key="category.id"
                 @click="handleSelectedCategory(category)"
                 class="category-item">
              <div class="icon-wrapper"
                   :class="[
                     selectedCategory.id === category.id ||
                     selectedCategory.parentCategory?.id === category.id ?
                     'active' : ''
                   ]">
                <span class="category-icon">{{ category.icon }}</span>
              </div>
              <span class="category-name"
                    :class="[
                      selectedCategory.id === category.id ||
                      selectedCategory.parentCategory?.id === category.id ?
                      'active' : ''
                    ]">
                {{ category.name }}
              </span>
            </div>
          </div>

          <!-- 第二行分类 - 只有当有超过5个元素时才显示 -->
          <div class="categories-row" v-if="page.length > 5">
            <div v-for="category in page.slice(5)"
                 :key="category.id"
                 @click="handleSelectedCategory(category)"
                 class="category-item">
              <div class="icon-wrapper"
                   :class="[
                     selectedCategory.id === category.id ||
                     selectedCategory.parentCategory?.id === category.id ?
                     'active' : ''
                   ]">
                <span class="category-icon">{{ category.icon }}</span>
              </div>
              <div class="category-name"
                   :class="[
                     selectedCategory.id === category.id ||
                     selectedCategory.parentCategory?.id === category.id ?
                     'active' : ''
                   ]">
                {{ category.name }}
              </div>
            </div>
            <!-- 如果第二行不足5个，添加空白占位元素以保持布局 -->
            <div v-for="i in 5 - (page.length - 5)"
                 :key="`empty-${i}`"
                 class="category-item-empty">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 占位空间，确保内容不被键盘遮挡 -->
    <div class="keyboard-spacer"></div>
  </div>

  <!-- 数字键盘区域 - 固定在底部 -->
  <div class="keypad-container">
    <!-- 收支统计 -->
    <div class="summary-cards card-container">
      <!-- 类别卡片 -->
      <div class="summary-card expense">
        <div class="card-header">
          <div class="card-icon">
            <span class="emoji">{{ selectedCategory.icon || '🤖' }}</span>
          </div>
          <div class="card-title">
            <template v-if="selectedCategory.parentCategory">
              <span >{{ selectedCategory.parentCategory.name }}</span>
              <span class="category-separator"> - </span>
            </template>
            <span class="parent-category">{{ selectedCategory.name|| '未选择' }}</span>
          </div>
        </div>
        <div class="card-amount">¥{{ displayAmount }}</div>
      </div>

      <!-- 备注卡片 -->
      <div class="summary-card income" @click="toggleRemarkInput">
        <div class="card-header">
          <div class="card-icon">
            <span class="emoji">📝</span>
          </div>
          <div class="card-title">备注</div>
        </div>
        <div class="card-amount remark-text" v-if="!showRemarkInput">
          {{ remark || '点击添加备注' }}
        </div>
        <div class="remark-input-container" v-else>
          <input type="text"
                 class="remark-input"
                 v-model="remark"
                 placeholder="请输入备注"
                 maxlength="50"
                 @blur="confirmRemark"
                 @confirm="confirmRemark"
                 focus
                 cursor-spacing="20"/>
        </div>
      </div>
    </div>

    <div>

    </div>

    <!-- 键盘区域 -->
    <div class="keypad">
      <!-- 数字键盘 -->
      <div class="number-pad">
        <div v-for="num in ['7','8','9','4','5','6','1','2','3','.','0','x']"
             :key="num"
             class="key-btn"
             @click="num !== 'x' ? handleNumberClick(num) : null"
             :class="{ 'delete-btn': num === 'x' }">
          <template v-if="num === 'x'">
            <div class="key flex-center"
                 @touchstart="handleDeleteLongPress"
                 @touchend="handleDeleteLongPressEnd"
                 @touchcancel="handleDeleteLongPressEnd">
              <up-icon name="backspace" color="000" size="30"></up-icon>
            </div>
          </template>
          <template v-else>
            {{ num }}
          </template>
        </div>
      </div>

      <!-- 操作键盘 -->
      <div class="operation-pad">
        <div class="key-btn date-btn" @click="showDatePicker = true">
          {{ formattedDate }}
        </div>
        <div class="key-btn op-btn" @click="handleMinus">-</div>
        <div class="key-btn op-btn" @click="handlePlus">+</div>
        <div class="key-btn op-btn" @click="calculateResult">=</div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-buttons">
      <div class="action-btn secondary flex-center" @click="handleRecordAgain">再记</div>
      <div class="action-btn primary flex-center" @click="handleComplete">记一笔</div>
    </div>
  </div>

  <!-- 日期选择器组件 -->
  <DatePicker :show="showDatePicker"
              :value="selectedDate"
              @update:show="showDatePicker = $event"
              @confirm="handleDateConfirm"/>

  <!-- 子分类选择弹窗 -->
  <u-popup :show="showSubCategoryPicker" mode="bottom" @close="closeSubCategoryPicker" :round="20">
    <div class="sub-category-picker">
      <div class="sub-category-header">
        <div class="sub-category-title">选择子分类</div>
        <div class="sub-category-close" @click="closeSubCategoryPicker">
          <u-icon name="close" size="20" color="#666"></u-icon>
        </div>
      </div>
      <div class="sub-category-content">
        <div v-if="currentParentCategory" class="parent-category-info">
          <span class="parent-category-icon">{{ currentParentCategory.icon }}</span>
          <span class="parent-category-name">{{ currentParentCategory.name }}</span>
        </div>
        <div class="sub-category-grid">
          <div v-for="subCategory in currentParentCategory?.children"
               :key="subCategory.id"
               class="sub-category-item"
               @click="handleSubCategorySelect(subCategory)">
            <div class="sub-category-icon">{{ subCategory.icon }}</div>
            <div class="sub-category-name">{{ subCategory.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </u-popup>
</template>

<style scoped>
/* 通用组件样式覆盖 */
:deep(.card) {
  padding: 20px 15px !important;
}

/* ====================== 页面基础布局 ====================== */
.home-page {
  padding: 15px 0 0 0; /* 移除底部padding，由键盘区域处理 */
  margin-bottom: calc(300px + env(safe-area-inset-bottom)); /* 为固定键盘留出空间 */
}

.home-banner {
  width: calc(100% - 24px); /* 让它比父容器小 12px */
}

/* 键盘占位空间 */
.keyboard-spacer {
  height: 20px; /* 调整高度，确保内容和键盘之间有适当间距 */
}

/* ====================== 顶部导航与分页 ====================== */
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* 分页指示器样式 */
.pagination {
  display: flex;
  justify-content: center;
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
  background-color: #000000;
}

/* ====================== 分类选择区域 ====================== */
/* 分类区域容器 */
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
  color: #E5E5E5;
  cursor: pointer;
  width: 16%; /* 略小于20%，以便有一点间距 */
  -webkit-tap-highlight-color: transparent; /* 移除默认的蓝色高亮 */
}

.category-item-empty {
  width: 16%; /* 与category-item相同的宽度 */
  visibility: hidden; /* 不可见但占据空间 */
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  background-color: #F4F4F4;
  border-radius: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.icon-wrapper.active {
  border: 2px solid #183C3A;
}

.category-icon {
  font-size: 30px;
}

.category-name {
  color: #929091;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.category-name.active {
  color: #000000;
  font-weight: bold;
}

/* ====================== 收支统计卡片 ====================== */
.summary-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  flex: 1;
  min-width: 0; /* 防止flex项目超出容器 */
  background-color: rgba(244, 244, 244, .9);
  border-radius: 12px;
  padding: 8px;
  overflow: hidden; /* 确保内容不会溢出 */
}

.card-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;
}

.card-icon {
  font-size: 20px;
  flex-shrink: 0; /* 防止图标缩小 */
}

.card-title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-amount {
  font-size: 24px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 备注相关样式 */
.remark-text {
  color: #999; /* 使用灰色表示暂无备注 */
  font-size: 18px; /* 稍微小一点的字体 */
}

.remark-input-container {
  width: 100%;
  position: relative;
}

.remark-input {
  width: 100%;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid #C3EAE5;
  font-size: 18px;
  padding: 6px 0;
  color: #333;
  outline: none;
  font-weight: 500;
}

.remark-input::placeholder {
  color: #aaa;
  font-size: 16px;
  font-weight: normal;
}

/* 为备注卡片添加点击效果 */
.summary-card.income {
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.summary-card.income:active {
  background-color: #eaeaea;
}

/* ====================== 数字键盘区域 ====================== */
.keypad-container {
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 12px 12px env(safe-area-inset-bottom) 12px;
  min-height: 750rpx; /* 添加最小高度 */
}

.keypad {
  display: flex;
  background-color: #FFFFFF;
  gap: 12px;
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
  cursor: pointer;
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

/* ====================== 底部按钮 ====================== */
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
  cursor: pointer;
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

.action-btn.primary:active {
  background-color: #C3EAE5;
}

.action-btn.secondary {
  background-color: #C3EAE5;
  color: #183C3A;
}

/* 子分类选择弹窗样式 */
.sub-category-picker {
  background-color: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  height: 750rpx; /* 修改为与keypad-container相同的高度 */
  overflow-y: auto;
}

.sub-category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sub-category-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.sub-category-close {
  padding: 5px;
}

.parent-category-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 15px;
}

.parent-category-icon {
  font-size: 24px;
}

.parent-category-name {
  font-size: 16px;
  color: #666;
}

.sub-category-content {
  height: calc(100% - 60px); /* 减去header的高度 */
  overflow-y: auto;
}

.sub-category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding-bottom: 20px; /* 添加底部内边距，确保最后一个项目可以完全显示 */
}

.sub-category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.sub-category-item:active {
  background-color: #e0e0e0;
}

.sub-category-icon {
  font-size: 24px;
}

.sub-category-name {
  font-size: 14px;
  color: #333;
  text-align: center;
}

/* 父类-子类组合显示样式 */
.parent-category {
  font-size: 14px;
  color: #888;
}

.category-separator {
  font-size: 14px;
  color: #999;
  margin: 0 2px;
}
</style>
