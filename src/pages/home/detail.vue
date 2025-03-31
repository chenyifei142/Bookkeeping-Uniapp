<script setup lang="ts">
import {ref} from 'vue'
import {backPage, getQuery, jumpPage, showToast, formatCurrency} from "@/utils";
import {deleteBillRecord, getBillRecordDetail} from "@/api/billRecord";
import {onLoad} from "@dcloudio/uni-app";

// 定义交易记录的接口
interface TransactionRecord {
  ID?: string | number;
  price?: number;
  consumptionTime?: string;
  remark?: string;
  BillType?: {
    icon?: string;
    name?: string;
    id?: number | string;
  };
  [key: string]: any;  // 允许其他任意属性
}

const query = ref('')
// 页面加载
onLoad((option) => {
  const {id} = getQuery(option)
  query.value = id
  getDetails(id)
})

const transaction = ref<TransactionRecord>({})
const getDetails = async (id: any) => {
  const {data: data} = await getBillRecordDetail({id})
  transaction.value = data
}

// 删除交易
const deleteTransaction = async () => {
  try {
    const res = await deleteBillRecord({id: query.value})
    showToast(res.msg)
    if (res.code === 0) {
      setTimeout(() => {
        backPage()
      }, 300)
    }
  } catch (error) {
    console.log(error)
  }
}

// 编辑交易
const editTransaction = () => {
  jumpPage(`pages/home/components/addBillRecord?id=${query.value}`)
}
</script>

<template>
  <div>
    <!-- 主内容区域 - 票据样式 -->
    <div class="receipt-container">
      <!-- 上边缘三角形 -->
      <div class="receipt-edge-top">
        <div v-for="n in 20" :key="`top-${n}`" class="triangle-top"></div>
      </div>

      <div class="receipt-content">
        <div class="summary-cards card-container">
          <!-- 收入卡片 -->
          <div class="summary-card income">
            <div class="card-header">
              <div class="card-icon">
                <span class="emoji">{{ transaction.BillType?.icon }}</span>
              </div>
              <div class="card-title">类型</div>
            </div>
            <div class="card-amount">{{ transaction.BillType?.name }}</div>
          </div>

          <!-- 支出卡片 -->
          <div class="summary-card expense">
            <div class="card-header">
              <div class="card-icon">
                <span class="emoji">💸</span>
              </div>
              <div class="card-title">支出</div>
            </div>
            <div class="card-amount">{{ formatCurrency(transaction.price) }}</div>
          </div>
        </div>
        <div class="summary-card mgt-20 flx-justify-between">
          <div>📅日期</div>
          <div>{{ transaction.consumptionTime }}</div>
        </div>
      </div>

      <!-- 下边缘三角形 -->
      <div class="receipt-edge-bottom">
        <div v-for="n in 20" :key="`bottom-${n}`" class="triangle-bottom"></div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="flex-center gap-30 mgt-20">
      <div class="action-button" @click="editTransaction">
        <up-icon name="edit-pen" color="#5E5C5D" size="28"></up-icon>
      </div>
      <div class="action-button" @click="deleteTransaction">
        <up-icon name="trash" color="#C33C36" size="28"></up-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 票据样式 */
.receipt-container {
  margin: 0 12px;
  position: relative;
}

.receipt-content {
  background-color: #F4F4F4;
  padding: 10px 20px;
}

/* 收支统计卡片样式 */
.summary-cards {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.summary-card {
  flex: 1;
  background-color: #EFEFED;
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 20px;
}

.card-title {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.card-amount {
  font-size: 24px;
  font-weight: bold;
}

/* 三角形边缘 */
.receipt-edge-top, .receipt-edge-bottom {
  display: flex;
  justify-content: space-between;
  height: 10px;
  overflow: hidden;
}

.triangle-top {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #F4F4F4;
}

.triangle-bottom {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #F4F4F4;
}

.expense {
  font-size: 20px;
  font-weight: bold;
}

/* 底部按钮 */
.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 20px;
  border-radius: 20px;
  border: none;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
</style>
