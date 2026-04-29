<template>
  <view class="container">
    <view class="login-header">
      <text class="title">健身助手</text>
      <text class="subtitle">{{
        isRegister ? "加入我们，开启健康生活" : "您的智能运动伙伴"
      }}</text>
    </view>

    <view class="form">
      <view class="input-group" :class="{ error: errors.username }">
        <text class="label required">用户名</text>
        <view class="input-wrapper">
          <input
            type="text"
            v-model="form.username"
            placeholder="请输入用户名"
            @input="clearError('username')"
          />
        </view>
        <text class="error-text" v-if="errors.username">{{
          errors.username
        }}</text>
      </view>

      <template v-if="isRegister">
        <view class="input-group" :class="{ error: errors.nickname }">
          <text class="label required">昵称</text>
          <view class="input-wrapper">
            <input
              type="text"
              v-model="form.nickname"
              placeholder="请输入您的昵称"
              @input="clearError('nickname')"
            />
          </view>
          <text class="error-text" v-if="errors.nickname">{{
            errors.nickname
          }}</text>
        </view>

        <view class="input-group">
          <text class="label">真实姓名 (选填)</text>
          <view class="input-wrapper">
            <input
              type="text"
              v-model="form.realName"
              placeholder="请输入您的真实姓名"
            />
          </view>
        </view>

        <view class="input-group" :class="{ error: errors.phone }">
          <text class="label required">手机号</text>
          <view class="input-wrapper">
            <input
              type="number"
              v-model="form.phone"
              placeholder="请输入手机号"
              @input="clearError('phone')"
            />
          </view>
          <text class="error-text" v-if="errors.phone">{{ errors.phone }}</text>
        </view>
      </template>

      <view class="input-group" :class="{ error: errors.password }">
        <text class="label required">密码</text>
        <view class="input-wrapper">
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="form.password"
            placeholder="请输入密码"
            @input="clearError('password')"
          />
          <view class="eye-icon" @click="showPassword = !showPassword">
            <uni-icons
              :type="showPassword ? 'eye-filled' : 'eye'"
              size="20"
              color="#94a3b8"
            ></uni-icons>
          </view>
        </view>
        <text class="error-text" v-if="errors.password">{{
          errors.password
        }}</text>
      </view>

      <view
        class="input-group"
        v-if="isRegister"
        :class="{ error: errors.confirmPassword }"
      >
        <text class="label required">确认密码</text>
        <view class="input-wrapper">
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="form.confirmPassword"
            placeholder="请再次输入密码"
            @input="clearError('confirmPassword')"
          />
          <view
            class="eye-icon"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <uni-icons
              :type="showConfirmPassword ? 'eye-filled' : 'eye'"
              size="20"
              color="#94a3b8"
            ></uni-icons>
          </view>
        </view>
        <text class="error-text" v-if="errors.confirmPassword">{{
          errors.confirmPassword
        }}</text>
      </view>

      <button class="btn-login" @click="handleSubmit">
        {{ isRegister ? "立即注册" : "立即登录" }}
      </button>
      <text class="tip" @click="toggleMode">
        {{ isRegister ? "已有账号？立即登录" : "还没有账号？立即注册" }}
      </text>
    </view>
  </view>
</template>

<script>
import { login, register } from "@/api/index";
import { consumePendingLoginForm, setLoginInfo } from "@/utils/auth";

export default {
  data() {
    return {
      form: {
        username: "",
        nickname: "",
        realName: "",
        phone: "",
        password: "",
        confirmPassword: "",
      },
      errors: {
        username: "",
        nickname: "",
        phone: "",
        password: "",
        confirmPassword: "",
      },
      isRegister: false,
      showPassword: false,
      showConfirmPassword: false,
    };
  },
  onLoad() {
    this.applyPendingLoginForm();
  },
  methods: {
    applyPendingLoginForm() {
      const pendingForm = consumePendingLoginForm();
      if (!pendingForm) {
        return;
      }

      this.isRegister = false;
      this.form = {
        username: pendingForm.username || "",
        nickname: "",
        realName: "",
        phone: "",
        password: pendingForm.password || "",
        confirmPassword: "",
      };
      this.showPassword = false;
      this.showConfirmPassword = false;
      this.clearAllErrors();
    },
    toggleMode() {
      this.isRegister = !this.isRegister;
      // 重置表单和错误信息
      this.form = {
        username: "",
        nickname: "",
        realName: "",
        phone: "",
        password: "",
        confirmPassword: "",
      };
      this.clearAllErrors();
    },
    clearError(field) {
      this.errors[field] = "";
    },
    clearAllErrors() {
      Object.keys(this.errors).forEach((key) => {
        this.errors[key] = "";
      });
    },
    validateForm() {
      this.clearAllErrors();
      let isValid = true;

      if (!this.form.username) {
        this.errors.username = "请输入用户名";
        isValid = false;
      }

      if (!this.form.password) {
        this.errors.password = "请输入密码";
        isValid = false;
      }

      if (this.isRegister) {
        if (!this.form.nickname) {
          this.errors.nickname = "请输入昵称";
          isValid = false;
        }
        if (!this.form.phone) {
          this.errors.phone = "请输入手机号";
          isValid = false;
        } else if (!/^1[3-9]\d{9}$/.test(this.form.phone)) {
          this.errors.phone = "手机号格式不正确";
          isValid = false;
        }
        if (!this.form.confirmPassword) {
          this.errors.confirmPassword = "请再次输入密码";
          isValid = false;
        } else if (this.form.password !== this.form.confirmPassword) {
          this.errors.confirmPassword = "两次输入的密码不一致";
          isValid = false;
        }
      }

      return isValid;
    },
    async handleSubmit() {
      if (!this.validateForm()) return;

      const { username, nickname, realName, phone, password } = this.form;

      try {
        if (this.isRegister) {
          await register({
            username: username,
            nickname: nickname,
            realName: realName,
            phone: phone,
            password: password,
          });
          uni.showToast({ title: "注册成功，请登录", icon: "success" });
          this.isRegister = false;
          this.form = {
            username,
            nickname: "",
            realName: "",
            phone: "",
            password,
            confirmPassword: "",
          };
          this.showPassword = false;
          this.showConfirmPassword = false;
          this.clearAllErrors();
        } else {
          // 登录逻辑：后端现在支持手机号或用户名作为 username 传递
          const res = await login(this.form);
          setLoginInfo(res.token, res.user);
          uni.reLaunch({
            url: "/pages/index/index",
          });
        }
      } catch (e) {
        console.error("Auth failed", e);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 160rpx 60rpx;
}

.login-header {
  margin-bottom: 100rpx;
  .title {
    display: block;
    font-size: 64rpx;
    font-weight: 800;
    color: #0ea5e9;
    margin-bottom: 20rpx;
  }
  .subtitle {
    font-size: 32rpx;
    color: #64748b;
  }
}

.form {
  .input-group {
    margin-bottom: 40rpx;
    .label {
      display: block;
      font-size: 24rpx;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 20rpx;
      text-transform: uppercase;
      letter-spacing: 2rpx;

      &.required::after {
        content: " *";
        color: #f43f5e;
        font-weight: bold;
      }
    }

    input {
      flex: 1;
      height: 100rpx;
      padding: 0 40rpx;
      font-size: 28rpx;
    }

    .input-wrapper {
      background-color: #fff;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.02);
      border: 2rpx solid transparent;
      transition: all 0.2s;

      .eye-icon {
        padding: 0 30rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &.error {
      .input-wrapper {
        border-color: #f43f5e;
        background-color: #fff5f5;
      }
    }

    .error-text {
      display: block;
      color: #f43f5e;
      font-size: 22rpx;
      margin-top: 10rpx;
      margin-left: 10rpx;
      font-weight: 600;
    }
  }

  .btn-login {
    background-color: #0ea5e9;
    color: #fff;
    height: 110rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 700;
    margin-top: 80rpx;
    box-shadow: 0 20rpx 40rpx rgba(14, 165, 233, 0.2);
    border: none;
  }

  .tip {
    display: block;
    text-align: center;
    margin-top: 40rpx;
    font-size: 24rpx;
    color: #94a3b8;
  }
}
</style>
