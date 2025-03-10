<script setup lang="ts">
import CardBase from "@/components/card/card-base.vue";

interface BillItem {
  ID: string;
  price: number;
  BillType: BillType
}

interface BillType {
  ID: number;
  IsHide: boolean;
  icon: string;
  name: string;
}

interface BillData {
  consumptionDate: number;
  total: string;
  Data: BillItem[];
}

defineProps<{
  billData: BillData
}>()
</script>

<template>
  <card-base isAutoHeight hideBottom hideBorder class="gap-5">
    <div class="flx-justify-between width-100 color-E5E">
      <div class="font-xs">{{ billData.consumptionDate }}</div>
      <div class="font-xs">支出：{{ billData.total }}</div>
    </div>
    <div class="width-100" style="border-bottom: rgba(10, 203, 121, .5) solid 1px"></div>
    <div class="flex-align-start  width-100">
      <div class="card-item flx-justify-between width-100" v-for="item in billData.Data" :key="item.ID">
        <div class="flex-start gap-10 color-E5E">
          <up-icon name="red-packet" color="#fff" size="30"></up-icon>
          <div class="font-sm">{{ item.BillType.name }}</div>
        </div>
        <div class="color-0AC font-sm font-bold">-{{ item.price}}</div>
      </div>
    </div>
  </card-base>
</template>

<style scoped>
.card-item {
  padding: 8px 0;
}
</style>
