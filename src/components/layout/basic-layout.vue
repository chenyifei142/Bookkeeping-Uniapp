<template>
  <div class="basic-layout">
    <div class="page-content">
      <slot></slot>
    </div>
    <CustomTabbar 
      v-model:pageIndex="currentIndex"
      @tabChange="handleTabChange"
    ></CustomTabbar>
  </div>
</template>

<script setup lang="ts">
import CustomTabbar from '@/components/tabbar/custom-tabbar.vue'
import {ref, onMounted} from 'vue'
import {onShow} from '@dcloudio/uni-app'

const currentIndex = ref(0)

// 处理标签切换事件
const handleTabChange = (data: { url: string, index: number }) => {
  currentIndex.value = data.index
}

// 根据当前页面路径设置选中的标签页
const setCurrentIndex = () => {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const route = currentPage?.route || ''

    switch (route) {
      case 'pages/home/index':
        currentIndex.value = 0
        break
      case 'pages/statistics/index':
        currentIndex.value = 1
        break
      case 'pages/my/index':
        currentIndex.value = 2
        break
      default:
        // 保持当前索引不变，避免非标签页切换时重置索引
        // 只有在明确知道当前页面是标签页时才更新索引
        break
    }
  } catch (error) {
    console.error('设置当前索引失败:', error)
  }
}

onMounted(() => {
  setCurrentIndex()
})

onShow(() => {
  setCurrentIndex()
})
</script>

<style lang="scss" scoped>
.basic-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
}

.page-content {
  flex: 1;
  padding-bottom: 150rpx;
  background-color: #FFFFFF;
}
</style>
