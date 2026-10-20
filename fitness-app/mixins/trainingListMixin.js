import { useTrainingStore } from '@/stores/training.js'
import { listLoadingMixin } from './listLoadingMixin.js'

export const trainingListMixin = {
  mixins: [listLoadingMixin],

  data() {
    return {
      trainingStore: null,
    }
  },

  computed: {
    trainingListLoading() {
      if (this.loadingVisible) return true
      return this.trainingStore?.listLoading ?? false
    },
    trainingList() {
      return this.trainingStore?.list ?? []
    },
    trainingListCount() {
      if (this.trainingListLoading) return '加载中...'
      return `${this.trainingList.length} 个计划`
    },
    hasTrainingData() {
      return this.trainingList.length > 0
    },
  },

  methods: {
    initTrainingStore() {
      this.trainingStore = useTrainingStore()
    },

    async loadTrainingList(forceRefresh = true) {
      if (!this.trainingStore) {
        this.initTrainingStore()
      }
      return await this.withFirstLoad(() => this.trainingStore.fetchMyTraining(forceRefresh), '训练计划列表')
    },
  },
}
