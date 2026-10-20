<template>
  <view
    class="icon-wrap"
    :class="[animateClass]"
    :style="{ width: size + 'rpx', height: size + 'rpx' }"
    @touchstart="onPress"
    @touchend="onRelease"
  >
    <uni-icons
      :type="name"
      :size="iconSize"
      :color="active ? activeColor : inactiveColor"
    ></uni-icons>
  </view>
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    name: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: 0
    },
    size: {
      type: Number,
      default: 48
    },
    activeColor: {
      type: String,
      default: '#2F6BFF'
    },
    inactiveColor: {
      type: String,
      default: '#6B7280'
    },
    breathe: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      pressing: false
    }
  },
  computed: {
    iconSize() {
      return Math.round(this.size * 0.55)
    },
    animateClass() {
      return {
        'is-active': this.active,
        'is-press': this.pressing,
        'no-breathe': !this.breathe
      }
    }
  },
  methods: {
    onPress() {
      this.pressing = true
    },
    onRelease() {
      this.pressing = false
    }
  }
}
</script>

<style scoped>
.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  animation: breathe 3s ease-in-out infinite;
}

.no-breathe {
  animation: none;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.is-press {
  transform: scale(0.88) !important;
  animation: none !important;
}

.is-active {
  filter: drop-shadow(0 0 12rpx currentColor);
}
</style>
