const TokenKey = 'sysToken'

export function getToken() {
    // const store = useLoginStore()
    return uni.getStorageSync('Authorization')
}
