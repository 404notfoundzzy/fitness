import request, { API_BASE_URL } from '@/utils/request';
import { getToken } from '@/utils/auth';

// 用户登录
export const login = (data) => {
	return request({
		url: '/users/login',
		method: 'POST',
		data: data
	});
};

// 用户注册
export const register = (data) => {
	return request({
		url: '/users/register',
		method: 'POST',
		data: data
	});
};

// 获取今日统计数据 (能量消耗、步数)
export const getTodayStats = () => {
	return request({
		url: '/daily-stats/today',
		method: 'GET'
	});
};

// 获取体重趋势数据
export const getWeightTrend = () => {
	return request({
		url: '/weights/history',
		method: 'GET'
	});
};

// 获取运动时长统计数据 (周/月)
export const getWeeklyActivity = (startDate, endDate) => {
	let url = '/daily-stats/weekly';
	if (startDate && endDate) {
		url += `?startDate=${startDate}&endDate=${endDate}`;
	}
	return request({
		url,
		method: 'GET'
	});
};

// 获取用户资料
export const getUserProfile = () => {
	return request({
		url: '/users/profile',
		method: 'GET'
	});
};

// 更新用户资料
export const updateUserProfile = (data) => {
	return request({
		url: '/users/profile',
		method: 'PUT',
		data: data
	});
};

// 上传用户头像
export const uploadAvatar = (filePath) => {
	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url: `${API_BASE_URL}/users/avatar`,
			filePath,
			name: 'file',
			header: {
				Authorization: getToken()
			},
			success: (res) => {
				let data = {};
				try {
					data = JSON.parse(res.data || '{}');
				} catch (e) {
					reject(e);
					return;
				}

				if (res.statusCode >= 200 && res.statusCode < 300 && data.code === 200) {
					resolve(data.data);
					return;
				}

				reject(new Error(data.message || '头像上传失败'));
			},
			fail: (err) => {
				reject(new Error('头像上传失败'));
			}
		});
	});
};

// 获取最近训练记录 (支持分页)
export const getRecentWorkouts = (current = 1, size = 10) => {
	return request({
		url: `/workouts/recent?current=${current}&size=${size}`,
		method: 'GET'
	});
};

// 分页获取所有训练记录
export const getWorkoutsPage = (current = 1, size = 10) => {
	return request({
		url: `/workouts/page?current=${current}&size=${size}`,
		method: 'GET'
	});
};

// 修改运动记录
export const updateWorkout = (id, data) => {
	return request({
		url: `/workouts/${id}`,
		method: 'PUT',
		data: data
	});
};

// 删除运动记录
export const deleteWorkout = (id) => {
	return request({
		url: `/workouts/${id}`,
		method: 'DELETE'
	});
};

// 开始新训练 (已改为记录模式，目前仅支持提交名称)
export const startWorkout = (name) => {
	return request({
		url: `/workouts/start?name=${encodeURIComponent(name)}`,
		method: 'POST'
	});
};

// 保存完整的训练记录
export const recordWorkout = (data) => {
	return request({
		url: '/workouts/record',
		method: 'POST',
		data: data
	});
};

// 获取练习项目分类字典
export const getExerciseCategories = () => {
	return request({
		url: '/dict/type/exercise_category',
		method: 'GET'
	});
};

// 记录体重
export const recordWeight = (weight, date) => {
	let url = `/weights?weight=${weight}`;
	if (date) {
		url += `&recordDate=${date}`;
	}
	return request({
		url: url,
		method: 'POST'
	});
};

// 检查某天是否已经记录过体重
export const checkWeightRecorded = (date) => {
	return request({
		url: `/weights/check?date=${date}`,
		method: 'GET'
	});
};

// 获取练习项目列表
export const getExercises = (query = '') => {
	return request({
		url: `/exercises?query=${encodeURIComponent(query)}`,
		method: 'GET'
	});
};

// 获取练习项目详情
export const getExerciseDetail = (id) => {
	return request({
		url: `/exercises/${id}`,
		method: 'GET'
	});
};

// 获取字典数据
export const getDictData = (dictType) => {
	return request({
		url: `/dict/type/${dictType}`,
		method: 'GET'
	});
};

// ==================== 自定义动作 API ====================

export const createCustomExercise = (data) => {
	return request({
		url: '/exercises/custom',
		method: 'POST',
		data
	});
};

export const updateCustomExercise = (id, data) => {
	return request({
		url: `/exercises/custom/${id}`,
		method: 'PUT',
		data
	});
};

export const softDeleteExercise = (id) => {
	return request({
		url: `/exercises/custom/${id}`,
		method: 'DELETE'
	});
};

export const checkExerciseReference = (id) => {
	return request({
		url: `/exercises/${id}/reference`,
		method: 'GET'
	});
};

// ==================== 训练计划 API ====================

export const createCustomPlan = (data) => {
	return request({
		url: '/training-plan/custom',
		method: 'POST',
		data
	});
};

export const addExerciseToDay = (dayId, data) => {
	return request({
		url: `/training-plan/days/${dayId}/exercises`,
		method: 'POST',
		data
	});
};

export const batchAddExercises = (dayId, exercises) => {
	return request({
		url: `/training-plan/days/${dayId}/exercises/batch`,
		method: 'POST',
		data: exercises
	});
};

export const removeExerciseFromPlan = (planExerciseId) => {
	return request({
		url: `/training-plan/exercises/${planExerciseId}`,
		method: 'DELETE'
	});
};

export const getTrainingPlanList = () => {
	return request({
		url: '/training-plan/list',
		method: 'GET'
	});
};

export const getTrainingPlanDetail = (id) => {
	return request({
		url: `/training-plan/${id}`,
		method: 'GET'
	});
};

export const getTrainingPlanDays = (id) => {
	return request({
		url: `/training-plan/${id}/days`,
		method: 'GET'
	});
};

export const getActivePlanCount = () => {
	return request({
		url: '/user-active-plan/count',
		method: 'GET'
	});
};
