<script setup lang="ts">
import {onBeforeMount, ref} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";

type menuBtnRectType = {
  top: number;
  height: number;
};
const toggle = ref(false)
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 100))

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())

</script>

<template>
  <div class="menu-button menu-toggle" :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height}px;`">
    <span class="font-lg">账本名称</span>
  </div>
  <div class="home-page">
    <div class="home-banner" :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
      <div class="flx-justify-between color-E5E">
        <div class="font-sm">2024年8月</div>
        <div class="font-sm">设置</div>
      </div>
      <div class="flex-center">
        <div class="font-bold color-0AC font-xl mgt-20">支出1500.00</div>
      </div>
      <div class="flx-justify-between color-E5E mgt-20">
        <div class="font-sm">2024年8月</div>
        <div class="font-sm">设置</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.menu-button {
  position: fixed;
  top: 0;
  z-index: 10;
  padding-top: var(--pdt, 0);
  width: 100%;
  height: var(--height, 0);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-left: 12px;
}

.toggle-on {
  background: white;
  color: #575b65;
}

.toggle-off {
  color: white;
}

.home-page {
  min-height: 100vh;
  background: #27292D;
  padding: 15px 12px env(safe-area-inset-bottom) 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .home-banner {
    margin-top: var(--mgt, 0);
    width: 100%;
    height: 200px;
    background-color: #1F2023;
    border-radius: 8px;
    z-index: 1;
    box-sizing: border-box;
    padding: 15px;
    box-shadow: 16.9px 16.9px 5.3px rgba(0, 0, 0, 0.057),
    35.4px 35.4px 17.9px rgba(0, 0, 0, 0.067),
    100px 100px 80px rgba(0, 0, 0, 0.07);
  }
}

</style>
