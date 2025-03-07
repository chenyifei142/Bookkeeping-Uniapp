<script setup lang="ts">
import DefaultHomePage from "@/components/defaultPage/defaultHomePage.vue";
import {backPage} from "@/utils";
import CardTab from "@/components/card/card-tab.vue";
import {computed, ref, onBeforeMount} from "vue";

const amount = ref('0')
const selectedCategory = ref('餐饮日常')
const excludeFromAccount = ref(false)
const currentPage = ref(0)
const touchStartX = ref(0)
const pagesContainer = ref(null)
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";

type menuBtnRectType = {
  top: number;
  height: number;
};
const toggle = ref(false)
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 0))

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())
// 所有分类 - 18个
const allCategories = [
  {id: '餐饮日常', name: '餐饮日常'},
  {id: '居家日常', name: '居家日常'},
  {id: '购物消费', name: '购物消费'},
  {id: '交通', name: '交通'},
  {id: '汽车交通', name: '汽车交通'},
  {id: '休闲娱乐', name: '休闲娱乐'},
  {id: '零食水果', name: '零食水果'},
  {id: '居住水电', name: '居住水电'},
  {id: '医疗用品', name: '医疗用品'},
  {id: '礼物红包', name: '礼物红包'},
  {id: '信用卡', name: '信用卡'},
  {id: '旅行', name: '旅行'},
  {id: '教育', name: '教育'},
  {id: '服装', name: '服装'},
  {id: '咖啡', name: '咖啡'},
  {id: '数码', name: '数码'},
  {id: '办公', name: '办公'},
  {id: '健康', name: '健康'}
]

// 计算属性：将分类分成每页10个
const categoryPages = computed(() => {
  const pages = []
  for (let i = 0; i < allCategories.length; i += 10) {
    // 确保每页有10个元素，如果不足则用空对象填充
    const page = allCategories.slice(i, i + 10)
    while (page.length < 10) {
      page.push({id: `empty-${page.length}`, icon: null, name: ''})
    }
    pages.push(page)
  }
  return pages
})

const formattedDate = computed(() => {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`
})

const getCategoryIcon = (categoryId) => {
  const category = allCategories.find(cat => cat.id === categoryId)
  return category ? category.icon : Utensils
}

// 触摸事件处理
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchMove = (e) => {
  // 可以添加一些视觉反馈，如果需要的话
}

const handleTouchEnd = (e) => {
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

const handleNumberClick = (num) => {
  uni.vibrateShort({
    success: function () {
      console.log('success');
    }
  });
  if (amount.value === '0' && num !== '.') {
    amount.value = num
  } else {
    // 防止多个小数点
    if (num === '.' && amount.value.includes('.')) return
    amount.value += num
  }
}

const handleDelete = () => {
  if (amount.value.length > 1) {
    amount.value = amount.value.slice(0, -1)
  } else {
    amount.value = '0'
  }
}

const handlePlus = () => {
  // 实际应用中这里会有更复杂的计算逻辑
  console.log('加法操作')
}

const handleMinus = () => {
  // 实际应用中这里会有更复杂的计算逻辑
  console.log('减法操作')
}

const handleComplete = () => {
  console.log('完成记账', {
    category: selectedCategory.value,
    amount: parseFloat(amount.value),
    excludeFromAccount: excludeFromAccount.value
  })
  // 在实际应用中，这里会提交数据到服务器
  amount.value = '0'
}

const handleRecordAgain = () => {
  console.log('再记一笔')
  amount.value = '0'
}
</script>

<template>
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
    <div class="home-banner" style="padding: 0 12px"
         :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
      <card-tab isAutoHeight>
        <div class="flx-justify-between width-100">
          <div class="flex-start gap-10 color-E5E">
            <up-icon name="red-packet" color="#fff" size="40"></up-icon>
            <div class="font-sm">123</div>
          </div>
          <div class="color-0AC font-sm font-bold">123</div>
        </div>
      </card-tab>
    </div>
    <!-- 分类图标 - 翻页效果 -->
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
          <!-- 第一行分类 -->
          <div class="categories-row ">
            <div
                v-for="category in page.slice(0, 5)"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="['category-item', selectedCategory === category.id ? 'active' : '']"
            >
              <div class="icon-wrapper">
                <up-icon name="red-packet" color="#fff" size="30"></up-icon>

                <!--                <component :is="category.icon" class="icon" />-->
              </div>
              <span class="category-name">{{ category.name }}</span>
            </div>
          </div>

          <!-- 第二行分类 -->
          <div class="categories-row">
            <div
                v-for="category in page.slice(5, 10)"
                :key="category.id"
                @click="selectedCategory = category.id"
                :class="['category-item', selectedCategory === category.id ? 'active' : '']"
            >
              <div class="icon-wrapper">
                <up-icon name="red-packet" color="#fff" size="30"></up-icon>
                <!--                <component :is="category.icon" class="icon" />-->
              </div>
              <span class="category-name">{{ category.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页指示器 -->
      <div class="pagination">
        <div
            v-for="(_, index) in categoryPages"
            :key="index"
            :class="['indicator', currentPage === index ? 'active' : '']"
            @click="currentPage = index"
        ></div>
      </div>
    </div>

    <!-- 数字键盘 -->
    <div class="keypad">
      <!-- 日期信息 -->
      <div class="flex-start  date-info">
        <div class="date-item">
          <up-icon name="calendar" color="#fff" size="25"></up-icon>
          <span>{{ formattedDate }}</span>
        </div>
        <div class="date-item">
          <up-icon name="file-text" color="#fff" size="25"></up-icon>
          <span class="truncate">添加账本标签备注...</span>
        </div>
      </div>
      <div class="keypad-grid">
        <div @click="handleNumberClick('7')" class="key">7</div>
        <div @click="handleNumberClick('8')" class="key">8</div>
        <div @click="handleNumberClick('9')" class="key">9</div>
        <div @click="handleDelete" class="key flex-center">
          <up-icon name="backspace" color="#E5E5E5" size="30"></up-icon>
        </div>

        <div @click="handleNumberClick('4')" class="key">4</div>
        <div @click="handleNumberClick('5')" class="key">5</div>
        <div @click="handleNumberClick('6')" class="key">6</div>
        <div @click="handlePlus" class="key">+</div>

        <div @click="handleNumberClick('1')" class="key">1</div>
        <div @click="handleNumberClick('2')" class="key">2</div>
        <div @click="handleNumberClick('3')" class="key">3</div>
        <div @click="handleMinus" class="key">-</div>

        <div @click="handleNumberClick('.')" class="key">.</div>
        <div @click="handleNumberClick('0')" class="key">0</div>
        <div @click="handleRecordAgain" class="key record-again">再记</div>
        <div @click="handleComplete" class="key complete">完成</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding: 15px 0 env(safe-area-inset-bottom) 0;
}

.home-banner {
  width: calc(100% - 24px); /* 让它比父容器小 12px */
}

/* 分类区域 */
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
  justify-content: space-between;
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

/* 分页指示器 */
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

/* 开关区域 */
.toggle-container {
  padding: 0 16px;
  margin-bottom: 16px;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  background-color: #e5e7eb;
  padding: 12px;
  border-radius: 9999px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #fb923c;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

.toggle-label {
  margin-left: 8px;
  color: #4b5563;
}

/* 日期信息 */
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
  color: #E5E5E5;
  white-space: nowrap;
}

.date-icon {
  width: 20px;
  height: 20px;
  margin-right: 4px;
  fill: #fb923c;
  stroke: #fb923c;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 数字键盘 */
.keypad {
  margin-top: auto;
  padding-bottom:calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom:calc(16rpx + env(safe-area-inset-bottom));
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

.delete-icon {
  width: 24px;
  height: 24px;
  margin: 0 auto;
}

.record-again {
  font-size: 14px;
}

.complete {
  background-color: #0ACB79;
  font-size: 14px;
}
</style>
