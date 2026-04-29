package com.zzy.fitnessserver.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zzy.fitnessserver.entity.SysDictType;
import com.zzy.fitnessserver.mapper.SysDictTypeMapper;
import com.zzy.fitnessserver.service.SysDictTypeService;
import org.springframework.stereotype.Service;

/**
 * 字典类型服务实现类
 */
@Service
public class SysDictTypeServiceImpl extends ServiceImpl<SysDictTypeMapper, SysDictType> implements SysDictTypeService {
}
