<script setup lang="ts">
import {onBeforeMount, ref, computed} from 'vue'
import {onPageScroll} from "@dcloudio/uni-app";
import _ from "lodash";
import {updateUsername} from '@/api/login'
import { uploadFile } from '@/utils'
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

// 是否已登录
const isLoggedIn = computed(() => {
  return !!uni.getStorageSync('Authorization')
})

// 用户信息
const userInfo = ref({
  ID: uni.getStorageSync('userID') || '',
  username: '',
  headerImg: '',
  phone: ''
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

// 跳转到登录页
const goToLogin = () => {
  jumpPage('pages/login/index')
}

// 选择头像
const chooseAvatar = () => {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 拍照
        uni.chooseImage({
          count: 1,
          sourceType: ['camera'],
          success: uploadAvatar
        })
      } else if (res.tapIndex === 1) {
        // 从相册选择
        uni.chooseImage({
          count: 1,
          sourceType: ['album'],
          success: uploadAvatar
        })
      }
    }
  })
}

// 上传头像
const uploadAvatar = async (res) => {
  const tempFilePath = res.tempFilePaths[0]

  try {
    // 使用项目中的 uploadFile 工具函数
    const uploadResult = await uploadFile(tempFilePath)

    if (uploadResult.code === 0) {
      const imageUrl = uploadResult.data.url // 服务器返回的图片URL

      // 更新用户头像
      const updateData = {
        ID: parseInt(userInfo.value.ID),
        headerImg: imageUrl,
        nickName: userInfo.value.username || `用户${userInfo.value.ID}`,
        phone: userInfo.value.phone || ''
      }

      const result = await updateUsername(updateData)
      if (result.code === 0) {
        userInfo.value.headerImg = imageUrl
        showToast('头像更新成功')
      } else {
        showToast(result.msg || '头像更新失败')
      }
    } else {
      showToast(uploadResult.msg || '图片上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    showToast('头像上传失败，请稍后重试')
  }
}

// 修改用户名
const editUsername = () => {
  uni.navigateTo({
    url: '/pages/my/edit-username'
  })
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
          <div class="user-avatar" @click="chooseAvatar">
            <img v-if="userInfo.headerImg" :src="userInfo.headerImg" class="avatar-img" />
            <div v-else class="avatar-placeholder-icon">📷</div>
          </div>
          <div class="user-details">
            <div class="username" @click="editUsername">
              {{ userInfo.username || `用户${userInfo.ID}` }}
              <span class="edit-icon">✏️</span>
            </div>
            <div class="user-id">ID: {{ userInfo.ID }}</div>
          </div>
        </div>
      </div>

      <!-- 未登录时显示登录按钮 -->
      <div v-if="!isLoggedIn" class="login-section">
        <div class="login-prompt">
          <div class="prompt-text">登录后可享受完整功能</div>
          <button class="login-btn" @click="goToLogin">立即登录</button>
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
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder-icon {
      font-size: 24px;
      color: #999;
    }
  }

  .user-details {
    .username {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;

      &:hover {
        color: #667eea;
      }

      .edit-icon {
        font-size: 14px;
        margin-left: 8px;
        opacity: 0.6;
      }
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

.login-section {
  padding: 0 20px;
  margin-bottom: 20px;

  .login-prompt {
    text-align: center;
    padding: 40px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .prompt-text {
      font-size: 16px;
      color: #666;
      margin-bottom: 24px;
    }

    .login-btn {
      width: 200px;
      height: 44px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
      border-radius: 22px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
    }
  }
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
