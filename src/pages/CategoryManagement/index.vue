<template>
  <div class="category-container">
    <!-- 页面顶部标题与操作区 -->
    <CategoryHeader
      @add-category="showAddCategory"
      @toggle-sort="toggleSortMode"
      :is-sort-mode="isSortMode"
    />

    <!-- 分类列表 -->
    <scroll-view scroll-y class="category-page" :show-scrollbar="false" :enhanced="true">
      <div class="category-list">
        <CategoryItem
          v-for="(category, index) in categories"
          :key="category.id"
          :category="category"
          :index="index"
          :is-sort-mode="isSortMode"
          :is-dragging="isDragging"
          :current-index="currentIndex"
          :start-y="startY"
          :current-y="currentY"
          @toggle="toggleCategory"
          @add-subcategory="showAddSubcategory"
          @edit-subcategory="editSubcategory"
          @touch-start="handleTouchStart"
          @touch-move="handleTouchMove"
          @touch-end="handleTouchEnd"
        />
      </div>
    </scroll-view>

    <!-- 添加/编辑子分类弹窗 -->
    <subcategory-editor
      :show="showModal"
      :is-editing="isEditing"
      :category-data="selectedCategory"
      :subcategory-data="selectedSubcategory"
      @update:show="showModal = $event"
      @save="handleSaveSubcategory"
      @delete="handleDeleteSubcategory"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { getBillTypeList } from "@/api/billRecord"
import { jumpPage, showToast } from "@/utils"
import { onShow } from "@dcloudio/uni-app"
import SubcategoryEditor from '@/components/subcategoryEditor/index.vue'
import CategoryHeader from './components/CategoryHeader.vue'
import CategoryItem from './components/CategoryItem.vue'
import {
  deleteBillType,
  dragSortBillType,
  editBillType,
  saveBillType
} from "@/api/CategoryManagement"
import type {
  Category,
  Subcategory,
  SubcategoryFormData
} from './types'

/**
 * 状态管理
 */
// 分类列表数据
const categories = ref<Category[]>([])

// 弹窗状态
const showModal = ref(false)
const isEditing = ref(false)
const selectedCategory = ref<Category | null>(null)
const selectedSubcategory = ref<Subcategory | null>(null)

// 排序相关状态
const isSortMode = ref(false)
const currentIndex = ref(-1)
const startY = ref(0)
const currentY = ref(0)
const itemHeight = ref(92) // 每个分类项的高度（包括margin）
const isDragging = ref(false) // 标记是否正在拖拽
const initialOrder = ref<Category[]>([]) // 存储初始顺序，用于撤销排序

/**
 * 生命周期钩子
 */
onShow(async () => {
  await getTypeList()
})

/**
 * 监听器
 */
// 监听弹窗关闭时重置状态
watch(() => showModal.value, (newVal) => {
  if (!newVal) {
    resetEditorState()
  }
})

/**
 * 数据获取方法
 */
// 获取账单分类列表
const getTypeList = async () => {
  try {
    const { data } = await getBillTypeList()
    categories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    showToast('获取分类列表失败，请重试')
  }
}

/**
 * 弹窗相关方法
 */
// 重置编辑器状态
const resetEditorState = () => {
  selectedCategory.value = null
  selectedSubcategory.value = null
}

// 显示添加顶级分类弹窗
const showAddCategory = () => {
  if (isSortMode.value || isDragging.value) return
  isEditing.value = false
  showModal.value = true
}

// 显示添加子分类弹窗
const showAddSubcategory = (category: Category) => {
  if (isSortMode.value || isDragging.value) return
  selectedCategory.value = category
  isEditing.value = false
  showModal.value = true
}

// 显示编辑子分类弹窗
const editSubcategory = (category: Category, subcategory: Subcategory) => {
  if (isSortMode.value || isDragging.value) return
  selectedCategory.value = category
  selectedSubcategory.value = subcategory
  isEditing.value = true
  showModal.value = true
}

/**
 * 分类操作方法
 */
// 展开/折叠分类
const toggleCategory = (category: Category) => {
  if (isSortMode.value || isDragging.value) return
  category.expanded = !category.expanded
}

// 保存子分类 - 由子组件调用
const handleSaveSubcategory = async (data: SubcategoryFormData) => {
  try {
    let res

    if (isEditing.value && selectedSubcategory.value) {
      // 编辑现有子分类
      res = await editBillType({
        ...selectedSubcategory.value,
        name: data.name,
        icon: data.icon
      })
    } else if (selectedCategory.value) {
      // 添加子分类
      res = await saveBillType({
        icon: data.icon,
        name: data.name,
        parentId: selectedCategory.value.id,
      })
    } else {
      // 添加顶级分类
      res = await saveBillType({
        icon: data.icon,
        name: data.name,
      })
    }

    showToast(res.msg)
  } catch (error) {
    console.error('分类添加修改失败', error)
    showToast('操作失败，请重试')
  } finally {
    await getTypeList()
  }
}

// 删除子分类 - 由子组件调用
const handleDeleteSubcategory = async () => {
  try {
    if (selectedCategory.value && selectedSubcategory.value) {
      const res = await deleteBillType({id: selectedSubcategory.value.id})
      showToast(res.msg)
    }
  } catch (error) {
    console.error('删除子分类失败', error)
    showToast('删除失败，请重试')
  } finally {
    await getTypeList()
  }
}

/**
 * 排序相关方法
 */
// 切换排序模式
const toggleSortMode = () => {
  if (!isSortMode.value) {
    // 进入排序模式
    enterSortMode()
  } else {
    // 退出排序模式
    exitSortMode()
  }
}

// 进入排序模式
const enterSortMode = () => {
  // 保存初始顺序以便可以撤销
  initialOrder.value = [...categories.value]

  // 进入排序模式时，收起所有子分类列表
  categories.value.forEach((category: Category) => {
    category.expanded = false
  })

  isSortMode.value = true
}

// 退出排序模式
const exitSortMode = () => {
  saveCategoryOrder()
  isSortMode.value = false
  isDragging.value = false
  currentIndex.value = -1
}

// 保存分类顺序
const saveCategoryOrder = async () => {
  try {
    const data = categories.value.map((category, index) => ({
      ...category,
      sort: index
    }))
    const res = await dragSortBillType(data)
    showToast(res.msg)
  } catch (error) {
    console.error('保存排序失败', error)
    showToast('保存排序失败，请重试')
  } finally {
    await getTypeList()
  }
}

/**
 * 拖拽排序处理方法
 */
// 触摸开始
const handleTouchStart = (e: TouchEvent, index: number) => {
  if (!isSortMode.value) return

  // 防止默认行为和事件冒泡
  e.preventDefault()
  e.stopPropagation()

  // 初始化拖拽状态
  isDragging.value = false
  currentIndex.value = index
  startY.value = e.touches[0].clientY
  currentY.value = startY.value
}

// 触摸移动
const handleTouchMove = (e: TouchEvent, index: number) => {
  if (!isSortMode.value || currentIndex.value !== index) return

  // 防止默认行为和事件冒泡
  e.preventDefault()
  e.stopPropagation()

  // 更新当前位置
  currentY.value = e.touches[0].clientY
  const moveY = currentY.value - startY.value

  // 判断是否开始拖拽（移动超过5px）
  if (Math.abs(moveY) > 5) {
    isDragging.value = true
  }

  handleDragItemPosition(index, moveY)
}

// 处理拖拽项位置变化
const handleDragItemPosition = (index: number, moveY: number) => {
  // 计算目标位置索引
  const direction = moveY > 0 ? 1 : -1
  const absDistance = Math.abs(moveY)
  const moveCount = Math.floor(absDistance / itemHeight.value)

  // 只有当移动足够距离时才交换位置
  if (moveCount > 0) {
    let targetIndex = index + (moveCount * direction)

    // 确保目标索引在有效范围内
    targetIndex = Math.max(0, Math.min(categories.value.length - 1, targetIndex))

    if (targetIndex !== index) {
      swapCategoryPositions(index, targetIndex)
    }
  }
}

// 交换分类位置
const swapCategoryPositions = (fromIndex: number, toIndex: number) => {
  // 交换位置
  const temp = categories.value[fromIndex]
  categories.value.splice(fromIndex, 1)
  categories.value.splice(toIndex, 0, temp)

  // 更新当前索引和起始位置
  currentIndex.value = toIndex
  startY.value = currentY.value
}

// 触摸结束
const handleTouchEnd = (index: number) => {
  if (!isSortMode.value) return

  // 重置拖拽状态
  isDragging.value = false
  currentIndex.value = -1
}
</script>

<style scoped>
/* 主容器样式 */
.category-container {
  height: 100vh;
  background-color: #FFFFFF;
  position: relative;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

/* 分类列表容器 */
.category-page {
  flex: 1;
  background-color: #FFFFFF;
  position: relative;
  overflow: hidden;
}

.category-list {
  width: 100%;
  height: 100%;
  position: relative;
  padding-bottom: 20px;
}
</style>

