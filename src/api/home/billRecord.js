import request from '@/utils/request'

// 用户记账列表
export async function getBillRecordList(data = {}) {
    return (await request.get('/billRecord/list', data))
}

