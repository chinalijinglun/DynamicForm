// 文本的正则格式    
export const inputFormat = [
    {
        label: "无",
        value: 'NONE',// 无
    },
    {
        label: "手机号",
        value: 'TELEPHONE',// 电话
    },
    {
        label: "邮箱",
        value: 'EMAIL',// 邮箱
    },
    {
        label: "身份证",
        value: 'ID',
    }
]

// 下拉的方式  
export const selectMode = [
    {
        label: "下拉框",
        value: 'DROP_DOWN',// 下拉
    },
    {
        label: "搜索框",
        value: 'SEARCH', // 搜索
    }
]

// 全局基础字段的类型
export const fieldType = [
    {
        label: "单行文本",
        value: 'INPUT',// 单行文本
    },
    {
        label: "多行文本",
        value: 'TEXTAREA',// 多行文本
    },
    {
        label: "日期时间",
        value: 'DATETIME',// 日期时间
    },
    {
        label: "日期时间区间",
        value: 'DATETIME_RANGE',// 日期时间区间
    },
    {
        label: "数值",
        value: 'DECIMAL',// 数字
    },
    {
        label: "下拉单选",
        value: 'SELECT',// 下拉单选
    },
    {
        label: "下拉多选",
        value: 'CHECKBOX',// 下拉多选
    }, 
    {
        label: "附件",
        value: 'ATTACHMENT',// 附件
    }, 
    {
        label: "关联引用其他表单的记录",
        value: 'RECORD_REF',// 关联引用其他表单的记录
    }, 
    {
        label: "子表单",
        value: 'SUB_FORM',// 子表单
    }, 
    {
        label: "成员",
        value: 'MEMBER',// 成员
    }
]