export const basicComponents = [
    {
      type: "INPUT",
      icon: 'icon-input',
      drag:true,
      props: {
        colspan:24,
        name:"单行文本",
        placeholder: '',
        format: 'NONE',
        required: false,
        wordDownLimit: 0,
        wordUpLimit: 0,
        defaultValue: ''
      }
    },
    {
      type: "SELECT",
      icon: 'icon-radio-active',
      drag:true,
      props: {
        colspan:24,
        defaultValue: '',
        name: '下拉单选',
        placeholder:'',
        required: false,
        dropDownType:'DROP_DOWN',
        options: [
          {
            value: '选项1',
          },
          {
            value: '选项2',
          },
          {
            value: '选项3',
          }
        ],
        recordRefId: '',
      }
    },
    {
      type: "CHECKBOX",
      icon: 'icon-check-box',
      drag:true,
      props: {
        colspan:24,
        defaultValue: '',
        name: '下拉多选',
        placeholder:'',
        required: false,
        dropDownType:'DROP_DOWN',
        options: [
          {
            value: '选项1',
          },
          {
            value: '选项2',
          },
          {
            value: '选项3',
          }
        ],
        recordRefId: '',
      }
    },
    {
      type: "SUB_FORM",
      icon: 'icon-jilianxuanze',
      drag:true,
      props: {
        colspan:24,
        defaultValue: '',
        name: '子表/明细',
        required: false,
        dropDownType:'DROP_DOWN',
        recordRefId: '',
        mixedFormRefRange:[]
      }
    }
  ]
  
  // 基本数据模型
  var formView = {
    rows:[
      {
        components:[{
          fieldId: '',
          type: 'INPUT',
          props: {
            colspan:24,
            name:"单行文本",
            placeholder: '',
            format: 'NONE',
            required: false,
            wordDownLimit: 0,
            wordUpLimit: 0,
            defaultValue: '',
            dropDownType:'DROP_DOWN',
            recordRefId: '',
            options: [{
  
            }]
          }
        }],
        colSize:24,
      },
      {
        components:[{
        }],
        colSize:24,
      }
  ]
  }