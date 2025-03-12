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
import {ref, onMounted, watch} from 'vue'
import {onShow, onLoad} from '@dcloudio/uni-app'

const currentIndex = ref(0)

// 根据当前页面路径设置选中的标签页
const setCurrentIndex = () => {
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
}

// 预加载其他标签页
const preloadTabPages = () => {
  const tabPages = [
    'pages/home/index',
    'pages/statistics/index',
    'pages/my/index'
  ]
  
  // 预加载其他页面
  tabPages.forEach(page => {
    uni.preloadPage({
      url: `/${page}`,
      success: () => {
        console.log(`预加载页面成功: ${page}`)
      },
      fail: (err) => {
        console.log(`预加载页面失败: ${page}`, err)
      }
    })
  })
}

onLoad(() => {
  // 应用启动时尝试预加载页面
  setTimeout(() => {
    preloadTabPages()
  }, 2000) // 延迟2秒执行预加载，优先加载当前页面
})

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
