<template>
  <up-popup :show="show" @close="closePopup" mode="bottom" :round="20" :safe-area-inset-bottom="true" :closeable="true">
    <div class="subcategory-popup">
      <div class="popup-header">
        <div class="popup-title">{{ isEditing ? '编辑子分类' : '自定义支出类型' }}</div>
      </div>


      <div class="form-group">
        <div class="flex-center">
          <div class="selected-icon flex-center">{{ selectedIcon }}</div>
        </div>

        <!-- 类型名称输入 -->
        <div class="input-container">
          <div class="input-label">
            <up-icon name="order" color="#183C3A" size="28"></up-icon>
            类型名称
          </div>
          <input
              type="text"
              class="type-name-input"
              placeholder="点击输入名称"
              v-model="subcategoryName"
              ref="inputRef"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
          />
        </div>


        <div class="icon-selector">
          <div
              v-for="icon in filteredIcons"
              :key="icon"
              class="icon-option"
              @click="selectedIcon = icon"
          >
            {{ icon }}
          </div>
          <div class="icon-bottom-spacer"></div>
        </div>

        <div class="emoji-categories">
          <div
              v-for="category in emojiCategories"
              :key="category"
              class="category-item"
              :class="{ 'active': selectedCategory === category }"
              @click="selectedCategory = category"
          >
            {{ getCategoryIcon(category) }}
          </div>
        </div>
      </div>


      <div class="popup-footer">
        <div v-if="isEditing" @click="handleDelete" class="delete-btn">删除</div>
        <div @click="handleSave" class="confirm-btn">{{ isEditing ? '保存' : '添加' }}</div>
      </div>
    </div>
  </up-popup>
</template>

<script lang="ts" setup>
import {ref, watch, onMounted, computed} from 'vue'
import emojisData from '@/static/json/emojis.json'

// 为emojisData定义类型
interface EmojiItem {
  code: string;
  emoji: string;
  name: string;
}

interface EmojisData {
  emojis: Record<string, EmojiItem[]>;
  '@version'?: string;
  '@author'?: string;
  '@copyright'?: string;
  '@see'?: string;
  '@license'?: string;
}

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

// 定义组件的props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  categoryData: {
    type: Object as () => Category | null,
    default: () => null
  },
  subcategoryData: {
    type: Object as () => Subcategory | null,
    default: () => null
  }
})

// 定义组件的事件
const emit = defineEmits(['update:show', 'save', 'delete'])

// 子分类名称
const subcategoryName = ref('')
// 选中的图标
const selectedIcon = ref('')
// 选中的emoji分类
const selectedCategory = ref('Smileys & Emotion')
// emoji分类列表
const emojiCategories = ref<string[]>([])
// emoji数据集合，按分类存储
const emojisGrouped = ref<Record<string, string[]>>({})
// 输入框焦点状态
const inputFocused = ref(false)
// 输入框引用
const inputRef = ref(null)
// 过滤后的可用图标列表
const filteredIcons = computed(() => {
  if (emojisGrouped.value[selectedCategory.value]) {
    return emojisGrouped.value[selectedCategory.value]
  }
  return []
})

// 获取分类的代表图标
const getCategoryIcon = (category: string) => {
  const categoryIcons: Record<string, string> = {
    'Smileys & Emotion': '😀',
    'People & Body': '👋',
    'Animals & Nature': '🐵',
    'Food & Drink': '🍇',
    'Travel & Places': '🌍',
    'Activities': '🎃',
    'Objects': '👓',
    'Symbols': '❤️'
  }
  return categoryIcons[category] || '📋'
}

// 当组件挂载时处理图标列表
onMounted(() => {
  processIconList()
})

// 处理图标列表
const processIconList = () => {
  // 处理emoji分类数据
  const typedEmojisData = emojisData as unknown as EmojisData

  if (typedEmojisData && typeof typedEmojisData === 'object' && typedEmojisData.emojis) {
    // 提取所有分类
    emojiCategories.value = Object.keys(typedEmojisData.emojis || {})

    // 按分类整理emoji
    emojiCategories.value.forEach(category => {
      if (Array.isArray(typedEmojisData.emojis[category])) {
        emojisGrouped.value[category] = typedEmojisData.emojis[category].map(item => item.emoji)
      } else {
        emojisGrouped.value[category] = []
      }
    })
  }

  // 如果分类为空或数据异常，提供默认分类和表情符号
  if (emojiCategories.value.length === 0) {
    emojiCategories.value = ['默认']
    emojisGrouped.value['默认'] = ["😀", "😁", "😂", "😃", "😄", "😅", "😆"]
  }
}

// 监听弹窗显示状态，初始化数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.isEditing && props.subcategoryData) {
      subcategoryName.value = props.subcategoryData.name || ''

      // 直接使用当前图标
      selectedIcon.value = props.subcategoryData.icon || ''
    } else {
      subcategoryName.value = ''
      // 使用第一个分类的第一个表情符号
      const firstCategory = emojiCategories.value[0]
      selectedCategory.value = firstCategory
      selectedIcon.value = emojisGrouped.value[firstCategory]?.length > 0
          ? emojisGrouped.value[firstCategory][0]
          : '😀'
    }
  }
})

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false)
}

// 保存子分类
const handleSave = () => {
  if (!subcategoryName.value.trim()) {
    uni.showToast({
      title: '请输入子分类名称',
      icon: 'none'
    })
    return
  }

  emit('save', {
    name: subcategoryName.value,
    icon: selectedIcon.value
  })

  closePopup()
}

// 删除子分类
const handleDelete = () => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这个子分类吗？',
    success: (res) => {
      if (res.confirm) {
        emit('delete')
        closePopup()
      }
    }
  })
}
</script>

<style scoped>
/* 弹窗样式 */
.subcategory-popup {
  padding: 20px 20px 0 20px;
  background-color: #fff;
  border-radius: 20px;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  text-align: center;
  margin-bottom: 20px;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  width: 100%;
  flex: 1;
  overflow: hidden;
}

.form-group label {
  font-size: 14px;
  color: #666;
}

.input-container {
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 15px 0;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  transition: box-shadow 0.3s;
}

.input-container:focus-within {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.input-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4A6572;
  font-weight: 500;
  margin-right: 10px;
  margin-left: 10px;
}

.type-name-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 16px;
  color: #333;
  outline: none;
  margin-right: 10px;
}

.type-name-input::placeholder {
  color: #aaa;
}

/* emoji分类选择器样式 */
.emoji-categories {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  padding: 5px 10px;
  width: auto;
  min-width: 200px;
  max-width: 80%;
  justify-content: center;
  background-color: rgba(244, 244, 244, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  z-index: 1;
  gap: 5px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.emoji-categories::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.category-item {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  position: relative;
  color: #999;
  filter: grayscale(50%);
  opacity: 0.7;
}

.category-item:active {
  opacity: 0.6;
}

.category-item.active {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 50%;
  color: #666;
  filter: grayscale(0%);
  opacity: 1;
}

.category-item.active::after {
  display: none;
}

.selected-icon {
  font-size: 36px;
  height: 70px;
  width: 70px;
  background-color: #f4f4f4;
  border-radius: 20px;
  margin-bottom: 10px;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  overflow-y: auto;
  width: 100%;
  justify-items: center;
  background-color: #f4f4f4;
  border-radius: 10px;
  flex: 1;
  padding-bottom: 30px;
  scroll-padding-bottom: 30px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.icon-option:active {
  background-color: #f5f5f5;
}

.popup-footer {
  display: flex;
  justify-content: center;
}

.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background-color: #C3EAE5;
  color: #183C3A;
  text-align: center;
  font-size: 16px;
}

.delete-btn {
  padding: 12px 20px;
  border-radius: 30px;
  border: none;
  background-color: #f5f5f5;
  color: #F44336;
  font-size: 16px;
  cursor: pointer;
  margin-right: 8px;
}

/* 底部占位元素样式 */
.icon-bottom-spacer {
  grid-column: 1 / -1; /* 跨越所有列 */
  height: 30px; /* 足够的高度确保底部留白 */
  width: 100%;
}
</style>
