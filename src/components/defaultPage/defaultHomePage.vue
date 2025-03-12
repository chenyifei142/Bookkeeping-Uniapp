<script setup lang="ts">

import {onBeforeMount, ref} from "vue";
import {onPageScroll} from "@dcloudio/uni-app";
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
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 0))

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())

</script>

<template>
  <div class="menu-button menu-toggle" :class="toggle ? 'toggle-on' : 'toggle-off'"
       :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height+isOtherHigh}px;`">
    <slot name="title"></slot>
  </div>
  <div class="home-page">
    <div class="home-banner" :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
      <slot name="banner"></slot>
    </div>
    <slot name="content"></slot>
  </div>
</template>

<style scoped>

</style>
