import request from '@/utils/request'

// 用户记账列表
export async function getBillRecordList(data = {}) {
    return (await request.get('/billRecord/list', data))
}

// 获取每月总支出
export async function getTotalExpenseMonthly(month) {
    return (await request.get('/statistics/totalExpenseMonthly', {month}))
}

// 账单分类列表
export async function getBillTypeList(data) {
    return (await request.get('/billType/list', data))
}

// 添加记录
export async function saveBillRecord(data) {
    return (await request.post('/billRecord/save', data))
}

// 删除记录
export async function deleteBillRecord(data) {
    return (await request.get('/billRecord/delete', data))
}

// 记录详情
export async function getBillRecordDetail(data) {
    return (await request.get('/billRecord/detail', data))
}

// 修改记录
export async function editRecordDetail(data) {
    return (await request.post('/billRecord/edit', data))
}

// 每年有记录的月份
export async function getCurrentYearRecord(data) {
    return (await request.get('/statistics/currentYearRecord', data))
}


