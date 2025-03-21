<template>
  <div class="category-header">
    <div class="title">支出分类管理</div>
    <div class="actions">
      <div class="add-button" @click="handleAddCategory">
        <up-icon name="plus-circle-fill" color="#343A38" size="25"></up-icon>
      </div>
      <div class="sort-button" @click="handleToggleSort">
        {{ isSortMode ? '完成' : '排序' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 分类管理页面顶部标题与操作区组件
 * 包含页面标题和添加、排序按钮
 */
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  isSortMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['add-category', 'toggle-sort'])

/**
 * 点击添加分类按钮
 */
const handleAddCategory = () => {
  emit('add-category')
}

/**
 * 点击切换排序模式按钮
 */
const handleToggleSort = () => {
  emit('toggle-sort')
}
</script>

<style scoped>
.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-button {
  cursor: pointer;
}

.sort-button {
  padding: 8px 15px;
  background-color: #DEE2EB;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.sort-button:active {
  background-color: #C5CBD5;
}
</style> 