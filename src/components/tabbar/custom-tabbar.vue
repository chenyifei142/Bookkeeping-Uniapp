<template>
  <div class="tabbar">
    <div class="tabbar-nav">
      <div
          v-for="(item, index) in tabs"
          :key="index"
          class="tabbar-item"
          :class="{ active: currentIndex === index }"
          @click="switchTab(item.pagePath, index)"
      >
        <image :src="currentIndex === index ? item.selectedIconPath : item.iconPath" class="tabbar-icon"></image>
        <div class="tabbar-text">{{ item.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'

const props = defineProps({
  pageIndex: {
    type: Number,
    default: 0
  }
})

const currentIndex = ref(props.pageIndex)

// 监听pageIndex变化
watch(() => props.pageIndex, (newVal) => {
  currentIndex.value = newVal
})

// tabbar配置
const tabs = [
  {
    pagePath: "pages/home/index",
    text: "首页",
    iconPath: "/static/tabBar/tally.png",
    selectedIconPath: "/static/tabBar/tally-active.png"
  },
  {
    pagePath: "pages/statistics/index",
    text: "统计",
    iconPath: "/static/tabBar/scat.png",
    selectedIconPath: "/static/tabBar/scat-active.png"
  },
  {
    pagePath: "pages/my/index",
    text: "我的",
    iconPath: "/static/tabBar/user.png",
    selectedIconPath: "/static/tabBar/user-active.png"
  }
]

// 切换标签页
const switchTab = (url: string, index: number) => {
  if (currentIndex.value === index) return
  currentIndex.value = index
  uni.switchTab({
    url: `/${url}`
  })
}
</script>

<style lang="scss" scoped>
.tabbar {
  --width: 100rpx;
  --height: 120rpx;
  --size: 60rpx;
  --repeat: 3;
  --color: #FC536E;
  --radius: 20rpx;
  --rgba: rgba(255, 255, 255, 0.95);
  position: fixed;
  width: 100%;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: rgba(244,244,244, 0.75); /* #666 半透明背景 */
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  -webkit-backdrop-filter: blur(10px); /* Safari 兼容 */
  border-top: 1px solid rgba(255, 255, 255, 0.1); /* 添加微妙的分隔线 */
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); /* 轻微阴影增强立体感 */

  .tabbar-nav {
    display: grid;
    grid-template-columns: repeat(var(--repeat), 1fr);
    height: var(--height);

    .tabbar-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      transition: all 0.3s;

      &.active {
        .tabbar-text {
          color: #000000;
          font-weight: 500;
        }
      }
    }

    .tabbar-icon {
      width: 48rpx;
      height: 48rpx;
    }

    .tabbar-text {
      font-size: 20rpx;
      margin-top: 4rpx;
      color: rgba(102, 102, 102, 0.9); /* 更改为深色文字，适合浅色背景 */
    }
  }
}
</style>
