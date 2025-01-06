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
       :style="{height:isAutoHeight?'100%':'180px'}">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.card {
  box-sizing: border-box;
  padding: 15px;
  background-color: #24282E;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 50px 0 rgba(0, 0, 0, 1);
}
</style>
