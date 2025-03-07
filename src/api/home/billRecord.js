import request from '@/utils/request'

// 用户记账列表
export async function getBillRecordList(data = {}) {
    return (await request.get('/billRecord/list', data))
}

// 获取每月总支出
export async function getTotalExpenseMonthly(month) {
    return (await request.get('/statistics/totalExpenseMonthly', { month }))
}


