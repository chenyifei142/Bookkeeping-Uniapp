<template>
  <div class="category-detail-page">
    <!-- 主内容区 -->
    <div class="content-container">
      <!-- 顶部分类信息 -->
      <div class="category-header">
        <div class="category-icon-container">
          <div class="category-icon" :style="{ backgroundColor: category.bgColor || '#f5f5f5' }">
            {{ category.icon || '🍲' }}
          </div>
        </div>
        <div class="category-name">{{ category.name || '加载中...' }}</div>
        <div class="category-stats">{{ category.children?.length || 0 }}个子分类</div>

        <div class="action-buttons">
          <div class="action-button" @click="showEditCategory">
            <up-icon name="edit-pen" color="#5E5C5D" size="28"></up-icon>
            编辑
          </div>
          <div class="action-button" @click="confirmDeleteCategory">
            <up-icon name="trash" color="#C33C36" size="28"></up-icon>
            删除
          </div>
        </div>
      </div>

      <!-- 子分类部分 -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">子分类</div>
          <div class="sort-button" @click="toggleSortMode">{{ isSortMode ? '完成' : '排序' }}</div>
        </div>

        <div
            class="subcategories"
            :class="{ 'sorting-mode': isSortMode }"
        >
          <div class="subcategory-item add-item" @click="addSubcategory" v-if="!isSortMode">
            <div class="subcategory-icon add-icon">
              <up-icon name="plus" color="#5E5C5D" size="28"></up-icon>
            </div>
            <div class="subcategory-name">添加</div>
          </div>

          <div
              v-for="(sub, index) in category.children"
              :key="sub.id"
              class="subcategory-item"
              :class="{ 'dragging': currentIndex === index && isDragging }"
              :style="{
              transform: currentIndex === index ? `translate(${currentX - startX}px, ${currentY - startY}px)` : 'none',
              transition: currentIndex === index && isDragging ? 'none' : 'transform 0.2s ease',
              position: currentIndex === index ? 'relative' : 'static',
              zIndex: currentIndex === index ? 999 : 1
            }"
              @touchstart="isSortMode ? handleTouchStart($event, index) : null"
              @touchmove="isSortMode ? handleTouchMove($event, index) : null"
              @touchend="isSortMode ? handleTouchEnd(index) : null"
              @click="!isSortMode ? editSubcategory(sub) : null"
          >
            <div class="subcategory-icon" :style="{ backgroundColor: sub.bgColor || '#f5f5f5' }">{{ sub.icon }}</div>
            <div class="subcategory-name">{{ sub.name }}</div>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <div class="back-button" @click="goBack">
        返回分类列表
      </div>
    </div>
  </div>

  <!-- 编辑分类/子分类弹窗 -->
  <subcategory-editor
      :show="showModal"
      :is-editing="isEditing"
      :category-data="category"
      :subcategory-data="selectedSubcategory"
      @update:show="showModal = $event"
      @save="handleSaveSubcategory"
      @delete="handleDeleteSubcategory"
  />
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, nextTick} from 'vue'
import {onLoad} from "@dcloudio/uni-app"
import {getQuery, jumpPage, showToast} from "@/utils"
import {
  getBillTypeById,
  saveBillType,
  editBillType,
  deleteBillType,
  dragSortBillType
} from "@/api/CategoryManagement"
import SubcategoryEditor from '@/components/subcategoryEditor/index.vue'
import type {
  Category,
  Subcategory,
  SubcategoryFormData
} from './types'

// 路由参数ID
const categoryId = ref<string | null>(null)

// 页面加载
onLoad((option) => {
  const {id} = getQuery(option)
  categoryId.value = id
  getDetails(id)
})

// 分类数据
const category = reactive<Category>({
  id: 0,
  name: '',
  icon: '',
  bgColor: '#f5f5f5',
  children: [],
  quickNotes: 0,
  note: ''
})

// 获取分类详情
const getDetails = async (id: string | number) => {
  try {
    const {data} = await getBillTypeById({id})
    if (data) {
      Object.assign(category, data)
    } else {
      showToast('分类数据不存在')
      setTimeout(() => {
        goBack()
      }, 1500)
    }
  } catch (error) {
    console.error('获取分类详情失败:', error)
    showToast('获取分类详情失败')
  }
}

// 弹窗状态
const showModal = ref(false)
const isEditing = ref(false)
const selectedSubcategory = ref<Subcategory | null>(null)

// 排序相关状态
const isSortMode = ref(false)
const isDragging = ref(false)
const currentIndex = ref(-1)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const currentY = ref(0)
const initialOrder = ref<Subcategory[]>([]) // 存储初始顺序
const itemSize = ref({width: 75, height: 85}) // 子分类项的大小（包括间距）

// 返回分类列表
const goBack = () => {
  uni.navigateBack()
}

// 显示编辑父分类弹窗
const showEditCategory = () => {
  selectedSubcategory.value = null
  isEditing.value = true
  showModal.value = true
}

// 添加子分类
const addSubcategory = () => {
  selectedSubcategory.value = null
  isEditing.value = false
  showModal.value = true
}

// 编辑子分类
const editSubcategory = (subcategory: Subcategory) => {
  selectedSubcategory.value = subcategory
  isEditing.value = true
  showModal.value = true
}

// 保存子分类
const handleSaveSubcategory = async (data: SubcategoryFormData) => {
  try {
    let res

    if (isEditing.value && selectedSubcategory.value) {
      // 编辑子分类
      res = await editBillType({
        ...(selectedSubcategory.value as Subcategory),
        name: data.name,
        icon: data.icon
      })
    } else if (isEditing.value) {
      // 编辑父分类
      res = await editBillType({
        ...category,
        name: data.name,
        icon: data.icon
      })
    } else {
      // 添加子分类
      res = await saveBillType({
        icon: data.icon,
        name: data.name,
        parentId: category.id,
      })
    }

    if (res && res.msg) {
      showToast(res.msg)
    }

    // 重新获取分类详情
    await getDetails(categoryId.value as string)
  } catch (error) {
    console.error('保存分类失败:', error)
    showToast('操作失败，请重试')
  }
}

// 删除子分类
const handleDeleteSubcategory = async () => {
  try {
    if (selectedSubcategory.value) {
      // 删除子分类
      const res = await deleteBillType({id: selectedSubcategory.value.id})
      if (res && res.msg) {
        showToast(res.msg)
      }
      await getDetails(categoryId.value as string)
    }
  } catch (error) {
    console.error('删除子分类失败:', error)
    showToast('删除失败，请重试')
  }
}

// 确认删除父分类
const confirmDeleteCategory = () => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${category.name}"分类吗？此操作将同时删除所有子分类，且不可恢复！`,
    confirmColor: '#FF3B30',
    success: async (res) => {
      if (res.confirm) {
        await deleteCategory()
      }
    }
  })
}

// 删除父分类
const deleteCategory = async () => {
  try {
    const res = await deleteBillType({id: category.id})
    if (res && res.msg) {
      showToast(res.msg)
    }
    // 删除成功后返回上一页
    setTimeout(() => {
      goBack()
    }, 1500)
  } catch (error) {
    console.error('删除分类失败:', error)
    showToast('删除失败，请重试')
  }
}

// 计算所有子分类的位置信息
const calculateItemPositions = () => {
  // 不需要实际计算位置，我们改用更简单可靠的方法
  // 通过当前的布局规则，直接根据索引计算位置
}

// 切换排序模式
const toggleSortMode = () => {
  if (!isSortMode.value) {
    // 进入排序模式
    initialOrder.value = [...category.children]
    isSortMode.value = true
  } else {
    // 退出排序模式
    saveCategoryOrder()
    isSortMode.value = false
  }
}

// 保存子分类排序
const saveCategoryOrder = async () => {
  try {
    const data = category.children.map((subcategory: Subcategory, index: number) => ({
      ...subcategory,
      sort: index
    }))

    const res = await dragSortBillType(data)
    if (res && res.msg) {
      showToast(res.msg)
    }

    // 重新获取分类详情
    await getDetails(categoryId.value as string)
  } catch (error) {
    console.error('保存排序失败:', error)
    showToast('保存排序失败，请重试')
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
  startX.value = e.touches[0].clientX
  startY.value = e.touches[0].clientY
  currentX.value = startX.value
  currentY.value = startY.value
}

// 触摸移动
const handleTouchMove = (e: TouchEvent, index: number) => {
  if (!isSortMode.value || currentIndex.value !== index) return

  // 防止默认行为和事件冒泡
  e.preventDefault()
  e.stopPropagation()

  // 更新当前位置
  currentX.value = e.touches[0].clientX
  currentY.value = e.touches[0].clientY

  // 计算移动距离
  const moveX = currentX.value - startX.value
  const moveY = currentY.value - startY.value

  // 判断是否开始拖拽（移动超过5px）
  if (!isDragging.value && (Math.abs(moveX) > 5 || Math.abs(moveY) > 5)) {
    isDragging.value = true
  }

  if (isDragging.value) {
    // 检查是否需要交换位置
    checkForPositionExchange(index, moveX, moveY)
  }
}

// 检查是否需要交换位置 - 使用更简单的基于距离的交换逻辑
const checkForPositionExchange = (currentIdx: number, moveX: number, moveY: number) => {
  // 计算移动的方向和距离
  const direction = {
    x: moveX > 0 ? 1 : moveX < 0 ? -1 : 0,
    y: moveY > 0 ? 1 : moveY < 0 ? -1 : 0
  }

  // 计算每行显示的子分类数量（假设容器宽度为屏幕宽度）
  // 这里简单估计每行显示4个子分类
  const itemsPerRow = 4

  // 计算目标索引
  let targetIndex = currentIdx

  // 计算水平和垂直移动的个数
  const absX = Math.abs(moveX)
  const absY = Math.abs(moveY)

  // 如果水平移动距离足够大
  if (absX >= itemSize.value.width * 0.6) {
    const moveCount = Math.floor(absX / itemSize.value.width)
    targetIndex += direction.x * moveCount
  }

  // 如果垂直移动距离足够大
  if (absY >= itemSize.value.height * 0.6) {
    const moveCount = Math.floor(absY / itemSize.value.height)
    targetIndex += direction.y * moveCount * itemsPerRow
  }

  // 确保目标索引在有效范围内
  targetIndex = Math.max(0, Math.min(category.children.length - 1, targetIndex))

  // 如果目标索引不同，交换位置
  if (targetIndex !== currentIdx) {
    swapSubcategoryPositions(currentIdx, targetIndex)

    // 更新当前索引
    currentIndex.value = targetIndex

    // 更新拖动起始位置
    startX.value = currentX.value - (moveX % itemSize.value.width) * direction.x
    startY.value = currentY.value - (moveY % itemSize.value.height) * direction.y
  }
}

// 交换子分类位置
const swapSubcategoryPositions = (fromIndex: number, toIndex: number) => {
  // 使用数组方法将元素从当前位置移动到目标位置
  const item = category.children.splice(fromIndex, 1)[0]
  category.children.splice(toIndex, 0, item)
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
.category-detail-page {
  margin: 0 auto;
  min-height: 100vh;
  background-color: #FFFFFF;
  color: #333;
  position: relative;
}

.content-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部分类信息样式 */
.category-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.category-icon-container {
  width: 70px;
  height: 70px;
  background-color: #f5f5f5;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.category-icon {
  font-size: 36px;
}

.category-name {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 5px;
}

.category-stats {
  font-size: 14px;
  color: #888;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover, .action-button:active {
  opacity: 0.8;
}

/* 部分标题样式 */
.section {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

.section-title {
  font-size: 16px;
  color: #333;
  font-weight: 600;
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
  background-color: #E0F7FA;
}

/* 子分类样式 */
.subcategories {
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow-x: auto;
  flex-wrap: wrap;
  min-height: 90px;
  position: relative;
  background-color: #F5F5F5;
  border-radius: 15px;
}

.subcategories::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.subcategories.sorting-mode {
  background-color: #F5F5F5;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 15px;
  justify-items: center;
  padding: 15px;
  overflow: visible;
}

.subcategory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 60px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  will-change: transform;
  transform: translateZ(0);
}

.sorting-mode .subcategory-item {
  width: 60px;
  margin: 5px 0;
}

.subcategory-item:active {
  opacity: 0.8;
}

.subcategory-item.dragging {
  opacity: 0.9;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #fff;
  border-radius: 8px;
  padding: 5px;
}

.subcategory-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.add-icon {
  border: 2px dashed #ddd;
  background-color: transparent;
  color: #999;
}

.subcategory-name {
  font-size: 12px;
  color: #666;
  max-width: 60px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drag-handle {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #DEE2EB;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

/* 备注内容样式 */
.note-content {
  padding: 15px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

/* 返回按钮样式 */
.back-button {
  margin: 20px auto;
  width: 140px;
  height: 40px;
  line-height: 40px;
  border-radius: 20px;
  background-color: #DEE2EB;
  color: #4A6572;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:active {
  background-color: #C5CBD5;
}
</style>
