<script setup lang="ts">
import {onBeforeMount, reactive, ref} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import {login} from '@/api/login'
import {jumpPage, showToast} from "@/utils";
import BasicLayout from "@/components/layout/basic-layout.vue";

type menuBtnRectType = {
  top: number;
  height: number;
};
const toggle = ref(false)
onPageScroll(_.debounce((options: any) => toggle.value = options.scrollTop > 200, 0))

const menuBtnRect = ref<menuBtnRectType>({top: 0, height: 0})
onBeforeMount(() => menuBtnRect.value = uni.getMenuButtonBoundingClientRect())

const loginForm = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  // 重置错误信息
  errors.username = ''
  errors.password = ''

  // 表单验证
  let hasError = false
  if (!loginForm.username.trim()) {
    errors.username = '用户名不能为空'
    hasError = true
  }
  if (!loginForm.password.trim()) {
    errors.password = '密码不能为空'
    hasError = true
  }

  if (hasError) {
    showToast('请填写完整信息')
    return
  }

  try {
    const res = await login({
      username: loginForm.username,
      password: loginForm.password
    })
    console.log(res, "res")
    if (res.code === 0) {
      showToast(res.msg)
      uni.setStorageSync('Authorization', res.data.token)
      uni.setStorageSync('userID', res.data.userInfo.ID)
      if (uni.getStorageSync('Authorization')) jumpPage('pages/home/index')
    } else {
      showToast(res.msg)
    }
  } catch (error) {
    showToast('登录失败，请稍后重试')
  }
}
</script>

<template>
  <basic-layout>
    <div class="menu-button menu-toggle" style="padding-left: 12px;" :class="toggle ? 'toggle-on' : 'toggle-off'"
         :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height}px;`">
      <div class="flex-center">
        <span class="font-lg">登录</span>
      </div>
    </div>
    <div class="home-page">
      <div class="home-banner" :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`"></div>
      <div class="login-form">
        <div class="form-container">
          <div class="form-item">
            <input
                type="text"
                v-model="loginForm.username"
                placeholder="请输入用户名"
                class="input-field"
                :class="{'error': errors.username}"
            />
            <div class="error-message" v-if="errors.username">{{ errors.username }}</div>
          </div>
          <div class="form-item">
            <input
                type="password"
                v-model="loginForm.password"
                placeholder="请输入密码"
                class="input-field"
                :class="{'error': errors.password}"
            />
            <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
          </div>
          <button class="login-btn" @click="handleLogin">登录</button>
        </div>
      </div>
      123
    </div>
  </basic-layout>
</template>

<style scoped lang="scss">
.phone-icon {
  width: 20px;
  height: 20px
}

.login-form {
  display: flex;
  justify-content: center;
  align-items: center;


  .form-container {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    margin: 0 20px;
  }

  .form-title {
    text-align: center;
    margin-bottom: 20px;
    font-size: 20px;
    color: #333;
  }

  .form-item {
    margin-bottom: 20px;
  }

  .input-field {
    width: 100%;
    height: 40px;
    padding: 0 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
    color: #fff;
    background: transparent;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    &:focus {
      outline: none;
      border-color: #007AFF;
    }

    &.error {
      border-color: #ff4d4f;
    }
  }

  .login-btn {
    width: 100%;
    height: 40px;
    background: #007AFF;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;

    &:hover {
      background: #0056b3;
    }
  }
}

.error-message {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  min-height: 17px;
}
</style>
