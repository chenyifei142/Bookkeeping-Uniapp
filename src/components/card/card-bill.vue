<script setup lang="ts">
import CardBase from "@/components/card/card-base.vue";
/**
 * 尿尿
 */
</script>

<template>
  <card-base isAutoHeight hideBottom hideBorder class="gap-5">
    <div class="flx-justify-between width-100 color-E5E">
      <div class="font-xs">12月5日</div>
      <div class="font-xs">支出：150</div>
    </div>
    <div class="width-100" style="border-bottom: rgba(10, 203, 121, .5) solid 1px"></div>
    <div class="flex-align-start gap-10 width-100">
      <div class="card-item flx-justify-between width-100" v-for="item in 4">
        <div class="flex-start gap-10 color-E5E">
          <up-icon name="red-packet" color="#fff" size="30"></up-icon>
          <div class="font-sm">文字</div>
        </div>
        <div class="color-0AC font-sm font-bold">-150.00</div>
      </div>
    </div>
  </card-base>
</template>

<style scoped>
</style>
