package com.zzy.fitnessserver.common;

/**
 * 基于 ThreadLocal 的工具类，用于保存和获取当前登录用户的 ID
 */
public class BaseContext {
    private static ThreadLocal<Long> threadLocal = new ThreadLocal<>();

    /**
     * 设置当前登录用户的 ID
     * @param id
     */
    public static void setCurrentId(Long id) {
        threadLocal.set(id);
    }

    /**
     * 获取当前登录用户的 ID
     * @return
     */
    public static Long getCurrentId() {
        return threadLocal.get();
    }

    /**
     * 移除当前线程的用户 ID
     */
    public static void removeCurrentId() {
        threadLocal.remove();
    }
}
