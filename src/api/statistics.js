import request from '@/utils/request'

// 登录
export async function totalExpenditureByCategory(data = {}) {
    return (await request.get('/statistics/totalExpenditureByCategory', data))
}

