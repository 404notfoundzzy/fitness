<template>
  <view class="icon-wrapper" :class="{ 'icon-round': round }">
    <image
      :src="src"
      class="icon-image"
      :style="iconStyle"
      :class="{ 'icon-breathe': breathe }"
      mode="aspectFit"
    />
  </view>
</template>

<script>
export default {
  name: 'AppIconSvg',
  props: {
    src: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 48
    },
    color: {
      type: String,
      default: '#2F6BFF'
    },
    breathe: {
      type: Boolean,
      default: true
    },
    round: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    iconStyle() {
      return {
        width: this.size + 'rpx',
        height: this.size + 'rpx'
      }
    }
  }
}
</script>

<style scoped>
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.icon-wrapper.icon-round {
  border-radius: 50%;
  overflow: hidden;
}

.icon-image:active {
  transform: scale(0.85);
}

.icon-breathe {
  animation: iconBreathe 3s ease-in-out infinite;
}

@keyframes iconBreathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.12); opacity: 1; }
}
</style>