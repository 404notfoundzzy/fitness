<template>
  <view class="particle-home">
    <canvas
      id="particle-canvas"
      type="2d"
      class="particle-canvas"
      :style="canvasStyle"
    />

    <view class="hero-overlay">
      <view class="hero-greeting">
        <text class="greeting-label">READY TO TRAIN</text>
        <text class="greeting-title">{{ greeting }}</text>
      </view>

      <view class="hero-kpi">
        <view class="kpi-ring">
          <view class="kpi-number">{{ weeklyWorkouts }}</view>
          <view class="kpi-unit">本周训练</view>
        </view>
        <view class="kpi-divider" />
        <view class="kpi-ring">
          <view class="kpi-number kpi-streak">{{ streak }}</view>
          <view class="kpi-unit">连续打卡</view>
        </view>
      </view>
    </view>

    <view class="quick-actions">
      <view
        class="action-card"
        @click="startWorkout"
        hover-class="action-card-hover"
      >
        <view class="action-icon-box workout">
          <text class="action-icon">🏋</text>
        </view>
        <view class="action-info">
          <text class="action-title">开始训练</text>
          <text class="action-sub">选择训练计划</text>
        </view>
        <view class="action-arrow">→</view>
      </view>

      <view
        class="action-card"
        @click="goToRecord"
        hover-class="action-card-hover"
      >
        <view class="action-icon-box record">
          <text class="action-icon">📊</text>
        </view>
        <view class="action-info">
          <text class="action-title">数据记录</text>
          <text class="action-sub">饮食 · 体重 · 饮水</text>
        </view>
        <view class="action-arrow">→</view>
      </view>

      <view
        class="action-card"
        @click="goToKnowledge"
        hover-class="action-card-hover"
      >
        <view class="action-icon-box knowledge">
          <text class="action-icon">📚</text>
        </view>
        <view class="action-info">
          <text class="action-title">健身知识</text>
          <text class="action-sub">训练指南 · 饮食</text>
        </view>
        <view class="action-arrow">→</view>
      </view>
    </view>

    <view class="recent-section">
      <text class="section-title">最近训练</text>
      <view v-if="recentWorkouts.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">还没有训练记录</text>
        <text class="empty-hint">开始你的第一次训练吧</text>
      </view>
      <view v-else class="recent-list">
        <view
          v-for="(item, idx) in recentWorkouts"
          :key="idx"
          class="recent-card"
          :style="{ animationDelay: (idx * 0.1) + 's' }"
        >
          <view class="recent-date">{{ item.date }}</view>
          <view class="recent-body">
            <text class="recent-name">{{ item.name }}</text>
            <text class="recent-detail">{{ item.duration }} · {{ item.calories }}kcal</text>
          </view>
          <view class="recent-arrow">→</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ParticleHome',
  props: {
    userName: { type: String, default: '战士' },
    weeklyWorkouts: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    recentWorkouts: { type: Array, default: () => [] },
    particleColor: { type: String, default: '#0EA5E9' },
    particleCount: { type: Number, default: 60 },
    particleSpeed: { type: Number, default: 0.6 },
  },
  data() {
    return {
      canvasWidth: 375,
      canvasHeight: 0,
      particles: [],
      animationId: null,
      canvasCtx: null,
      canvasNode: null,
      dpr: 1,
    }
  },
  computed: {
    greeting() {
      const hour = new Date().getHours()
      if (hour < 12) return `早上好, ${this.userName}`
      if (hour < 18) return `下午好, ${this.userName}`
      return `晚上好, ${this.userName}`
    },
    canvasStyle() {
      return {
        width: this.canvasWidth + 'px',
        height: this.canvasHeight + 'px',
      }
    },
  },
  mounted() {
    this.initCanvas()
    this.startAnimation()
  },
  beforeDestroy() {
    this.stopAnimation()
  },
  methods: {
    startWorkout() {
      this.$emit('start-workout')
    },
    goToRecord() {
      this.$emit('go-record')
    },
    goToKnowledge() {
      this.$emit('go-knowledge')
    },

    initCanvas() {
      const systemInfo = uni.getSystemInfoSync()
      this.canvasWidth = systemInfo.windowWidth
      this.canvasHeight = Math.min(systemInfo.windowHeight * 0.55, 520)
      this.dpr = systemInfo.pixelRatio || 1

      this.$nextTick(() => {
        const query = uni.createSelectorQuery().in(this)
        query
          .select('#particle-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res[0] || !res[0].node) {
              this.fallbackInit()
              return
            }
            const canvas = res[0].node
            canvas.width = this.canvasWidth * this.dpr
            canvas.height = this.canvasHeight * this.dpr
            const ctx = canvas.getContext('2d')
            ctx.scale(this.dpr, this.dpr)
            this.canvasCtx = ctx
            this.canvasNode = canvas
            this.initParticles()
          })
      })
    },

    fallbackInit() {
      this.initParticles()
    },

    initParticles() {
      this.particles = []
      const count = this.particleCount
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          vx: (Math.random() - 0.5) * this.particleSpeed * 1.5,
          vy: (Math.random() - 0.5) * this.particleSpeed * 1.5,
          radius: Math.random() * 2.5 + 0.8,
          opacity: Math.random() * 0.5 + 0.15,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.008,
        })
      }
    },

    startAnimation() {
      const animate = () => {
        this.draw()
        this.animationId = requestAnimationFrame(animate)
      }
      animate()
    },

    stopAnimation() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
    },

    draw() {
      if (!this.canvasCtx) return
      const ctx = this.canvasCtx
      const w = this.canvasWidth
      const h = this.canvasHeight

      ctx.clearRect(0, 0, w, h)

      this.particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        const pulseAlpha = p.opacity + Math.sin(p.pulse) * 0.15
        const alpha = Math.max(0.05, Math.min(0.7, pulseAlpha))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.hexToRgba(this.particleColor, alpha)
        ctx.fill()
      })

      this.drawConnections(ctx)
    },

    drawConnections(ctx) {
      const maxDist = 80
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const a = this.particles[i]
          const b = this.particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = this.hexToRgba(this.particleColor, alpha)
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    },

    hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },
  },
}
</script>

<style scoped>
.particle-home {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f9ff 0%, #f8fafc 40%, #ffffff 100%);
}

.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
}

.hero-overlay {
  position: relative;
  z-index: 1;
  padding: calc(var(--status-bar-height, 44px) + 60rpx) 40rpx 40rpx;
}

.hero-greeting {
  margin-bottom: 48rpx;
}

.greeting-label {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #0ea5e9;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 12rpx;
}

.greeting-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.hero-kpi {
  display: flex;
  align-items: center;
  gap: 40rpx;
}

.kpi-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kpi-number {
  font-size: 56rpx;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  line-height: 1;
}

.kpi-number.kpi-streak {
  color: #0ea5e9;
}

.kpi-unit {
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 8rpx;
  font-weight: 500;
}

.kpi-divider {
  width: 2rpx;
  height: 72rpx;
  background: rgba(14, 165, 233, 0.15);
  border-radius: 1rpx;
}

.quick-actions {
  position: relative;
  z-index: 1;
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  background: #ffffff;
  border-radius: 24rpx;
  border: 1.5rpx solid rgba(14, 165, 233, 0.08);
  box-shadow:
    0 4rpx 20rpx rgba(14, 165, 233, 0.04),
    0 1rpx 4rpx rgba(0, 0, 0, 0.02);
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.action-card-hover {
  transform: scale(0.97);
  border-color: rgba(14, 165, 233, 0.2);
  box-shadow:
    0 8rpx 28rpx rgba(14, 165, 233, 0.08),
    0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.action-icon-box {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.action-icon-box.workout {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(56, 189, 248, 0.06));
}

.action-icon-box.record {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(45, 212, 191, 0.06));
}

.action-icon-box.knowledge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(167, 139, 250, 0.06));
}

.action-icon {
  font-size: 36rpx;
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
  display: block;
}

.action-sub {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.action-arrow {
  font-size: 28rpx;
  color: #cbd5e1;
  font-weight: 300;
}

.recent-section {
  position: relative;
  z-index: 1;
  padding: 40rpx 30rpx 60rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 20rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #64748b;
  font-weight: 600;
}

.empty-hint {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 8rpx;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recent-card {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  background: #ffffff;
  border-radius: 20rpx;
  border: 1.5rpx solid rgba(14, 165, 233, 0.06);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);
  animation: cardSlideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recent-date {
  font-size: 22rpx;
  color: #94a3b8;
  font-weight: 500;
  width: 100rpx;
  flex-shrink: 0;
}

.recent-body {
  flex: 1;
}

.recent-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #0f172a;
  display: block;
}

.recent-detail {
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.recent-arrow {
  font-size: 24rpx;
  color: #cbd5e1;
}
</style>