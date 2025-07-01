<script setup lang="ts">
import {reactive, ref, onMounted} from 'vue'
import {updateUsername} from '@/api/login'
import {showToast} from '@/utils'
import BasicLayout from '@/components/layout/basic-layout.vue'

// 表单数据
const formData = reactive({
  username: '',
  phone: ''
})

// 表单错误信息
const errors = reactive({
  username: '',
  phone: ''
})

// 加载状态
const loading = ref(false)

// 用户信息
const userInfo = ref({
  ID: uni.getStorageSync('userID') || '',
  headerImg: '',
  username: '',
  phone: ''
})

// 页面加载时获取用户信息
onMounted(() => {
  const userID = uni.getStorageSync('userID')
  if (userID) {
    userInfo.value.ID = userID
    // 这里可以从本地存储或API获取用户详细信息
    formData.username = userInfo.value.username || `用户${userID}`
    formData.phone = userInfo.value.phone || ''
  }
})

// 表单验证
const validateForm = () => {
  errors.username = ''
  errors.phone = ''

  let hasError = false

  if (!formData.username.trim()) {
    errors.username = '用户名不能为空'
    hasError = true
  } else if (formData.username.length < 2) {
    errors.username = '用户名至少2个字符'
    hasError = true
  } else if (formData.username.length > 20) {
    errors.username = '用户名不能超过20个字符'
    hasError = true
  }

  if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
    errors.phone = '请输入正确的手机号'
    hasError = true
  }

  return !hasError
}

// 提交修改
const handleSubmit = async () => {
  if (!validateForm()) {
    showToast('请检查输入信息')
    return
  }

  loading.value = true
  try {
    const updateData = {
      ID: parseInt(userInfo.value.ID),
      headerImg: userInfo.value.headerImg || '',
      nickName: formData.username,
      phone: formData.phone
    }

    const result = await updateUsername(updateData)
    if (result.code === 0) {
      showToast('修改成功')

      // 更新本地用户信息
      userInfo.value.username = formData.username
      userInfo.value.phone = formData.phone

      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    } else {
      showToast(result.msg || '修改失败')
    }
  } catch (error) {
    console.error('修改失败:', error)
    showToast('修改失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <div class="edit-username-page">
    <!-- 表单内容 -->
    <div class="form-container">
      <div class="form-section">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <input
              type="text"
              v-model="formData.username"
              placeholder="请输入用户名"
              class="input-field"
              :class="{'error': errors.username}"
              maxlength="20"
          />
          <div class="error-message" v-if="errors.username">{{ errors.username }}</div>
        </div>
      </div>

      <div class="submit-section">
        <button
            class="submit-btn"
            @click="handleSubmit"
            :disabled="loading"
        >
          {{ loading ? '提交中...' : '提交修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.edit-username-page {
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 44px 16px 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .nav-back {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: #f0f0f0;

    .back-icon {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
  }

  .nav-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .nav-placeholder {
    width: 40px;
  }
}

.form-container {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .form-item {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-label {
    display: block;
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }

  .input-field {
    width: 100%;
    height: 50px;
    padding: 0 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    background: #fff;
    box-sizing: border-box;
    color: #333;
    transition: all 0.3s ease;

    &::placeholder {
      color: #999;
    }

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    &.error {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
    }
  }

  .error-message {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 8px;
    min-height: 17px;
  }
}

.submit-section {
  margin-top: 20px;

  .submit-btn {
    width: 100%;
    height: 50px;
    background-color: #C3EAE5;
    color: #183C3A;
    border: none;
    border-radius: 25px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
}
</style>
