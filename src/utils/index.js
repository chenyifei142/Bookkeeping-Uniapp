import {baseUrl} from '@/utils/request'
import { formatAmount, formatCurrency } from '@/utils/format'

export const jumpPage = (path, query = {}) => {
    uni.navigateTo({url: `/${path}?query=${encodeURIComponent(JSON.stringify(query))}`})
}

export const getQuery = (options) => {
    return JSON.parse(decodeURIComponent(options.query))
}

export const backPage = () => {
    const pages = getCurrentPages();

    if (pages.length > 1) {
        uni.navigateBack({});
    } else {
        // 没有上一级页面，跳转到指定的tab页
        uni.reLaunch({
            url: '/pages/my/index'
        });
    }
}

export const redirectPage = (path) => {
    uni.redirectTo({url: `/${path}`})
}

export const reLaunchPage = (path, params) => {
    uni.reLaunch({url: `/${path}${params ? `?${params}` : ''}`})
}

export const refreshPage = (params) => {
    uni.redirectTo({url: `/${getCurrentPages()[getCurrentPages().length - 1].route}${params ? `?${params}` : ''}`})
}

export const showToast = (title, mask = false, icon = 'none') => {
    uni.showToast({title, duration: 2000, icon, mask})
}

export const uploadFile = (file) => new Promise((resolve, reject) => {
    uni.showLoading({mask: true})
    uni.uploadFile({
        url: `${baseUrl}/common/file/ali-upload`,
        name: 'file',
        filePath: file,
        header: {'Authorization': "Bearer " + uni.getStorageSync('Authorization')},
        success: (res) => resolve(JSON.parse(res.data)),
        fail: (res) => {
            console.log(res.errMsg,"errMsg")
            reject(res.errMsg)
        },
        complete: () => uni.hideLoading()
    })
})

export const getFileIds = async (fileList) => {
    const fileIds = []
    for (const item of fileList) fileIds.push((await uploadFile(item)).data.fileId)
    return fileIds
}

export const getFiles = async (fileList) => {
    const fileIds = []
    for (const item of fileList) fileIds.push((await uploadFile(item)).data)
    return fileIds
}

// 导出格式化工具
export { formatAmount, formatCurrency }
