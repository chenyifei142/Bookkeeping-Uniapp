<script setup lang="ts">

import {onBeforeMount, onMounted, ref} from "vue";
import _ from "lodash";

type menuBtnRectType = {
  top: number;
  height: number;
};
withDefaults(defineProps<{
  isOtherHigh: number
}>(), {
  isOtherHigh: 0
})

const toggle = ref(false)
const handleScroll = _.debounce((e: any) => {
  const scrollTop = e.detail.scrollTop
  console.log(scrollTop, "scrollTop")
  toggle.value = scrollTop > 200
}, 0)

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())

// 获取系统安全区域信息
const safeAreaInsetBottom = ref(0)
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  safeAreaInsetBottom.value = systemInfo.safeAreaInsets ? systemInfo.safeAreaInsets.bottom : 0
})

</script>

<template>
  <scroll-view class="contain" scroll-y show-scrollbar="false" 
               enhanced="true" 
               :style="`--safe-bottom: ${safeAreaInsetBottom}px;`"
               @scroll="handleScroll">
    <div class="menu-button menu-toggle" :class="toggle ? 'toggle-on' : 'toggle-off'"
         :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height+isOtherHigh}px;`">
      <slot name="title"></slot>
    </div>
    <div class="home-page">
      <div class="home-banner" :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
        <slot name="banner"></slot>
      </div>
      <slot name="content"></slot>
      <!-- 添加底部空白区域，确保内容可以完全滚动到底部 -->
      <div class="bottom-safe-area"></div>
    </div>
  </scroll-view>
</template>

<style scoped>
.contain {
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  /* 修改为flex布局 */
  display: flex;
  flex-direction: column;
}

.home-page {
  /* 确保home-page可以填充所有可用空间 */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bottom-safe-area {
  height: calc(30px + var(--safe-bottom, 0px));
  width: 100%;
}
</style>
