<script setup lang="ts">
import {onBeforeMount, reactive, ref, computed} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import {login} from '@/api/login'
import {jumpPage, showToast} from "@/utils";
import BasicLayout from "@/components/layout/basic-layout.vue";

/**
 * 类型定义
 */
type MenuBtnRectType = {
  top: number;
  height: number;
};

/**
 * 响应式状态
 */
// 页面滚动状态
const toggle = ref(false)

// 胶囊按钮信息
const menuBtnRect = ref<MenuBtnRectType>({top: 0, height: 0})

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

// 是否已登录
const isLoggedIn = computed(() => {
  return !!uni.getStorageSync('Authorization')
})

// 用户信息
const userInfo = ref({
  ID: uni.getStorageSync('userID') || '',
  username: ''
})

/**
 * 生命周期钩子
 */
// 页面滚动处理（使用防抖优化性能）
onPageScroll(_.debounce((options: any) => {
  toggle.value = options.scrollTop > 200
}, 100))

// 获取胶囊按钮信息
onBeforeMount(() => {
  menuBtnRect.value = uni.getMenuButtonBoundingClientRect()

  // 如果已登录，尝试获取用户信息
  if (isLoggedIn.value) {
    getUserInfo()
  }
})

/**
 * 方法
 */
// 表单验证
const validateForm = () => {
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

  return !hasError
}

// 获取用户信息
const getUserInfo = () => {
  // 此处可以调用API获取更详细的用户信息
  const userID = uni.getStorageSync('userID')
  if (userID) {
    userInfo.value.ID = userID
  }
}

// 退出登录
const handleLogout = () => {
  uni.removeStorageSync('Authorization')
  uni.removeStorageSync('userID')
  showToast('已退出登录')

  // 重置用户信息
  userInfo.value = {
    ID: '',
    username: ''
  }
}

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) {
    showToast('请填写完整信息')
    return
  }

  try {
    const res = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (res.code === 0) {
      showToast(res.msg)

      // 保存登录信息
      uni.setStorageSync('Authorization', res.data.token)
      uni.setStorageSync('userID', res.data.userInfo.ID)

      // 更新用户信息
      userInfo.value = res.data.userInfo

      // 登录成功后跳转
      if (uni.getStorageSync('Authorization')) {
        jumpPage('pages/home/index')
      }
    } else {
      showToast(res.msg)
    }
  } catch (error) {
    console.error('登录失败:', error)
    showToast('登录失败，请稍后重试')
  }
}
</script>

<template>
  <basic-layout>
    <!-- 顶部导航栏 -->
    <div class="menu-button menu-toggle"
         :class="toggle ? 'toggle-on' : 'toggle-off'"
         :style="`--pdt: ${menuBtnRect.top}px;--height: ${menuBtnRect.height}px;`">
      <div class="flex-center">
        <span class="font-lg">{{ isLoggedIn ? '个人中心' : '登录' }}</span>
      </div>
    </div>

    <div class="my-page">
      <!-- 顶部背景区域 -->
      <div class="page-header" :style="`--mgt: ${menuBtnRect.height + menuBtnRect.top}px`">
        <!-- 未登录显示默认头像 -->
        <div v-if="!isLoggedIn" class="user-placeholder">
          <div class="avatar-placeholder"></div>
          <div class="welcome-text">欢迎使用记账小程序</div>
        </div>

        <!-- 已登录显示用户信息 -->
        <div v-else class="user-info-container">
          <div class="user-avatar"></div>
          <div class="user-details">
            <div class="username">用户{{ userInfo.ID }}</div>
            <div class="user-id">ID: {{ userInfo.ID }}</div>
          </div>
        </div>
      </div>

      <!-- 登录表单 -->
      <div v-if="!isLoggedIn" class="login-form">
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

      <!-- 已登录的功能菜单 -->
      <div v-else class="features-menu">
        <div class="menu-section">
          <div class="section-title">账户管理</div>
          <div class="menu-items">
            <div class="menu-item" @click="jumpPage('pages/CategoryManagement/index')">
              <span class="menu-icon">📋</span>
              <span class="menu-text">分类管理</span>
              <span class="menu-arrow">›</span>
            </div>
            <div class="menu-item" @click="handleLogout">
              <span class="menu-icon">🚪</span>
              <span class="menu-text">退出登录</span>
              <span class="menu-arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </basic-layout>
</template>

<style scoped lang="scss">
.phone-icon {
  width: 20px;
  height: 20px
}

.my-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  padding: 20px;
  min-height: 120px;
  margin-top: var(--mgt);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  .welcome-text {
    color: #666;
    font-size: 16px;
    margin-top: 10px;
  }
}

.user-placeholder, .user-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.user-info-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 16px;

  .user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #f0f0f0;
    margin-right: 16px;
  }

  .user-details {
    .username {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .user-id {
      font-size: 12px;
      color: #999;
    }
  }
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f0f0f0;
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
    color: #333;
    background: #fff;

    &::placeholder {
      color: #999;
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

.features-menu {
  padding: 0 16px;

  .menu-section {
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .section-title {
      font-size: 14px;
      color: #999;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .menu-items {
      .menu-item {
        display: flex;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .menu-icon {
          margin-right: 12px;
          font-size: 20px;
        }

        .menu-text {
          flex-grow: 1;
          font-size: 16px;
        }

        .menu-arrow {
          color: #ccc;
          font-size: 18px;
        }
      }
    }
  }
}
</style>
