<script setup lang="ts">
import {reactive, ref} from 'vue'
import {register} from '@/api/login'
import {showToast, jumpPage} from '@/utils'
import DefaultHomePage from '@/components/defaultPage/defaultHomePage.vue'

// 表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

// 表单错误信息
const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

// 加载状态
const loading = ref(false)

// 表单验证
const validateForm = () => {
  // 重置错误信息
  errors.username = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.phone = ''

  let hasError = false

  // 用户名验证
  if (!registerForm.username.trim()) {
    errors.username = '用户名不能为空'
    hasError = true
  } else if (registerForm.username.length < 3) {
    errors.username = '用户名至少3个字符'
    hasError = true
  }

  // 密码验证
  if (!registerForm.password.trim()) {
    errors.password = '密码不能为空'
    hasError = true
  } else if (registerForm.password.length < 6) {
    errors.password = '密码至少6个字符'
    hasError = true
  }

  // 确认密码验证
  if (!registerForm.confirmPassword.trim()) {
    errors.confirmPassword = '请确认密码'
    hasError = true
  } else if (registerForm.password !== registerForm.confirmPassword) {
    errors.confirmPassword = '两次密码不一致'
    hasError = true
  }

  // 手机号验证（可选）
  if (registerForm.phone && !/^1[3-9]\d{9}$/.test(registerForm.phone)) {
    errors.phone = '请输入正确的手机号'
    hasError = true
  }

  return !hasError
}

// 处理注册
const handleRegister = async () => {
  if (!validateForm()) {
    showToast('请检查输入信息')
    return
  }

  loading.value = true
  try {
    const res = await register({
      username: registerForm.username,
      password: registerForm.password,
      phone: registerForm.phone
    })

    if (res.code === 0) {
      showToast('注册成功，请登录')
      // 注册成功后跳转到登录页
      uni.navigateBack()
    } else {
      showToast(res.msg || '注册失败')
    }

  } catch (error) {
    console.error('注册失败:', error)
    showToast('注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 跳转到登录页
const goToLogin = () => {
  uni.navigateBack()
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <div class="page">
    <div class="flex-start mgr-100">
      <img class="bg-logo" src="@/static/login/bg.png" alt="">
      <div class="font-3xl mgl-15">注册账户</div>
    </div>

    <div style="height: 10vh"/>

    <div class="box">
      <div class="flex-start">
        <img class="phone-icon mgr-15" src="@/static/login/phone.png" alt="">
        <input placeholder="请输入手机号" v-model="registerForm.phone" style="width: 100%;" type="tel">
      </div>
      <div class="border-bottom mgt-15"></div>
    </div>

    <div class="box">
      <div class="flex-start">
        <img class="phone-icon mgr-15" src="@/static/login/regi.png" alt="">
        <input placeholder="请输入验证码" v-model="registerForm.authCode" style="width: 55%;">
        <!--        <span class="font-base color-276" v-if="!isSend" @click="getCode">获取验证码</span>-->
        <!--        <span class="font-base color-656" v-if="isSend">已发送({{ countdown }})</span>-->
      </div>
      <div class="border-bottom mgt-15"></div>
    </div>


    <div class="box">
      <div class="flex-center">
        <div class="center-button" style="width: 100%">
          <span class="font-xl font-space-m">验证手机号</span>
        </div>
      </div>
    </div>

    <div style="height: 30vh"/>
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
  background: linear-gradient(87deg, #2160FE 0%, #51BEFF 100%);
  border-radius: 24px;
  color: #fff;
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
