import request from '@/utils/request'

// 新增账单分类
export async function saveBillType(data) {
    return (await request.post('/billType/save', data))
}

// 编辑账单分类
export async function editBillType(data) {
    return (await request.post('/billType/edit', data))
}

// 删除账单分类
export async function deleteBillType(data) {
    return (await request.get('/billType/delete', data))
}

// 账单分类排序
export async function dragSortBillType(data) {
    return (await request.post('/billType/dragSort', data))
}

// 账单分类详情
export async function getBillTypeById(data) {
    return (await request.get('/billType/queryById', data))
}


