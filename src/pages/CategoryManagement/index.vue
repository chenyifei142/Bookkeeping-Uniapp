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
            :class="{ 'sorting': isSortMode }"
            :style="{
              transform: currentIndex === index ? `translateY(${currentY - startY}px)` : 'none',
              transition: currentIndex === index ? 'none' : 'transform 0.2s ease',
              position: currentIndex === index ? 'relative' : 'static',
              zIndex: currentIndex === index ? 999 : 1
            }"
            @touchstart="handleTouchStart($event, index)"
            @touchmove="handleTouchMove($event, index)"
            @touchend="handleTouchEnd($event, index)"
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
                    {{ category.subCategories.length }}个子分类，{{ category.quickNotes }}条快捷备注
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
                      v-for="(sub, index) in category.subCategories"
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
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑子分类' : '添加子分类' }}</h3>
          <div @click="closeModal" class="close-btn">取消</div>
        </div>

        <div class="form-group">
          <label>图标</label>
          <div class="icon-selector">
            <div
                v-for="icon in availableIcons"
                :key="icon"
                class="icon-option"
                :class="{ 'selected': icon === selectedIcon }"
                @click="selectedIcon = icon"
            >
              {{ icon }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>名称</label>
          <input v-model="subcategoryName" class="input" placeholder="请输入子分类名称"/>
        </div>

        <div class="div-group">
          <div v-if="isEditing" @click="deleteSubcategory" class="delete-div">删除</div>
          <div @click="saveSubcategory" class="save-div">保存</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive} from 'vue'

const categories = ref([
  {
    id: 1,
    name: '餐饮',
    icon: '🍲',
    bgColor: '#FFF3E0',
    expanded: true,
    quickNotes: 0,
    subCategories: [
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
    subCategories: []
  },
  {
    id: 3,
    name: '饮料',
    icon: '🥤',
    bgColor: '#E3F2FD',
    expanded: false,
    quickNotes: 0,
    note: '(自定义)',
    subCategories: []
  },
  {
    id: 4,
    name: '健身',
    icon: '🏀',
    bgColor: '#FFF3E0',
    expanded: false,
    quickNotes: 0,
    note: '(自定义)',
    subCategories: []
  },
  {
    id: 5,
    name: '零食',
    icon: '🍪',
    bgColor: '#FFF8E1',
    expanded: false,
    quickNotes: 0,
    subCategories: []
  },
  {
    id: 6,
    name: '日用品',
    icon: '🧻',
    bgColor: '#F3E5F5',
    expanded: false,
    quickNotes: 0,
    subCategories: []
  },
  {
    id: 7,
    name: '水果',
    icon: '🍉',
    bgColor: '#FFEBEE',
    expanded: false,
    quickNotes: 0,
    subCategories: []
  },
  {
    id: 7,
    name: '水果',
    icon: '🍉',
    bgColor: '#FFEBEE',
    expanded: false,
    quickNotes: 0,
    subCategories: []
  },
  {
    id: 7,
    name: '水果',
    icon: '🍉',
    bgColor: '#FFEBEE',
    expanded: false,
    quickNotes: 0,
    subCategories: []
  }
])

// 弹窗状态
const showModal = ref(false)
const isEditing = ref(false)
const selectedCategory = ref(null)
const selectedSubcategory = ref(null)
const subcategoryName = ref('')
const selectedIcon = ref('')

// 可用图标列表
const availableIcons = [
  '🍳', '🍲', '🍜', '🍚', '🍖', '🍗', '🍔', '🍕', '🌮', '🌯', '🥪', '🥗',
  '🍱', '🥘', '🥓', '🍟', '🍤', '🍙', '🍘', '🍥', '🥠', '🥮', '🍡', '🥟',
  '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭',
  '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺'
]

// 排序相关状态
const isSortMode = ref(false)
const currentIndex = ref(-1)
const startY = ref(0)
const currentY = ref(0)
const itemHeight = 92 // 每个分类项的高度（包括margin）
const isDragging = ref(false) // 新增：标记是否正在拖拽

// 展开/折叠分类
const toggleCategory = (category) => {
  if (isSortMode.value || isDragging.value) return
  category.expanded = !category.expanded
}

// 显示添加子分类弹窗
const showAddSubcategory = (category) => {
  if (isSortMode.value || isDragging.value) return
  selectedCategory.value = category
  isEditing.value = false
  subcategoryName.value = ''
  selectedIcon.value = availableIcons[0]
  showModal.value = true
}

// 显示编辑子分类弹窗
const editSubcategory = (category, subcategory) => {
  if (isSortMode.value || isDragging.value) return
  selectedCategory.value = category
  selectedSubcategory.value = subcategory
  isEditing.value = true
  subcategoryName.value = subcategory.name
  selectedIcon.value = subcategory.icon
  showModal.value = true
}

// 保存子分类
const saveSubcategory = () => {
  if (!subcategoryName.value.trim()) {
    alert('请输入子分类名称')
    return
  }

  if (isEditing.value && selectedSubcategory.value) {
    // 编辑现有子分类
    selectedSubcategory.value.name = subcategoryName.value
    selectedSubcategory.value.icon = selectedIcon.value
  } else {
    // 添加新子分类
    selectedCategory.value.subCategories.push({
      icon: selectedIcon.value,
      name: subcategoryName.value
    })
  }

  closeModal()
}

// 删除子分类
const deleteSubcategory = () => {
  if (confirm('确定要删除这个子分类吗？')) {
    const index = selectedCategory.value.subCategories.findIndex(
        sub => sub === selectedSubcategory.value
    )
    if (index !== -1) {
      selectedCategory.value.subCategories.splice(index, 1)
    }
    closeModal()
  }
}

// 关闭弹窗
const closeModal = () => {
  showModal.value = false
  selectedCategory.value = null
  selectedSubcategory.value = null
}

// 返回上一页
const goBack = () => {
  // 实际应用中这里可以使用路由导航
  console.log('返回上一页')
}

// 切换排序模式
const toggleSortMode = () => {
  isSortMode.value = !isSortMode.value
  if (isSortMode.value) {
    // 进入排序模式时，收起所有子分类列表
    categories.value.forEach(category => {
      category.expanded = false
    })
  } else {
    saveCategoryOrder()
  }
}

// 触摸开始
const handleTouchStart = (e, index) => {
  if (!isSortMode.value) return
  e.preventDefault()
  isDragging.value = false
  currentIndex.value = index
  startY.value = e.touches[0].clientY
  currentY.value = e.touches[0].clientY
}

// 触摸移动
const handleTouchMove = (e, index) => {
  if (!isSortMode.value || currentIndex.value !== index) return
  e.preventDefault()
  currentY.value = e.touches[0].clientY
  const moveY = currentY.value - startY.value

  if (Math.abs(moveY) > 5) {
    isDragging.value = true
  }

  const targetIndex = Math.floor(moveY / itemHeight) + index

  if (targetIndex !== index && targetIndex >= 0 && targetIndex < categories.value.length) {
    const temp = categories.value[index]
    categories.value.splice(index, 1)
    categories.value.splice(targetIndex, 0, temp)
    currentIndex.value = targetIndex
    startY.value = currentY.value
  }
}

// 触摸结束
const handleTouchEnd = (e, index) => {
  if (!isSortMode.value) return
  e.preventDefault()
  currentIndex.value = -1
  isDragging.value = false
}

// 保存分类顺序
const saveCategoryOrder = () => {
  // TODO: 调用API保存新的分类顺序
  console.log('保存新的分类顺序:', categories.value.map(c => c.id))
}
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

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 90%;
  max-width: 320px;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #666;
}

.input {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 14px;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.icon-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #eee;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
}

.icon-option.selected {
  border-color: #2196F3;
  background-color: #E3F2FD;
}

.div-group {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.save-div {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background-color: #2196F3;
  color: white;
  font-size: 14px;
  cursor: pointer;
  flex: 1;
}

.delete-div {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  background-color: #f5f5f5;
  color: #F44336;
  font-size: 14px;
  cursor: pointer;
  margin-right: 8px;
}

/* 展开/折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
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
