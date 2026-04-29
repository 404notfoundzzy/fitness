<template>
  <view class="container">
    <!-- 个人中心顶部 -->
    <view class="profile-header">
      <view class="avatar-box" @click="handleUploadAvatar">
        <view class="avatar-inner">
          <image
            v-if="isImageAvatar(userInfo.avatar)"
            :src="getImageUrl(userInfo.avatar)"
            class="avatar-img"
            mode="aspectFill"
          ></image>
          <uni-icons
            v-else
            type="person-filled"
            size="80"
            color="#0EA5E9"
          ></uni-icons>
        </view>
        <view class="status-badge">
          <uni-icons type="camera" size="14" color="#FFF"></uni-icons>
        </view>
      </view>
      <text class="user-name">{{
        userInfo.nickname || userInfo.name || "新用户"
      }}</text>
      <text class="user-status"
        >已坚持 {{ userInfo.streakDays || 0 }} 天！加油哦~</text
      >
    </view>

    <!-- 数据看板 -->
    <view class="stats-row">
      <view class="card stat-item">
        <text class="val">{{ userInfo.totalWorkouts || 0 }}</text>
        <text class="lbl">训练</text>
      </view>
      <view class="card stat-item">
        <text class="val">{{ formatCalories(userInfo.totalEnergy) }}</text>
        <text class="lbl">能量</text>
      </view>
      <view class="card stat-item">
        <text class="val">{{ userInfo.totalMedals || 0 }}</text>
        <text class="lbl">勋章</text>
      </view>
    </view>

    <!-- 选项列表 -->
    <view class="menu-list">
      <view class="card menu-item" @click="openEditProfile">
        <view class="icon-box medal" style="background-color: #e0f2fe">
          <uni-icons type="person" size="24" color="#0EA5E9"></uni-icons>
        </view>
        <text class="menu-name">修改个人信息</text>
        <uni-icons type="chevron-right" size="20" color="#E2E8F0"></uni-icons>
      </view>
      <view class="card menu-item" @click="openEditPassword">
        <view class="icon-box settings" style="background-color: #fef08a">
          <uni-icons type="locked-filled" size="24" color="#EAB308"></uni-icons>
        </view>
        <text class="menu-name">修改密码</text>
        <uni-icons type="chevron-right" size="20" color="#E2E8F0"></uni-icons>
      </view>
      <view class="card menu-item logout" @click="handleLogout">
        <view class="icon-box logout-icon">
          <uni-icons type="undo" size="24" color="#F43F5E"></uni-icons>
        </view>
        <text class="menu-name">退出登录</text>
        <uni-icons type="chevron-right" size="20" color="#E2E8F0"></uni-icons>
      </view>
    </view>

    <!-- 修改个人信息弹窗 -->
    <uni-popup
      ref="editProfilePopup"
      type="bottom"
      :safe-area-inset-bottom="false"
      :mask-click="true"
      @change="onPopupChange"
    >
      <view class="popup-wrapper">
        <view class="modal-content">
          <view class="handle"></view>
          <text class="modal-title">修改个人信息</text>
          <scroll-view class="form-scroll" scroll-y :show-scrollbar="false">
            <view class="form-list">
              <view class="form-item">
                <text class="label">昵称</text>
                <input
                  v-model="profileForm.nickname"
                  class="input-box"
                  placeholder="请输入昵称"
                />
              </view>
              <view class="form-item">
                <text class="label">真实姓名</text>
                <input
                  v-model="profileForm.realname"
                  class="input-box"
                  placeholder="请输入真实姓名"
                />
              </view>
              <view class="form-item">
                <text class="label">手机号</text>
                <input
                  type="number"
                  v-model="profileForm.phone"
                  class="input-box"
                  placeholder="请输入手机号"
                />
              </view>
              <view class="form-row-inline">
                <view class="form-item half">
                  <text class="label">性别</text>
                  <picker
                    mode="selector"
                    :range="genderOptions"
                    @change="onGenderChange"
                  >
                    <view
                      class="picker-box"
                      :class="{ placeholder: !profileForm.gender }"
                    >
                      <text>{{ profileForm.gender || "请选择性别" }}</text>
                      <uni-icons
                        type="bottom"
                        size="14"
                        color="#94A3B8"
                      ></uni-icons>
                    </view>
                  </picker>
                </view>
                <view class="form-item half">
                  <text class="label">年龄</text>
                  <input
                    type="number"
                    v-model="profileForm.age"
                    class="input-box"
                    placeholder="请输入年龄"
                  />
                </view>
              </view>
              <view class="form-item">
                <text class="label">健身目标</text>
                <picker
                  mode="selector"
                  :range="goalOptions"
                  range-key="label"
                  @change="onGoalChange"
                >
                  <view
                    class="picker-box"
                    :class="{ placeholder: !profileForm.fitnessGoal }"
                  >
                    <text>{{
                      getGoalLabel(profileForm.fitnessGoal) || "请选择健身目标"
                    }}</text>
                    <uni-icons
                      type="bottom"
                      size="14"
                      color="#94A3B8"
                    ></uni-icons>
                  </view>
                </picker>
              </view>
              <view class="form-item">
                <text class="label">个人简介</text>
                <textarea
                  v-model="profileForm.bio"
                  class="textarea-box"
                  placeholder="介绍一下自己吧..."
                  :maxlength="200"
                  auto-height
                ></textarea>
                <text class="char-count"
                  >{{ (profileForm.bio || "").length }}/200</text
                >
              </view>
            </view>
          </scroll-view>
          <view class="btn-group">
            <button class="btn-cancel" @click="closeEditProfile">取消</button>
            <button class="btn-save" @click="confirmEditProfile">
              保存修改
            </button>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 修改密码弹窗 -->
    <uni-popup
      ref="editPasswordPopup"
      type="bottom"
      :safe-area-inset-bottom="false"
      :mask-click="true"
      @change="onPopupChange"
    >
      <view class="popup-wrapper">
        <view class="modal-content">
          <view class="handle"></view>
          <text class="modal-title">修改密码</text>
          <view class="form-list">
            <view class="form-item" :class="{ error: passwordErrors.password }">
              <text class="label">新密码</text>
              <view class="input-wrapper">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  v-model="passwordForm.password"
                  class="input"
                  placeholder="请输入新密码"
                  @input="clearPasswordError('password')"
                />
                <view
                  class="eye-icon"
                  @click="showNewPassword = !showNewPassword"
                >
                  <uni-icons
                    :type="showNewPassword ? 'eye-filled' : 'eye'"
                    size="20"
                    color="#94A3B8"
                  ></uni-icons>
                </view>
              </view>
              <text class="error-text" v-if="passwordErrors.password">{{
                passwordErrors.password
              }}</text>
            </view>
            <view
              class="form-item"
              :class="{ error: passwordErrors.confirmPassword }"
            >
              <text class="label">确认新密码</text>
              <view class="input-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  v-model="passwordForm.confirmPassword"
                  class="input"
                  placeholder="请再次输入新密码"
                  @input="clearPasswordError('confirmPassword')"
                />
                <view
                  class="eye-icon"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <uni-icons
                    :type="showConfirmPassword ? 'eye-filled' : 'eye'"
                    size="20"
                    color="#94A3B8"
                  ></uni-icons>
                </view>
              </view>
              <text class="error-text" v-if="passwordErrors.confirmPassword">{{
                passwordErrors.confirmPassword
              }}</text>
            </view>
          </view>
          <view class="btn-group">
            <button class="btn-cancel" @click="closeEditPassword">取消</button>
            <button class="btn-save" @click="confirmEditPassword">
              确认修改
            </button>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 退出登录确认弹窗 -->
    <uni-popup
      ref="logoutPopup"
      type="center"
      :mask-click="true"
      @change="onLogoutPopupChange"
    >
      <view class="logout-modal">
        <view class="logout-icon-wrapper">
          <uni-icons type="info" size="36" color="#f43f5e"></uni-icons>
        </view>
        <text class="logout-title">退出登录</text>
        <text class="logout-desc">确定要退出当前账号吗？</text>
        <view class="logout-btn-group">
          <button class="logout-btn cancel" @click="closeLogoutPopup">
            再想想
          </button>
          <button class="logout-btn confirm" @click="confirmLogout">
            确认退出
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getUserProfile, updateUserProfile, uploadAvatar } from "@/api/index";
import { buildFileUrl } from "@/utils/request";
import { checkLogin, logout, setPendingLoginForm } from "@/utils/auth";

export default {
  data() {
    return {
      userInfo: {},
      profileForm: {
        nickname: "",
        realname: "",
        phone: "",
        gender: "",
        age: "",
        fitnessGoal: "",
        bio: "",
      },
      genderOptions: ["男", "女"],
      goalOptions: [
        { key: "lose_weight", label: "减脂塑形" },
        { key: "gain_muscle", label: "增肌增重" },
        { key: "maintain", label: "保持健康" },
        { key: "endurance", label: "提升耐力" },
        { key: "strength", label: "增强力量" },
        { key: "flexibility", label: "提升柔韧性" },
      ],
      passwordForm: {
        password: "",
        confirmPassword: "",
      },
      passwordErrors: {
        password: "",
        confirmPassword: "",
      },
      showNewPassword: false,
      showConfirmPassword: false,
    };
  },
  onShow() {
    if (checkLogin()) {
      this.fetchProfile();
    }
  },
  methods: {
    async fetchProfile() {
      try {
        const data = await getUserProfile();
        this.userInfo = data || {};
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    },
    getImageUrl(path) {
      return buildFileUrl(path);
    },
    isImageAvatar(path) {
      return (
        !!path && (path.startsWith("/uploads/") || /^https?:\/\//.test(path))
      );
    },
    // 基于 Canvas 的前端图片压缩方法 (兼容 H5)
    compressImageByCanvas(filePath, quality = 0.6) {
      return new Promise((resolve, reject) => {
        // #ifdef H5
        const img = new Image();
        img.src = filePath;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // 设置压缩后的最大宽高 (例如头像不需要超过 800px)
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;
          const maxHeight = 800;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            } else {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // 导出压缩后的 base64 数据
          const dataURL = canvas.toDataURL("image/jpeg", quality);
          resolve(dataURL); // 注意：H5 压缩后直接返回 base64
        };
        img.onerror = reject;
        // #endif

        // #ifndef H5
        // 如果是微信小程序或 App，可以尝试使用原生压缩（如果 uni.compressImage 可用的话）
        // 否则直接原图返回
        if (typeof uni.compressImage === "function") {
          uni.compressImage({
            src: filePath,
            quality: quality * 100,
            success: (res) => resolve(res.tempFilePath),
            fail: () => resolve(filePath), // 失败则返回原图
          });
        } else {
          resolve(filePath);
        }
        // #endif
      });
    },
    // 将 base64 转换为 Blob 文件对象 (用于 H5 上传)
    dataURLtoBlob(dataurl) {
      const arr = dataurl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    },
    async handleUploadAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ["compressed"], // 指定压缩图，提升上传速度
        sourceType: ["album", "camera"],
        success: async (res) => {
          const tempFilePaths = res.tempFilePaths;
          if (tempFilePaths.length > 0) {
            let filePath = tempFilePaths[0];
            let uploadFileObj = filePath; // 可能是路径，也可能是 File/Blob 对象

            // 使用一个整体的 Loading 状态，避免来回切换导致状态不一致
            uni.showLoading({ title: "上传中..." });
            try {
              const compressedResult = await this.compressImageByCanvas(
                filePath,
                0.6,
              );

              // #ifdef H5
              if (compressedResult.startsWith("data:image")) {
                // 如果返回的是 base64，需要转成 File/Blob 对象交给 request 上传
                const blob = this.dataURLtoBlob(compressedResult);
                // 构造一个类似 File 的对象，带有 name 属性
                uploadFileObj = new File([blob], "avatar_compressed.jpg", {
                  type: "image/jpeg",
                });
                // 将这个对象转换为 H5 的 URL，以便让 uni.uploadFile 识别
                filePath = URL.createObjectURL(uploadFileObj);
              } else {
                filePath = compressedResult;
              }
              // #endif

              // #ifndef H5
              filePath = compressedResult;
              // #endif
            } catch (compressErr) {
              console.error("图片压缩失败，将使用原图上传", compressErr);
            }

            try {
              // 如果是 H5 并且通过 Canvas 压缩生成了 Blob，需要直接上传 Blob（由于封装的 uploadAvatar 可能不支持，如果报错则需要修改 api）
              // 幸运的是，通过 URL.createObjectURL 生成的路径在 H5 的 uni.uploadFile 中也是兼容的
              await uploadAvatar(filePath);

              // 上传成功后，直接重新拉取最新用户信息
              await this.fetchProfile();
              uni.showToast({ title: "头像上传成功", icon: "success" });
            } catch (e) {
              console.error("Failed to upload avatar", e);
            } finally {
              uni.hideLoading(); // 整个流程（包含压缩和上传）结束后统一关闭
            }
          }
        },
      });
    },
    openEditProfile() {
      this.profileForm = {
        nickname: this.userInfo.nickname || "",
        realname: this.userInfo.realname || "",
        phone: this.userInfo.phone || "",
        gender: this.userInfo.gender || "",
        age: this.userInfo.age || "",
        fitnessGoal: this.userInfo.fitnessGoal || "",
        bio: this.userInfo.bio || "",
      };
      uni.hideTabBar({ animation: true });
      this.$nextTick(() => {
        setTimeout(() => {
          uni.hideTabBar({ animation: true });
        }, 50);
      });
      this.$refs.editProfilePopup.open();
    },
    onPopupChange(e) {
      if (!e.show) {
        setTimeout(() => {
          uni.showTabBar({ animation: true });
        }, 280);
      }
    },
    onGenderChange(e) {
      this.profileForm.gender = this.genderOptions[e.detail.value];
    },
    onGoalChange(e) {
      this.profileForm.fitnessGoal = this.goalOptions[e.detail.value].key;
    },
    getGoalLabel(key) {
      const goal = this.goalOptions.find((g) => g.key === key);
      return goal ? goal.label : "";
    },
    closeEditProfile() {
      this.$refs.editProfilePopup.close();
    },
    async confirmEditProfile() {
      try {
        await updateUserProfile({
          ...this.userInfo,
          nickname: this.profileForm.nickname,
          realname: this.profileForm.realname,
          phone: this.profileForm.phone,
          gender: this.profileForm.gender,
          age: this.profileForm.age ? Number(this.profileForm.age) : null,
          fitnessGoal: this.profileForm.fitnessGoal,
          bio: this.profileForm.bio,
        });
        uni.showToast({ title: "修改成功", icon: "success" });
        this.fetchProfile();
        this.closeEditProfile();
      } catch (e) {
        console.error("Failed to update profile", e);
      }
    },
    openEditPassword() {
      this.passwordForm = { password: "", confirmPassword: "" };
      this.clearAllPasswordErrors();
      this.showNewPassword = false;
      this.showConfirmPassword = false;
      uni.hideTabBar({ animation: true });
      this.$nextTick(() => {
        setTimeout(() => {
          uni.hideTabBar({ animation: true });
        }, 50);
      });
      this.$refs.editPasswordPopup.open();
    },
    closeEditPassword() {
      this.$refs.editPasswordPopup.close();
    },
    clearPasswordError(field) {
      this.passwordErrors[field] = "";
      if (field === "password" && this.passwordErrors.confirmPassword) {
        this.passwordErrors.confirmPassword = "";
      }
    },
    clearAllPasswordErrors() {
      Object.keys(this.passwordErrors).forEach((key) => {
        this.passwordErrors[key] = "";
      });
    },
    validatePasswordForm() {
      this.clearAllPasswordErrors();
      let isValid = true;

      if (!this.passwordForm.password) {
        this.passwordErrors.password = "请输入新密码";
        isValid = false;
      }

      if (!this.passwordForm.confirmPassword) {
        this.passwordErrors.confirmPassword = "请再次输入新密码";
        isValid = false;
      } else if (
        this.passwordForm.password !== this.passwordForm.confirmPassword
      ) {
        this.passwordErrors.confirmPassword = "两次输入的密码不一致";
        isValid = false;
      }

      return isValid;
    },
    async confirmEditPassword() {
      if (!this.validatePasswordForm()) {
        return;
      }
      try {
        await updateUserProfile({
          ...this.userInfo,
          password: this.passwordForm.password,
        });
        setPendingLoginForm({
          username: this.userInfo.username || "",
          password: this.passwordForm.password,
        });
        uni.showToast({ title: "密码修改成功，请重新登录", icon: "success" });
        this.closeEditPassword();
        setTimeout(() => {
          logout();
        }, 800);
      } catch (e) {
        console.error("Failed to update password", e);
      }
    },
    handleLogout() {
      this.$refs.logoutPopup.open();
    },
    closeLogoutPopup() {
      this.$refs.logoutPopup.close();
    },
    onLogoutPopupChange(e) {
      if (!e.show) {
        // 弹框关闭时的清理逻辑
      }
    },
    confirmLogout() {
      this.$refs.logoutPopup.close();
      logout();
    },
    formatCalories(calories) {
      if (!calories) return "0";
      if (calories >= 1000) {
        return (calories / 1000).toFixed(1) + "k";
      }
      return Math.round(calories).toString();
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 120rpx 40rpx 40rpx;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;

  .avatar-box {
    position: relative;
    width: 224rpx;
    height: 224rpx;
    background-color: #fff;
    border-radius: 72rpx;
    padding: 16rpx;
    box-shadow: 0 40rpx 100rpx -20rpx rgba(14, 165, 233, 0.15);
    margin-bottom: 40rpx;

    .avatar-inner {
      width: 100%;
      height: 100%;
      background-color: #e0f2fe;
      border-radius: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      .avatar-img {
        width: 100%;
        height: 100%;
      }
    }

    .status-badge {
      position: absolute;
      bottom: -16rpx;
      right: -16rpx;
      width: 80rpx;
      height: 80rpx;
      background-color: #0ea5e9;
      border: 8rpx solid #fff;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .user-name {
    font-size: 48rpx;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 10rpx;
  }

  .user-status {
    font-size: 28rpx;
    font-weight: 800;
    color: #f59e0b;
    letter-spacing: 2rpx;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
  margin-bottom: 60rpx;

  .stat-item {
    text-align: center;
    padding: 40rpx 0;
    .val {
      display: block;
      font-size: 40rpx;
      font-weight: 800;
      color: #0ea5e9;
      margin-bottom: 8rpx;
    }
    .lbl {
      font-size: 20rpx;
      color: #94a3b8;
      font-weight: 800;
      text-transform: uppercase;
    }
  }
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  margin-bottom: 0;

  .icon-box {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 30rpx;

    &.logout-icon {
      background-color: #ffe4e6;
    }
  }

  .menu-name {
    flex: 1;
    font-size: 28rpx;
    font-weight: 700;
    color: #334155;
  }
}

.card {
  background-color: #fff;
  border-radius: 48rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(14, 165, 233, 0.05);
  border: 1px solid rgba(14, 165, 233, 0.05);
}

/* 弹窗通用样式 */
.modal-content {
  padding: 32rpx 32rpx 0;
  border-radius: 48rpx 48rpx 0 0;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  max-height: 85vh;

  .handle {
    width: 64rpx;
    height: 8rpx;
    background-color: #e2e8f0;
    border-radius: 8rpx;
    margin: 0 auto 28rpx;
  }

  .modal-title {
    font-size: 36rpx;
    font-weight: 800;
    color: #0f172a;
    display: block;
    margin-bottom: 24rpx;
    text-align: center;
  }
}

.form-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 16rpx;
}

.form-row-inline {
  display: flex;
  gap: 20rpx;

  .form-item.half {
    flex: 1;
    min-width: 0;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 10rpx;

  .label {
    font-size: 26rpx;
    font-weight: 700;
    color: #64748b;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    background-color: #f8fafc;
    border-radius: 16rpx;
    border: 1.5rpx solid #e2e8f0;

    .input {
      flex: 1;
      height: 84rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      color: #7c3aed;
      background-color: transparent;
      transition: all 0.25s;

      &::placeholder {
        color: #c4b5d4;
        font-weight: 400;
        font-size: 26rpx;
      }

      &:focus {
        background-color: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
      }
    }

    .eye-icon {
      padding: 0 30rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .input-box {
    width: 100%;
    height: 84rpx;
    background-color: #f8fafc;
    border-radius: 16rpx;
    border: 1.5rpx solid #e2e8f0;
    padding: 0 24rpx;
    font-size: 28rpx;
    color: #7c3aed;
    box-sizing: border-box;
    transition: all 0.25s;

    &::placeholder {
      color: #c4b5d4;
      font-weight: 400;
      font-size: 26rpx;
    }

    &:focus {
      border-color: #8b5cf6;
      background-color: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
      box-shadow: 0 0 0 4rpx rgba(139, 92, 246, 0.12);
      color: #6d28d9;
    }
  }

  .picker-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 84rpx;
    background-color: #f8fafc;
    border-radius: 16rpx;
    border: 1.5rpx solid #e2e8f0;
    padding: 0 24rpx;
    box-sizing: border-box;
    transition: all 0.2s;

    text {
      font-size: 28rpx;
      background: linear-gradient(
        135deg,
        #06b6d4 0%,
        #8b5cf6 35%,
        #ec4899 65%,
        #f97316 100%
      );
      background-size: 200% 200%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: gradientFlow 3s ease infinite;
    }

    &.placeholder text {
      background: none;
      -webkit-background-clip: unset;
      background-clip: unset;
      color: #c4b5d4;
      font-weight: 400;
      font-size: 26rpx;
      animation: none;
    }

    &:active {
      border-color: #8b5cf6;
    }
  }

  .textarea-box {
    width: 100%;
    min-height: 120rpx;
    max-height: 220rpx;
    background-color: #f8fafc;
    border-radius: 16rpx;
    border: 1.5rpx solid #e2e8f0;
    padding: 20rpx 24rpx;
    font-size: 28rpx;
    color: #7c3aed;
    box-sizing: border-box;
    line-height: 1.6;
    transition: all 0.25s;

    &::placeholder {
      color: #c4b5d4;
      font-weight: 400;
      font-size: 26rpx;
    }

    &:focus {
      border-color: #8b5cf6;
      background-color: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
      box-shadow: 0 0 0 4rpx rgba(139, 92, 246, 0.12);
      color: #6d28d9;
    }
  }

  .char-count {
    text-align: right;
    font-size: 22rpx;
    color: #cbd5e1;
    margin-top: 6rpx;
  }

  &.error {
    .input-wrapper {
      border-color: #f43f5e;
      background-color: #fff5f5;
    }
  }

  .error-text {
    color: #f43f5e;
    font-size: 22rpx;
    font-weight: 600;
  }
}

.btn-group {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  flex-shrink: 0;

  button {
    flex: 1;
    height: 92rpx;
    border-radius: 24rpx;
    font-size: 30rpx;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;

    &.btn-cancel {
      background-color: #f1f5f9;
      color: #64748b;
    }

    &.btn-save {
      background: linear-gradient(
        135deg,
        #8b5cf6 0%,
        #a855f7 50%,
        #ec4899 100%
      );
      background-size: 200% 200%;
      color: #fff;
      box-shadow: 0 10rpx 30rpx rgba(139, 92, 246, 0.35);
      animation: btnGlow 3s ease infinite;
    }
  }
}

.popup-wrapper {
  position: relative;
  background-color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}

:deep(.uni-popup) {
  z-index: 99 !important;
}

/* 退出登录弹框 */
.logout-modal {
  width: 480rpx;
  background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%);
  border-radius: 28rpx;
  padding: 36rpx 32rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16rpx 48rpx rgba(244, 63, 94, 0.15);
}

.logout-icon-wrapper {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  animation: logoutPulse 2s ease-in-out infinite;
}

.logout-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12rpx;
}

.logout-desc {
  font-size: 24rpx;
  color: #94a3b8;
  margin-bottom: 28rpx;
  text-align: center;
}

.logout-btn-group {
  display: flex;
  gap: 16rpx;
  width: 100%;
}

.logout-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 18rpx;
  font-size: 26rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &.cancel {
    background-color: #f1f5f9;
    color: #64748b;

    &:active {
      background-color: #e2e8f0;
    }
  }

  &.confirm {
    background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #f97316 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba(244, 63, 94, 0.3);
    animation: logoutBtnGlow 3s ease infinite;

    &:active {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }
}

@keyframes logoutPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.2);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 12rpx rgba(244, 63, 94, 0);
  }
}

@keyframes logoutBtnGlow {
  0%,
  100% {
    background-position: 0% 50%;
    box-shadow: 0 8rpx 24rpx rgba(244, 63, 94, 0.3);
  }
  50% {
    background-position: 100% 50%;
    box-shadow: 0 8rpx 32rpx rgba(236, 72, 153, 0.4);
  }
}

:deep(.uni-popup__mask) {
  z-index: 98 !important;
}

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes btnGlow {
  0%,
  100% {
    background-position: 0% 50%;
    box-shadow: 0 10rpx 30rpx rgba(139, 92, 246, 0.35);
  }
  50% {
    background-position: 100% 50%;
    box-shadow: 0 10rpx 40rpx rgba(236, 72, 153, 0.4);
  }
}
</style>
