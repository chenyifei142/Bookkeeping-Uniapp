<script setup lang="ts">
const props = defineProps({
  hideBottom: {
    type: Boolean,
    default: false,
  },
  hideBorder: {
    type: Boolean,
    default: false,
  },
  isAutoHeight: {
    type: Boolean,
    default: false,
  },

});
</script>

<template>
  <div class="card flex-align-start gap-10"
       :class="['card', { 'no-bottom': !hideBottom }, { 'no-border': hideBorder }]"
       :style="{height:isAutoHeight?'100%':'180px'}">
    <div class="card-inner" v-if="!hideBottom"></div> <!-- 添加绿色边框的内层元素 -->
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.card {
  position: relative;
  box-sizing: border-box;
  padding: 15px;
  background-color: #24282E;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 50px 0 rgba(0, 0, 0, 1);

  &::before {
    content: '';
    position: absolute;
    top: -37px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 50px;
    background-color: #0C0D10;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(10, 203, 121, .5) inset; /* 内凹边框 */
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -37px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 50px;
    background-color: #0C0D10;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(10, 203, 121, .5) inset; /* 内凹边框 */
    z-index: 1;
  }

  /* 添加绿色的border效果 */
  .card-inner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: rgba(10, 203, 121, .5) 1px solid;
    border-radius: 8px;
    pointer-events: none; /* 不干扰点击事件 */
  }

  &.no-bottom::after {
    display: none;
  }

  /* 控制底部内凹边框的显示与隐藏 */
  &.no-border {
    &::after {
      box-shadow: none;
    }

    &::before {
      box-shadow: none;
    }
  }
}
</style>
