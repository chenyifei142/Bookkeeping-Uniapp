<script setup lang="ts">
import { ref } from 'vue'

interface ExpenseData {
  expenses: {
    total: number
    count: number
    daily: number
  }
  income: number
  balance: number
}

interface TabData {
  key: string
  label: string
  amount: number
  color: string
}

const data: ExpenseData = {
  expenses: {
    total: 910.2,
    count: 17,
    daily: 227.55
  },
  income: 0,
  balance: -910.2
}

const tabs: TabData[] = [
  { key: 'expenses', label: '支出', amount: data.expenses.total, color: '#FFA726' },
  { key: 'income', label: '收入', amount: data.income, color: '#66BB6A' },
  { key: 'balance', label: '结余', amount: data.balance, color: '#42A5F5' }
]

const activeTab = ref('expenses')
</script>

<template>
  <div class="expense-tabs">
    <div class="tabs">
      <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
      >
        <span class="color-E5E">{{ tab.label }}</span>
        <span class="amount" :style="{ color: tab.color }">{{ tab.amount }}</span>
      </button>
    </div>
    <div class="tab-content">
      <div v-if="activeTab === 'expenses'" class="expense-details">
        <div class="detail-item">
          <span>支出笔数</span>
          <span>{{ data.expenses.count }}</span>
        </div>
        <div class="detail-item">
          <span>日均支出</span>
          <span>{{ data.expenses.daily }}</span>
        </div>
      </div>
      <div v-else-if="activeTab === 'income'" class="text-center">
        <p>暂无收入记录</p>
      </div>
      <div v-else class="text-center">
        <p>结余详情</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.expense-tabs {
  width: 100%;
  max-width: 400px;
  height: 180px;
  background-color: #24282E;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #E0E0E0;
}

.tabs {
  display: flex;
  background-color: #1E2227;
  height: 80px;
}

.tab {
  flex: 1;
  height: 100%;
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;

  &.active {
    background-color: #24282E;
  }

  span:first-child {
    font-size: 14px;
    color: #ffffff;
  }

  .amount {
    font-size: 16px;
    font-weight: bold;
    margin-top: 4px;
  }
}

.tab-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.expense-details {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-item {
  flex: 1;
  background-color: #1E2227;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;

  span:first-child {
    font-size: 14px;
    color: #A0A0A0;
  }

  span:last-child {
    font-size: 18px;
    font-weight: bold;
    margin-top: 4px;
    color: #FFFFFF;
  }
}

.text-center {
  text-align: center;
  color: #A0A0A0;
}
</style>
