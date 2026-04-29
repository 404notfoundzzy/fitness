package com.zzy.fitnessserver.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zzy.fitnessserver.entity.SysDictData;
import java.util.List;

/**
 * 字典数据服务类接口
 */
public interface SysDictDataService extends IService<SysDictData> {
    /**
     * 根据字典类型查询字典数据
     */
    List<SysDictData> selectDictDataByType(String dictType);
}
