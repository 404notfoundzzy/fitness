import request from '@/utils/request';

// ==================== 体重记录 API ====================

// 获取体重历史记录（支持时段筛选）
export const getWeightHistory = (timePeriod) => {
	let url = '/weights/history-by-period';
	if (timePeriod) {
		url += `?timePeriod=${timePeriod}`;
	}
	return request({ url, method: 'GET' });
};

// 获取某日体重列表
export const getWeightListByDate = (date, timePeriod) => {
	let url = `/weights/list?date=${date}`;
	if (timePeriod) {
		url += `&timePeriod=${timePeriod}`;
	}
	return request({ url, method: 'GET' });
};

// 记录体重（支持时段）
export const addWeightRecord = (data) => {
	return request({ url: '/weights', method: 'POST', data });
};

// 更新体重记录
export const updateWeightRecord = (id, data) => {
	return request({ url: `/weights/${id}`, method: 'PUT', data });
};

// 删除体重记录（软删除）
export const deleteWeightRecord = (id) => {
	return request({ url: `/weights/${id}`, method: 'DELETE' });
};

// 检查某天某时段是否已记录
export const checkWeightByPeriod = (date, timePeriod) => {
	return request({
		url: `/weights/check-period?date=${date}&timePeriod=${timePeriod}`,
		method: 'GET'
	});
};

// ==================== 饮水记录 API ====================

// 获取某日饮水列表
export const getWaterListByDate = (date) => {
	return request({ url: `/water/list?date=${date}`, method: 'GET' });
};

// 分页获取饮水记录
export const getWaterPage = (current = 1, size = 10) => {
	return request({ url: `/water/page?current=${current}&size=${size}`, method: 'GET' });
};

// 添加饮水记录
export const addWaterRecord = (data) => {
	return request({ url: '/water', method: 'POST', data });
};

// 更新饮水记录
export const updateWaterRecord = (id, data) => {
	return request({ url: `/water/${id}`, method: 'PUT', data });
};

// 删除饮水记录
export const deleteWaterRecord = (id) => {
	return request({ url: `/water/${id}`, method: 'DELETE' });
};

// 获取当日饮水量合计
export const getDailyWaterTotal = (date) => {
	return request({ url: `/water/daily-total?date=${date}`, method: 'GET' });
};

// 获取一周饮水统计
export const getWeeklyWaterSummary = () => {
	return request({ url: '/water/weekly-summary', method: 'GET' });
};

// ==================== 饮食记录 API ====================

// 获取某日饮食列表
export const getDietListByDate = (date) => {
	return request({ url: `/diet/list?date=${date}`, method: 'GET' });
};

// 分页获取饮食记录
export const getDietPage = (current = 1, size = 10) => {
	return request({ url: `/diet/page?current=${current}&size=${size}`, method: 'GET' });
};

// 添加饮食记录
export const addDietRecord = (data) => {
	return request({ url: '/diet', method: 'POST', data });
};

// 更新饮食记录
export const updateDietRecord = (id, data) => {
	return request({ url: `/diet/${id}`, method: 'PUT', data });
};

// 删除饮食记录
export const deleteDietRecord = (id) => {
	return request({ url: `/diet/${id}`, method: 'DELETE' });
};

// 获取当日营养汇总
export const getDailyNutritionSummary = (date) => {
	return request({ url: `/diet/nutrition-summary?date=${date}`, method: 'GET' });
};

// ==================== 运动记录 API ====================

// 获取某日运动列表
export const getWorkoutListByDate = (date) => {
	return request({ url: `/workouts/list?date=${date}`, method: 'GET' });
};

// 分页获取运动记录
export const getWorkoutPage = (current = 1, size = 10) => {
	return request({ url: `/workouts/page?current=${current}&size=${size}`, method: 'GET' });
};

// 添加运动记录
export const addWorkoutRecord = (data) => {
	return request({ url: '/workouts/record', method: 'POST', data });
};

// 更新运动记录
export const updateWorkoutRecord = (id, data) => {
	return request({ url: `/workouts/${id}`, method: 'PUT', data });
};

// 删除运动记录
export const deleteWorkoutRecord = (id) => {
	return request({ url: `/workouts/${id}`, method: 'DELETE' });
};

// ==================== 身高记录 API ====================

export const getHeightHistory = () => {
	return request({ url: '/heights/history', method: 'GET' });
};

export const getHeightListByDate = (date) => {
	return request({ url: `/heights/list?date=${date}`, method: 'GET' });
};

export const addHeightRecord = (data) => {
	return request({ url: '/heights', method: 'POST', data });
};

export const updateHeightRecord = (id, data) => {
	return request({ url: `/heights/${id}`, method: 'PUT', data });
};

export const deleteHeightRecord = (id) => {
	return request({ url: `/heights/${id}`, method: 'DELETE' });
};

export const getLatestHeight = () => {
	return request({ url: '/heights/latest', method: 'GET' });
};

// ==================== 最近动态聚合 API ====================

export const getRecentActivities = (params = {}) => {
	const { page = 1, pageSize = 10 } = params;
	return request({
		url: '/activities/recent',
		method: 'GET',
		data: { page, pageSize },
		timeout: 30000 // 聚合查询接口单独设置更长超时
	});
};
