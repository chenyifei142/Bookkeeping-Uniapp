<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import BasicLayout from "@/components/layout/basic-layout.vue";

onLaunch(() => {
  console.log("App Launch");
  
  // 设置TabBar切换时的动画效果和性能优化
  setTimeout(() => {
    // 预加载常用页面
    const pages = ['pages/home/index', 'pages/statistics/index', 'pages/my/index']
    
    pages.forEach((page) => {
      // 使用小程序提供的预加载功能
      if (typeof uni.preloadPage === 'function') {
        uni.preloadPage({
          url: `/${page}`
        })
      }
    })
  }, 1000)
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<template>
  <BasicLayout>
    <!-- 页面将在这里渲染 -->
    <view class="content">
      <router-view></router-view>
    </view>
  </BasicLayout>
</template>

<style lang="scss">
@import "uview-plus/index.scss";

/* 全局样式 */
page {
  background-color: #1A1D22;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.content {
  width: 100%;
  height: 100%;
}
</style>
