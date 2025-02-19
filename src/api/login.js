import request from '@/utils/request'

// 登录
export async function login(data = {}) {
    return (await request.post('/app/login', data))
}

