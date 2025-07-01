import request from '@/utils/request'

// 登录
export async function login(data = {}) {
    return (await request.post('/app/login', data))
}

// 注册
export async function register(data = {}) {
    return (await request.post('/app/register', data))
}

// 更新用户基本信息
export async function updateUsername(data = {}) {
    return (await request.post('/user/update', data))
}