<template>
  <div
      class="category-wrapper"
      :class="{ 'sorting': isSortMode, 'dragging': currentIndex === index && isDragging }"
      :style="{
      transform: currentIndex === index ? `translateY(${currentY - startY}px)` : 'none',
      transition: currentIndex === index && isDragging ? 'none' : 'transform 0.2s ease',
      position: currentIndex === index ? 'relative' : 'static',
      zIndex: currentIndex === index ? 999 : 1
    }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
  >
    <div class="category-item">
      <div class="category-header" @click="toggleCategory">
        <div class="category-info">
          <span class="category-icon" :style="{ backgroundColor: category.bgColor || '#f5f5f5' }">
            {{ category.icon }}
          </span>
          <div class="category-details">
            <div class="category-name">{{ category.name }}</div>
            <div class="category-stats">
              {{ category?.children?.length ?? 0 }}个子分类
            </div>
          </div>
        </div>
        <div class="expand-div" :class="{ 'expanded': category.expanded }">
          <up-icon :name="isSortMode ? 'list' : 'play-right-fill'" color="#343A38" size="12"></up-icon>
        </div>
      </div>

      <!-- 子分类列表 -->
      <transition name="expand">
        <div v-if="category.expanded" class="subcategories">
          <div class="subcategory-grid">
            <div class="add-subcategory" @click.stop="addSubcategory">
              添加
            </div>
            <div
                v-for="(sub, subIndex) in category.children"
                :key="subIndex"
                class="subcategory-item"
                @click.stop="editSubcategory(sub)"
            >
              <span class="subcategory-icon">{{ sub.icon }}</span>
              {{ sub.name }}
            </div>
          </div>

          <!-- 水果分类的特殊标签 -->
          <div v-if="category.name === '水果'" class="type-tags">
            <div class="type-tag active">支出</div>
            <div class="type-tag">收入</div>
          </div>

          <div v-if="category.note" class="category-note">
            {{ category.note }}
          </div>

          <!-- 添加底部编辑更多按钮 -->
          <div class="edit-more-button" @click.stop="navigateToDetails(category)">
            <span>编辑更多</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 分类项组件
 * 展示单个分类项及其子分类，支持拖拽排序
 */
import {jumpPage} from '@/utils'
import type {Category, Subcategory} from '../types'

const props = defineProps({
  // 分类数据
  category: {
    type: Object as () => Category,
    required: true
  },
  // 分类索引
  index: {
    type: Number,
    required: true
  },
  // 是否处于排序模式
  isSortMode: {
    type: Boolean,
    default: false
  },
  // 是否正在拖拽
  isDragging: {
    type: Boolean,
    default: false
  },
  // 当前拖拽项索引
  currentIndex: {
    type: Number,
    default: -1
  },
  // 触摸起始Y坐标
  startY: {
    type: Number,
    default: 0
  },
  // 当前Y坐标
  currentY: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'toggle',
  'add-subcategory',
  'edit-subcategory',
  'touch-start',
  'touch-move',
  'touch-end'
])

/**
 * 切换分类展开/折叠状态
 */
const toggleCategory = () => {
  emit('toggle', props.category)
}

/**
 * 添加子分类
 */
const addSubcategory = () => {
  emit('add-subcategory', props.category)
}

/**
 * 编辑子分类
 */
const editSubcategory = (subcategory: Subcategory) => {
  emit('edit-subcategory', props.category, subcategory)
}

/**
 * 跳转到详情页
 */
const navigateToDetails = (category: Category) => {
  jumpPage('pages/CategoryManagement/details', {id: category.id})
}

/**
 * 触摸开始事件处理
 */
const handleTouchStart = (e: TouchEvent) => {
  emit('touch-start', e, props.index)
}

/**
 * 触摸移动事件处理
 */
const handleTouchMove = (e: TouchEvent) => {
  emit('touch-move', e, props.index)
}

/**
 * 触摸结束事件处理
 */
const handleTouchEnd = () => {
  emit('touch-end', props.index)
}
</script>

<style scoped>
.category-wrapper {
  width: 100%;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  will-change: transform;
  transform: translateZ(0);
}

.category-wrapper.sorting {
  z-index: 2;
}

.category-wrapper.dragging {
  opacity: 0.9;
  z-index: 1000;
}

.category-item {
  background-color: #F4F4F4;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: grab; /* 添加抓取光标 */
  transform: translateZ(0); /* 强制硬件加速 */
}

.category-item.sorting {
  background-color: #F8F8F8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: grabbing; /* 抓取时的光标 */
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #E6E6E6;
  -webkit-tap-highlight-color: transparent; /* 移除默认的蓝色高亮 */
  min-height: 80px; /* 添加最小高度 */
  box-sizing: border-box; /* 确保padding不会影响总高度 */
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: none; /* 防止子元素影响点击事件 */
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.category-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
}

.category-stats {
  font-size: 12px;
  color: #999;
}

.expand-div {
  width: 25px;
  height: 25px;
  background-color: #DDE3E1;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
  pointer-events: none; /* 防止子元素影响点击事件 */
}

.expand-div.expanded {
  transform: rotate(90deg);
}

/* 子分类样式 */
.subcategories {
  padding: 0 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.subcategory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.add-subcategory {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 2px dashed #ddd;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-subcategory:hover {
  border-color: #666;
  color: #666;
  background-color: #f9f9f9;
}

.subcategory-item {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent; /* 移除默认的蓝色高亮 */
}

.subcategory-item:hover {
  background-color: #e9e9e9;
  transform: translateY(-2px);
}

.subcategory-icon {
  font-size: 24px;
}

.category-note {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* 水果分类的特殊标签 */
.type-tags {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
}

.type-tag {
  padding: 6px 24px;
  border-radius: 16px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  background-color: #f0f0f0;
  color: #666;
}

.type-tag.active {
  background-color: #E0F7FA;
  color: #00ACC1;
}

/* 编辑更多按钮样式 */
.edit-more-button {
  margin: 16px auto 0;
  width: 140px;
  height: 40px;
  border-radius: 20px;
  background-color: #E0F7FA;
  color: #00ACC1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edit-more-button:hover,
.edit-more-button:active {
  background-color: #B2EBF2;
  transform: translateY(-2px);
}

/* 添加展开/折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 800px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
