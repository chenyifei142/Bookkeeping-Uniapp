<template>
  <div class="basic-layout">
    <div class="page-content">
      <slot></slot>
    </div>
    <CustomTabbar :pageIndex="currentIndex"></CustomTabbar>
  </div>
</template>

<script setup lang="ts">
import CustomTabbar from '@/components/tabbar/custom-tabbar.vue'
import {ref, onMounted} from 'vue'
import {onShow} from '@dcloudio/uni-app'

const currentIndex = ref(0)

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
        currentIndex.value = 0
    }
  } catch (error) {
    console.error('设置当前索引失败:', error)
    currentIndex.value = 0 // 默认设置为首页
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
