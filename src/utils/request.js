// 要做登陆拦截跳转
import {getToken} from './auth'
import {jumpPage, redirectPage, showToast} from '@/utils/index'

export const baseUrl = 'http://j9sapr.natappfree.cc/bookkeeping'
// export const baseUrl = 'http://192.168.1.40:8006'

const request = (options = {}) => {
    options.header = {
        'Content-Type': 'application/json',
        'x-token': getToken() ? getToken() : ''
    }
    if (options.type === 'POST') {
        options.header = {
            'Content-Type': 'application/json', // 设置Content-Type为application/json
            'x-token': getToken() ? getToken() : ''
        }
    }

    return new Promise(async (resolve, reject) => {
        uni.request({
            url: baseUrl + options.url || '',
            method: options.type || 'GET',
            data: options.data || {},
            header: options.header || {}
        }).then(data => {
            let res = data.data
            uni.hideLoading()
            if (res.code === 407) {
                showToast('登录过期，请重新登录')
                uni.clearStorageSync()
                redirectPage('pages/login/login')
            }
            if (res.success) {
                uni.showToast({title: res.msg ?? 'error', duration: 2000, icon: 'error'})
                reject(res)
            }
            resolve(res)
        }).catch(error => {
            uni.hideLoading()
            uni.showToast({title: error.errMsg ?? 'request error', duration: 2000, icon: 'error'})
            reject(error)
        })
    })
}

const get = (url, data = null, options = {}) => {
    options.type = 'GET'
    options.data = data
    options.url = url
    return request(options)
}

const post = (url, data = null, options = {}) => {
    options.type = 'POST'
    options.data = JSON.stringify(data)
    options.url = url
    return request(options)
}


export default {
    request, get, post
}
