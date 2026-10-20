<template>
  <view class="container">
    <view class="header">
      <text class="title">缓存刷新测试</text>
      <text class="subtitle">模拟网络失败，验证重试和提示逻辑</text>
    </view>

    <view class="control-panel">
      <view class="control-row">
        <text class="control-label">网络模式：</text>
        <view class="btn-group">
          <view
            class="btn"
            :class="{ active: networkMode === 'normal' }"
            @click="networkMode = 'normal'"
            >正常</view
          >
          <view
            class="btn"
            :class="{ active: networkMode === 'fail' }"
            @click="networkMode = 'fail'"
            >全部失败</view
          >
          <view
            class="btn"
            :class="{ active: networkMode === 'failOnce' }"
            @click="networkMode = 'failOnce'"
            >首次失败</view
          >
          <view
            class="btn"
            :class="{ active: networkMode === 'slow' }"
            @click="networkMode = 'slow'"
            >慢速(3s)</view
          >
        </view>
      </view>

      <view class="control-row">
        <view class="btn action-btn" @click="clearAllCache">清除缓存</view>
        <view class="btn action-btn" @click="runTest">运行测试</view>
      </view>
    </view>

    <view class="test-section">
      <text class="section-title">SectionLoader 区域测试</text>
      <SectionLoader
        ref="testLoader"
        :loading="dataLoading"
        cache-key="testData"
        name="rose-three"
        :size="140"
        color="#A855F7"
        text="正在加载测试数据..."
        min-height="300rpx"
        @refresh="runTest"
      >
        <view v-if="testData" class="test-result">
          <text class="result-label">数据内容：</text>
          <text class="result-value">{{ testData.message }}</text>
          <text class="result-label">加载时间：</text>
          <text class="result-value">{{ testData.timestamp }}</text>
          <text class="result-label">数据来源：</text>
          <text
            class="result-value"
            :class="testData.fromCache ? 'cache' : 'network'"
          >
            {{ testData.fromCache ? "缓存" : "网络" }}
          </text>
        </view>
      </SectionLoader>
    </view>

    <view class="log-section">
      <view class="log-header">
        <text class="section-title">实时日志</text>
        <view class="btn small-btn" @click="logs = []">清空</view>
      </view>
      <scroll-view scroll-y class="log-scroll">
        <view
          v-for="(log, idx) in logs"
          :key="idx"
          class="log-item"
          :class="log.type"
        >
          <text class="log-time">{{ log.time }}</text>
          <text class="log-msg">{{ log.msg }}</text>
        </view>
        <view v-if="logs.length === 0" class="log-empty">
          <text>暂无日志，点击"运行测试"开始</text>
        </view>
      </scroll-view>
    </view>

    <view class="status-section">
      <text class="section-title">缓存状态</text>
      <view class="status-row">
        <text class="status-label">缓存数据：</text>
        <text class="status-value">{{
          cacheStore.cacheData?.testData ? "存在" : "无"
        }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">刷新状态：</text>
        <text class="status-value">{{
          cacheStore.refreshStatus?.testData || "idle"
        }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">缓存年龄：</text>
        <text class="status-value">{{ cacheAge }}s</text>
      </view>
    </view>
  </view>
</template>

<script>
import { usePageCacheStore } from "@/stores/pageCache.js";

let failCount = 0;

export default {
  data() {
    return {
      networkMode: "normal",
      dataLoading: false,
      testData: null,
      logs: [],
      cacheStore: null,
    };
  },
  computed: {
    cacheAge() {
      if (!this.cacheStore || !this.cacheStore.cacheTimestamps?.testData)
        return "-";
      return Math.round(
        (Date.now() - this.cacheStore.cacheTimestamps.testData) / 1000,
      );
    },
  },
  mounted() {
    this.cacheStore = usePageCacheStore();
  },
  methods: {
    addLog(msg, type = "info") {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      this.logs.unshift({ time, msg, type });
      if (this.logs.length > 100) this.logs.pop();
    },

    async mockFetch() {
      this.addLog(`📡 发起请求 | 模式: ${this.networkMode}`, "info");

      if (this.networkMode === "fail") {
        this.addLog("❌ 模拟网络失败", "error");
        throw new Error("Network Error: 模拟网络不可用");
      }

      if (this.networkMode === "failOnce") {
        failCount++;
        if (failCount <= 2) {
          this.addLog(`❌ 模拟第 ${failCount} 次失败（共2次）`, "error");
          throw new Error(`Network Error: 模拟第 ${failCount} 次失败`);
        }
        this.addLog("✅ 模拟网络恢复", "success");
      }

      if (this.networkMode === "slow") {
        this.addLog("⏳ 模拟慢速网络 (3s)...", "info");
        await new Promise((r) => setTimeout(r, 3000));
      }

      return {
        message: `测试数据 @ ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
        fromCache: false,
      };
    },

    async runTest() {
      this.addLog("🚀 开始测试", "info");
      failCount = 0;

      const cache = this.cacheStore;
      const cached = cache.getCached("testData");

      if (cached) {
        this.addLog("✅ 命中缓存，展示缓存数据", "success");
        this.testData = { ...cached, fromCache: true };
        this.dataLoading = false;

        this.addLog("🔄 开始静默刷新...", "info");
        cache
          .silentRefresh("testData", async () => {
            const result = await this.mockFetch();
            this.testData = { ...result, fromCache: false };
            this.addLog("✅ 静默刷新成功，数据已更新", "success");
            return result;
          })
          .then(() => {
            const err = cache.getRefreshError("testData");
            if (err) {
              this.addLog(`⚠️ 静默刷新最终失败: ${err}`, "error");
              if (this.$refs.testLoader) {
                this.$refs.testLoader.showStaleHint();
                this.addLog("🟡 已显示黄色提示条", "warn");
              }
            }
          });
        return;
      }

      this.dataLoading = true;
      try {
        const result = await this.mockFetch();
        this.testData = { ...result, fromCache: false };
        cache.setCache("testData", result);
        this.addLog("✅ 首次加载成功，数据已缓存", "success");
      } catch (e) {
        this.addLog(`❌ 首次加载失败: ${e.message}`, "error");
        this.testData = null;
      } finally {
        this.dataLoading = false;
      }
    },

    clearAllCache() {
      this.cacheStore.clearCache();
      this.testData = null;
      this.logs = [];
      failCount = 0;
      this.addLog("🗑️ 缓存已清除", "info");
    },
  },
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f8fafc;
  padding: 40rpx;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 800;
  color: #1e293b;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  color: #94a3b8;
  margin-top: 8rpx;
  display: block;
}

.control-panel {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.control-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.control-row:last-child {
  margin-bottom: 0;
}

.control-label {
  font-size: 26rpx;
  color: #475569;
  font-weight: 600;
}

.btn-group {
  display: flex;
  gap: 12rpx;
}

.btn {
  padding: 12rpx 24rpx;
  border-radius: 12rpx;
  background: #f1f5f9;
  font-size: 24rpx;
  color: #64748b;
}

.btn.active {
  background: #a855f7;
  color: #fff;
}

.action-btn {
  background: #0ea5e9;
  color: #fff;
  font-weight: 600;
}

.small-btn {
  padding: 8rpx 20rpx;
  font-size: 22rpx;
  background: #f1f5f9;
  color: #64748b;
}

.test-section,
.log-section,
.status-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20rpx;
  display: block;
}

.test-result {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.result-label {
  font-size: 24rpx;
  color: #94a3b8;
}

.result-value {
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 600;
}

.result-value.cache {
  color: #f59e0b;
}

.result-value.network {
  color: #10b981;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.log-header .section-title {
  margin-bottom: 0;
}

.log-scroll {
  height: 400rpx;
  background: #1e293b;
  border-radius: 12rpx;
  padding: 20rpx;
}

.log-item {
  display: flex;
  gap: 16rpx;
  padding: 8rpx 0;
  border-bottom: 1rpx solid #334155;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  font-size: 22rpx;
  color: #64748b;
  font-family: monospace;
  flex-shrink: 0;
}

.log-msg {
  font-size: 22rpx;
  color: #e2e8f0;
  font-family: monospace;
}

.log-item.error .log-msg {
  color: #f87171;
}

.log-item.success .log-msg {
  color: #4ade80;
}

.log-item.warn .log-msg {
  color: #fbbf24;
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.log-empty text {
  font-size: 24rpx;
  color: #64748b;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}

.status-row:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 26rpx;
  color: #64748b;
}

.status-value {
  font-size: 26rpx;
  color: #1e293b;
  font-weight: 600;
}
</style>
