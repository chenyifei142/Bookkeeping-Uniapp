<template>
  <div class="category-container">
    <div class="flx-justify-between">
      <div class="font-bold font-2xl">支出分类管理</div>
      <div class="font-sm sort-button" @click="toggleSortMode">
        {{ isSortMode ? '完成' : '排序' }}
      </div>
    </div>
    <!-- 分类列表 -->
    <scroll-view scroll-y class="category-page" :show-scrollbar="false" :enhanced="true">
      <div class="category-list">
        <div
            v-for="(category, index) in categories"
            :key="category.id"
            class="category-wrapper"
            :class="{ 'sorting': isSortMode, 'dragging': currentIndex === index && isDragging }"
            :style="{
              transform: currentIndex === index ? `translateY(${currentY - startY}px)` : 'none',
              transition: currentIndex === index && isDragging ? 'none' : 'transform 0.2s ease',
              position: currentIndex === index ? 'relative' : 'static',
              zIndex: currentIndex === index ? 999 : 1
            }"
            @touchstart="handleTouchStart($event, index)"
            @touchmove="handleTouchMove($event, index)"
            @touchend="handleTouchEnd(index)"
        >
          <div class="category-item">
            <div class="category-header" @click="toggleCategory(category)">
              <div class="category-info">
                <span class="category-icon" :style="{ backgroundColor: category.bgColor || '#f5f5f5' }">{{
                    category.icon
                  }}</span>
                <div class="category-details">
                  <div class="category-name">{{ category.name }}</div>
                  <div class="category-stats">
                    {{ category?.children?.length }}个子分类，{{ category.quickNotes }}条快捷备注
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
                  <div class="add-subcategory" @click.stop="showAddSubcategory(category)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    添加
                  </div>
                  <div
                      v-for="(sub, index) in category.children"
                      :key="index"
                      class="subcategory-item"
                      @click.stop="editSubcategory(category, sub)"
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
              </div>
            </transition>
          </div>
        </div>
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
import {ref, reactive, computed, onMounted, watch} from 'vue'
import {getBillTypeList} from "@/api/home/billRecord";
import {showToast} from "@/utils";
import {onShow} from "@dcloudio/uni-app";
import SubcategoryEditor from '@/components/subcategoryEditor/index.vue'

// 定义类型
interface Subcategory {
  icon: string;
  name: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  bgColor: string;
  expanded: boolean;
  quickNotes: number;
  children: Subcategory[];
  note?: string;
}

// 确保每个分类有唯一ID
const categories = ref<Category[]>([
  {
    id: 1,
    name: '餐饮',
    icon: '🍲',
    bgColor: '#FFF3E0',
    expanded: true,
    quickNotes: 0,
    children: [
      {icon: '🌅', name: '早餐'},
      {icon: '🌞', name: '午餐'},
      {icon: '🌙', name: '晚饭'},
      {icon: '🍜', name: '宵夜'},
    ]
  },
  {
    id: 2,
    name: '补补',
    icon: '♻️',
    bgColor: '#E8F5E9',
    expanded: false,
    quickNotes: 0,
    note: '(自定义)',
    children: []
  },
  {
    id: 3,
    name: '饮料',
    icon: '🥤',
    bgColor: '#E3F2FD',
    expanded: false,
    quickNotes: 0,
    note: '(自定义)',
    children: []
  },
  {
    id: 4,
    name: '健身',
    icon: '🏀',
    bgColor: '#FFF3E0',
    expanded: false,
    quickNotes: 0,
    note: '(自定义)',
    children: []
  },
  {
    id: 5,
    name: '零食',
    icon: '🍪',
    bgColor: '#FFF8E1',
    expanded: false,
    quickNotes: 0,
    children: []
  },
  {
    id: 6,
    name: '日用品',
    icon: '🧻',
    bgColor: '#F3E5F5',
    expanded: false,
    quickNotes: 0,
    children: []
  },
  {
    id: 7,
    name: '水果',
    icon: '🍉',
    bgColor: '#FFEBEE',
    expanded: false,
    quickNotes: 0,
    children: []
  },
  {
    id: 8,  // 修复重复ID
    name: '蔬菜',
    icon: '🥦',
    bgColor: '#E8F5E9',
    expanded: false,
    quickNotes: 0,
    children: []
  },
  {
    id: 9,  // 修复重复ID
    name: '交通',
    icon: '🚗',
    bgColor: '#E3F2FD',
    expanded: false,
    quickNotes: 0,
    children: []
  }
])

// 获取账单分类列表
const getTypeList = async () => {
  try {
    const {data} = await getBillTypeList()
    categories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    showToast('获取分类列表失败，请重试')
  }
}

onShow(async () => {
  console.log("我进来咯")
  await getTypeList()
})


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

// 展开/折叠分类
const toggleCategory = (category: Category) => {
  if (isSortMode.value || isDragging.value) return
  category.expanded = !category.expanded
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

// 监听弹窗关闭时重置状态
watch(() => showModal.value, (newVal) => {
  if (!newVal) {
    // 弹窗关闭时重置状态
    selectedCategory.value = null
    selectedSubcategory.value = null
  }
})

// 保存子分类 - 由子组件调用
const handleSaveSubcategory = (data: {name: string, icon: string}) => {
  if (isEditing.value && selectedSubcategory.value) {
    // 编辑现有子分类
    selectedSubcategory.value.name = data.name
    selectedSubcategory.value.icon = data.icon
  } else if (selectedCategory.value) {
    // 添加新子分类
    selectedCategory.value.children.push({
      icon: data.icon,
      name: data.name
    })
  }
}

// 删除子分类 - 由子组件调用
const handleDeleteSubcategory = () => {
  if (selectedCategory.value && selectedSubcategory.value) {
    const index = selectedCategory.value.children.findIndex(
      (sub: Subcategory) => sub === selectedSubcategory.value
    )
    if (index !== -1) {
      selectedCategory.value.children.splice(index, 1)
    }
  }
}

// 切换排序模式
const toggleSortMode = () => {
  if (!isSortMode.value) {
    // 进入排序模式，保存初始顺序以便可以撤销
    initialOrder.value = [...categories.value]

    // 进入排序模式时，收起所有子分类列表
    categories.value.forEach((category: Category) => {
      category.expanded = false
    })
  } else {
    // 退出排序模式，保存新顺序
    saveCategoryOrder()
  }

  isSortMode.value = !isSortMode.value
  isDragging.value = false
  currentIndex.value = -1
}

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

  // 计算目标位置索引
  const moveDistance = currentY.value - startY.value
  const direction = moveDistance > 0 ? 1 : -1
  const absDistance = Math.abs(moveDistance)
  const moveCount = Math.floor(absDistance / itemHeight.value)

  // 只有当移动足够距离时才交换位置
  if (moveCount > 0) {
    let targetIndex = index + (moveCount * direction)

    // 确保目标索引在有效范围内
    targetIndex = Math.max(0, Math.min(categories.value.length - 1, targetIndex))

    if (targetIndex !== index) {
      // 交换位置
      const temp = categories.value[index]
      categories.value.splice(index, 1)
      categories.value.splice(targetIndex, 0, temp)

      // 更新当前索引和起始位置
      currentIndex.value = targetIndex
      startY.value = currentY.value
    }
  }
}

// 触摸结束
const handleTouchEnd = (index: number) => {
  if (!isSortMode.value) return

  // 重置拖拽状态
  isDragging.value = false
  currentIndex.value = -1
}

// 保存分类顺序
const saveCategoryOrder = () => {
  // 这里可以调用API保存新的分类顺序
  console.log('保存新的分类顺序:', categories.value.map(c => c.id))

  // 示例：可以在这里添加保存到本地存储的逻辑
  try {
    uni.setStorageSync('categoryOrder', JSON.stringify(categories.value.map(c => c.id)))
    uni.showToast({
      title: '排序已保存',
      icon: 'success',
      duration: 2000
    })
  } catch (e) {
    console.error('保存排序失败', e)
  }
}

// 初始化处理
onMounted(() => {
  // 初始化逻辑可以放在这里
})
</script>

<style scoped>
.category-container {
  height: 100vh;
  background-color: #FFFFFF;
  position: relative;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.flx-justify-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.font-bold {
  font-weight: bold;
}

.font-2xl {
  font-size: 18px;
}

.font-sm {
  font-size: 14px;
}

.category-page {
  flex: 1;
  background-color: #FFFFFF;
  position: relative;
  margin-top: 15px;
  overflow: hidden;
}

.category-list {
  width: 100%;
  height: 100%;
  position: relative;
  padding-bottom: 20px;
}

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

/* 删除不再使用的弹窗样式 */
.subcategory-popup,
.popup-header,
.popup-title,
.form-group,
.input,
.icon-selector,
.icon-option,
.popup-footer,
.confirm-btn,
.delete-btn,
.modal {
  display: none;
}

.sort-button {
  padding: 8px 15px;
  background-color: #DEE2EB;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-button:active {
  background-color: #C5CBD5;
}
</style>

