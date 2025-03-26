<script setup lang="ts">
import {backPage, jumpPage, showToast} from "@/utils";
import {computed, ref, onBeforeMount, nextTick} from "vue";
import {onPageScroll, onShow} from "@dcloudio/uni-app";
import _ from "lodash";
import {getBillTypeList, saveBillRecord} from "@/api/billRecord";
import DatePicker from "@/components/datePicker/index.vue";
import SubcategoryEditor from "@/components/subcategoryEditor/index.vue";
import type {Category, Subcategory, SubcategoryFormData} from '@/pages/CategoryManagement/types';
import {saveBillType} from '@/api/CategoryManagement';
import CalculatorKeypad from '@/pages/home/components/CalculatorKeypad.vue';

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

// 子分类编辑器中使用的类型
interface SubcategoryData {
  name: string;
  icon: string;
}

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

// 页面滚动监听 - 使用节流而非防抖，提高响应性
onPageScroll(_.throttle((options: any) => {
  toggle.value = options.scrollTop > 200
}, 50))

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
  selectedDate.value = new Date(date);
  showDatePicker.value = false;
};

// ====================== 分类相关状态与方法 ======================
const selectedCategory = ref<Partial<BillType & { parentCategory?: BillType }>>({id: undefined, name: '', icon: ''})
const allCategories = ref<BillType[]>([])
const manageCategoryItem = {id: 114514, name: '管理分类', icon: 'plus'}

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
  // 使用空数组和早期退出策略优化性能
  if (!allCategories.value.length) return [];
  
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
  // 如果不是在编辑子分类的状态下，才关闭子分类编辑器
  if (!showSubcategoryEditor.value) {
    showSubcategoryEditor.value = false;
  }
}

// ====================== 计算器状态与方法 ======================
const amount = ref('0');
const displayExpression = ref('');

/**
 * 切换备注输入框的显示状态
 */
const toggleRemarkInput = () => {
  showRemarkInput.value = !showRemarkInput.value;
  if (showRemarkInput.value) {
    // 在显示输入框后，下一帧让输入框获取焦点
    nextTick(() => {
      const inputEl = document.querySelector('.remark-input') as HTMLInputElement;
      if (inputEl) inputEl.focus();
    });
  }
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
  amount.value = '0';
  displayExpression.value = '';
  remark.value = '';
};

/**
 * 处理完成或等于按钮
 * 完成记账
 */
const handleComplete = async () => {
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

// 使用节流优化触摸事件
const handleTouchStart = _.throttle((e: any) => {
  touchStartX.value = e.touches[0].clientX;
}, 50);

// 使用节流优化触摸结束事件
const handleTouchEnd = _.throttle((e: any) => {
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
}, 50);

// ====================== 生命周期钩子 ======================
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())
onShow(() => {
  getTypeList()
})

// 子分类编辑器相关状态
const showSubcategoryEditor = ref(false);
const isEditingSubcategory = ref(false);
const subcategoryToEdit = ref<BillType | null>(null);

// 处理添加子分类
const handleAddSubcategory = () => {
  isEditingSubcategory.value = false;
  subcategoryToEdit.value = null;
  showSubcategoryEditor.value = true;
}

// 保存子分类
const handleSaveSubcategory = async (subcategoryData: SubcategoryFormData) => {
  try {
    if (!currentParentCategory.value) {
      showToast('当前分类不存在');
      return;
    }
    
    // 调用API保存子分类
    const response = await saveBillType({
      icon: subcategoryData.icon,
      name: subcategoryData.name,
      parentId: currentParentCategory.value.id,
      bgColor: '#f5f5f5' // 设置默认背景色
    });
    
    if (response.code === 0) {
      showToast('添加子分类成功');
      // 关闭子分类编辑器
      showSubcategoryEditor.value = false;
      
      // 重新获取分类列表以更新子分类
      await getTypeList();
      
      // 重新打开子分类选择器并选择相同的父分类，以便看到新添加的子分类
      const parentCategoryId = currentParentCategory.value.id;
      
      // 找到刚刚更新的父分类，重新选择显示
      const updatedParentCategory = allCategories.value.find(category => category.id === parentCategoryId);
      if (updatedParentCategory) {
        currentParentCategory.value = updatedParentCategory;
      }
    } else {
      showToast(response.msg || '添加子分类失败');
    }
    
  } catch (error) {
    console.error('添加子分类失败:', error);
    showToast('添加子分类失败，请重试');
  }
}

// 计算器数据更新回调
const onCalculatorUpdate = (data: { amount: string, expression: string }) => {
  amount.value = data.amount;
  displayExpression.value = data.expression;
};
</script>

<template>
  <!-- 顶部导航栏 -->
  <view class="menu-button menu-toggle"
       :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height+15}px;`">
    <view class="flex-center">
      <view style="position: absolute;left: 10px" @tap="backPage()">
        <u-icon name="arrow-left" size="22" color="#000"></u-icon>
      </view>
      <view class="flex-align-center gap-5">
        <view class="font-bold font-xl color-000">记一笔</view>
        <!-- 分页指示器 -->
        <view class="pagination" v-if="allCategories.length > 9">
          <view v-for="(_, index) in categoryPages"
               :key="index"
               :class="['indicator', currentPage === index ? 'active' : '']"
               @tap="currentPage = index">
          </view>
        </view>
      </view>
    </view>
  </view>

  <view class="home-page">
    <!-- 顶部金额显示卡片 -->
    <view class="home-banner"
         style="padding: 0 12px"
         :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
    </view>

    <!-- 分类选择区域 - 翻页效果 -->
    <view class="categories-container">
      <!-- 分类页面容器 -->
      <view class="categories-pages"
           ref="pagesContainer"
           @touchstart="handleTouchStart"
           @touchend="handleTouchEnd">
        <view v-for="(page, pageIndex) in categoryPages"
             :key="pageIndex"
             class="categories-page"
             :style="{ transform: `translateX(${(pageIndex - currentPage) * 100}%)` }">

          <!-- 第一行分类 - 最多显示5个 -->
          <view class="categories-row">
            <view v-for="category in page.slice(0, Math.min(5, page.length))"
                 :key="category.id"
                 @tap="handleSelectedCategory(category)"
                 class="category-item">
              <view class="icon-wrapper"
                   :class="{ active: selectedCategory.id === category.id || selectedCategory.parentCategory?.id === category.id }">
                <up-icon v-if="category.id===114514" name="plus" color="#5E5C5D" size="28"></up-icon>
                <text v-else class="category-icon">{{ category.icon }}</text>
              </view>
              <text class="category-name"
                    :class="{ active: selectedCategory.id === category.id || selectedCategory.parentCategory?.id === category.id }">
                {{ category.name }}
              </text>
            </view>
          </view>

          <!-- 第二行分类 - 只有当有超过5个元素时才显示 -->
          <view class="categories-row" v-if="page.length > 5">
            <view v-for="category in page.slice(5)"
                 :key="category.id"
                 @tap="handleSelectedCategory(category)"
                 class="category-item">
              <view class="icon-wrapper"
                   :class="{ active: selectedCategory.id === category.id || selectedCategory.parentCategory?.id === category.id }">
                <up-icon v-if="category.id===114514" name="plus" color="#5E5C5D" size="28"></up-icon>
                <text v-else class="category-icon">{{ category.icon }}</text>
              </view>
              <view class="category-name"
                   :class="{ active: selectedCategory.id === category.id || selectedCategory.parentCategory?.id === category.id }">
                {{ category.name }}
              </view>
            </view>
            <!-- 如果第二行不足5个，添加空白占位元素以保持布局 -->
            <view v-for="i in 5 - (page.length - 5)"
                 :key="`empty-${i}`"
                 class="category-item-empty">
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 占位空间，确保内容不被键盘遮挡 -->
    <view class="keyboard-spacer"></view>
  </view>

  <!-- 数字键盘区域 - 固定在底部 -->
  <view class="keypad-container">
    <!-- 收支统计 -->
    <view class="summary-cards card-container">
      <!-- 类别卡片 -->
      <view class="summary-card expense">
        <view class="card-header">
          <view class="card-icon">
            <text class="emoji">{{ selectedCategory.icon || '🤖' }}</text>
          </view>
          <view class="card-title">
            <template v-if="selectedCategory.parentCategory">
              <text>{{ selectedCategory.parentCategory.name }}</text>
              <text class="category-separator"> - </text>
            </template>
            <text class="parent-category">{{ selectedCategory.name || '未选择' }}</text>
          </view>
        </view>
        <view class="card-amount">¥{{ displayExpression || amount }}</view>
      </view>

      <!-- 备注卡片 -->
      <view class="summary-card income" @tap="toggleRemarkInput">
        <view class="card-header">
          <view class="card-icon">
            <text class="emoji">📝</text>
          </view>
          <view class="card-title">备注</view>
        </view>
        <view class="card-amount remark-text" v-if="!showRemarkInput">
          {{ remark || '点击添加备注' }}
        </view>
        <view class="remark-input-container" v-else>
          <input type="text"
                 class="remark-input"
                 v-model="remark"
                 placeholder="请输入备注"
                 maxlength="50"
                 @blur="confirmRemark"
                 @confirm="confirmRemark"
                 focus
                 cursor-spacing="20"/>
        </view>
      </view>
    </view>

    <!-- 计算器键盘组件 -->
    <CalculatorKeypad 
      :formattedDate="formattedDate"
      @showDatePicker="showDatePicker = true"
      @update="onCalculatorUpdate"
      @completeAction="handleComplete"
      @recordAgain="handleRecordAgain"
    />
  </view>

  <!-- 日期选择器组件 -->
  <DatePicker :show="showDatePicker"
              :value="selectedDate"
              @update:show="showDatePicker = $event"
              @confirm="handleDateConfirm"/>

  <!-- 子分类选择弹窗 -->
  <u-popup :show="showSubCategoryPicker" mode="bottom" @close="closeSubCategoryPicker" :round="20" :safe-area-inset-bottom="true" :custom-style="{height: 'auto'}">
    <view class="sub-category-picker" style="padding-top: 40px;">
      <view class="sub-category-header">
        <view class="sub-category-title">选择子分类</view>
        <view class="sub-category-close" @tap="closeSubCategoryPicker">
          <u-icon name="close" size="20" color="#666"></u-icon>
        </view>
      </view>
      <view class="sub-category-content">
        <view v-if="currentParentCategory" class="parent-category-info">
          <text class="parent-category-icon">{{ currentParentCategory.icon }}</text>
          <text class="parent-category-name">{{ currentParentCategory.name }}</text>
        </view>
        <view class="sub-category-grid">
          <view v-for="subCategory in currentParentCategory?.children"
               :key="subCategory.id"
               class="sub-category-item"
               @tap="handleSubCategorySelect(subCategory)">
            <view class="sub-category-icon">{{ subCategory.icon }}</view>
            <view class="sub-category-name">{{ subCategory.name }}</view>
          </view>

          <!-- 添加子分类按钮 -->
          <view class="sub-category-item add-subcategory" @tap="handleAddSubcategory">
            <view class="sub-category-icon">
              <u-icon name="plus" size="24" color="#183C3A"></u-icon>
            </view>
            <view class="sub-category-name">添加</view>
          </view>
        </view>
      </view>
    </view>
  </u-popup>

  <!-- 子分类编辑器 -->
  <SubcategoryEditor
    :show="showSubcategoryEditor"
    @update:show="showSubcategoryEditor = $event"
    :is-editing="isEditingSubcategory"
    :category-data="{
      id: currentParentCategory?.id || 0,
      name: currentParentCategory?.name || '',
      icon: currentParentCategory?.icon || '',
      bgColor: '#f5f5f5',
      children: []
    }"
    :subcategory-data="null"
    @save="handleSaveSubcategory"
  />
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
.menu-button {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-top: var(--pdt);
  height: var(--height);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  transition: all 0.3s;
}

.toggle-on {
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.toggle-off {
  box-shadow: none;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

.flex-align-center {
  display: flex;
  align-items: center;
}

.gap-5 {
  gap: 5px;
}

.font-bold {
  font-weight: bold;
}

.font-xl {
  font-size: 18px;
}

.color-000 {
  color: #000;
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
  margin-top: calc(var(--height) + 10px);
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
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom)) 12px;
}

/* ====================== 子分类选择弹窗样式 ====================== */
.sub-category-picker {
  background-color: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  height: auto;
  max-height: 65vh;
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
  height: auto;
  max-height: calc(100% - 60px); /* 减去header的高度 */
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

/* 添加子分类按钮样式 */
.add-subcategory {
  background-color: #e0f2f1;
  border: 1px dashed #183C3A;
}

.add-subcategory:active {
  background-color: #c8e6c9;
}
</style>
