<script>
import { getToken } from "@/utils/auth";
export default {
  onLaunch: function () {
    console.log("App Launch");
    const token = getToken();
    if (!token) {
      uni.reLaunch({
        url: "/pages/login/login",
        animationType: "none",
      });
    }
  },
  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style>
@font-face {
  font-family: "uniicons-override";
  src: url("/static/uniicons.ttf") format("truetype");
  font-display: swap;
}

.uni-icons {
  font-family: "uniicons-override" !important;
}

/* 每个页面公共css */

/* 页面切换过渡 */
page-enter-active,
page-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

page-enter-from {
  opacity: 0;
  transform: translateX(30rpx);
}

page-leave-to {
  opacity: 0;
  transform: translateX(-30rpx);
}

/* 适配各种自定义样式 */
.container {
  box-sizing: border-box;
}

/* 禁止 H5 页面级弹性滚动（overscroll bounce） */
page {
  overscroll-behavior: none;
}
</style>
