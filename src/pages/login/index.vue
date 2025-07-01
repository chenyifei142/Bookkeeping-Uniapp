<script setup lang="ts">
import {reactive, ref} from 'vue'
import {login} from '@/api/login'
import {jumpPage, showToast} from '@/utils'
import BasicLayout from '@/components/layout/basic-layout.vue'
import DefaultHomePage from '@/components/defaultPage/defaultHomePage.vue'

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单错误信息
const errors = reactive({
  username: '',
  password: ''
})

// 加载状态
const loading = ref(false)

// 表单验证
const validateForm = () => {
  // 重置错误信息
  errors.username = ''
  errors.password = ''

  let hasError = false
  if (!loginForm.username.trim()) {
    errors.username = '用户名不能为空'
    hasError = true
  }
  if (!loginForm.password.trim()) {
    errors.password = '密码不能为空'
    hasError = true
  }

  return !hasError
}

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) {
    showToast('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const res = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (res.code === 0) {
      showToast('登录成功')

      // 保存登录信息
      uni.setStorageSync('Authorization', res.data.token)
      uni.setStorageSync('userID', res.data.userInfo.ID)

      // 跳转到首页
      uni.switchTab({
        url: '/pages/home/index'
      })
    } else {
      showToast(res.msg)
    }
  } catch (error) {
    console.error('登录失败:', error)
    showToast('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 跳转到注册页
const goToRegister = () => {
  jumpPage('pages/register/index')
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <div class="page">
    <div class="flx-align-center">
      <img class="logo" src="@/static/login/logo.png" alt="">
      <div class="font-xl font-bold font-space-xl">欢迎使用记账呀</div>
    </div>

    <div class="box">
      <div class="flex-start">
        <img class="phone-icon mgr-15" src="@/static/login/phone.png" alt="">
        <input v-model="loginForm.username" placeholder="请输入手机号" style="width: 100%;" type="tel">
      </div>
      <div class="border-bottom mgt-15"></div>
    </div>

    <div class="box">
      <div class="flex-start">
        <img class="phone-icon mgr-15" src="@/static/login/psd.png" alt="">
        <input v-model="loginForm.password" password placeholder="请输入密码" style="width: 100%;">
      </div>
      <div class="border-bottom mgt-15"></div>
    </div>


    <div class="box">
      <div class="flex-center" @click="handleLogin">
        <div class="center-button" style="width: 100%">
          <span class="font-xl font-space-m">登录</span>
        </div>
      </div>
      <div class="flx-justify-between mgt-15">
        <div class="font-base color-276" @click="jumpPage('pages/login/register-phone',{authCodeType:2})">注册账号</div>
      </div>
    </div>

    <div style="height: 1vh"/>
  </div>

</template>

<style scoped lang="scss">
.page {
  height: 100vh; /* 添加这一行 */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 30px;
  background: #fff;
  justify-content: center;
  align-items: center;
}

.logo {
  width: 300rpx;
  height: 300rpx;
}

.mgt-15 {
  margin-top: 15px;
}

.border-bottom {
  border-bottom: 1px solid #8D8D8D;
}

.bg-logo {
  width: 100rpx;
  height: 100rpx;
}

.center-button {
  width: 80%;
  padding: 12px 0;
  background-color: #C3EAE5;
  color: #183C3A;
  border-radius: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.phone-icon {
  width: 20px;
  height: 20px
}

.box {
  width: 80%;
}

.mgl-15 {
  margin-left: -70rpx;
  margin-top: 10px;
}

.mgr-100 {
  margin-left: -350rpx;
}

</style>
