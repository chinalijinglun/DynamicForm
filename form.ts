/* eslint-disable */

const api = "http://127.0.0.1:18095/api/"


type FieldType = "INPUT" | "TEXTAREA" | "DATETIME" | "MIXED_REF" | "SELECT" | "CURRENCY" | ""

type ComponentType = FieldType | "COST"


type ValueTypeName = "STRING" | "DECIMAL" | "DATETIME" | ""
type TextFormat = "NONE" | "EMAIL" | "TELEPHONE" | "ID"

export interface RecordRef {
    definitionId: string
    recordId: string
}

export interface DesignRecordRef {
    designId: string
    recordId: string
}

export interface Currency {
    // 货币代码， 例如CNY
    code: string
    // 金额
    amount: string
}

// 表单里存储的货币字段
export interface CurrencyValue {
    // 本位币
    standard: Currency
    // 外币
    foreign: Currency
}


/**
 * 渲染表单视图时需要的数据
 */
export class FormViewModel {

    readonly id: string

    // 主表的信息
    design?: FormDesignModel

    // 主表和所有子表的信息
    designs: FormDesignModel[] = []

    constructor(formDesignId: string) {
        this.id = formDesignId
    }

    get components(): FormComponent[] {
        return [...this.design!.components]
    }

    findDesignById(id: string) {
        return this.designs.find(o => o.id == id)
    }

    // 只加载表单设计数据
    async loadOnly() {
        const design = await loadFormDesign(this.id)
        this.design = new FormDesignModel(design)
    }

    async loadDesigns(id: string[]) {
        // 跳过已经加载的design数据
        let ids = id.filter(o => this.designs.find(z => z.id == o) == null)
        let designs = await loadDesigns(ids)
        this.designs.push(...designs)

        return id.map(o => this.designs.find(z => z.id == o)!)
    }

    // 加载渲染页面所有需要的数据
    async load(recordId: string) {

        // 加载主表的数据
        if (this.design == null) {
            await this.loadOnly()
        }
        await this.design!.form.load([recordId])
        this.designs?.push(this.design!)

        const refs: DesignRecordRef[] = []

        // 获得所有需要加载的子表单信息
        this.design!.fields.forEach(field => {
            if (field.type == "MIXED_REF") {
                const records = this.design!.form.get().getMixedRef(field.id!) ?? []
                refs.push(...records)
            }
        })


        // 加载所有design
        const designs = await loadFormDesignBatch(refs.map(o => o.designId))
        this.designs.push(...designs.map(o => new FormDesignModel(o)))

        // load数据
        let promise = refs.map(r => {
            let design = this.designs?.find(o => o.design.id == r.designId)!
            return design.form.load([r.recordId])
        })
        await Promise.all(promise)
    }
}


export class FormDesignModel {

    design: FormDesign

    form!: FormModel

    constructor(design: FormDesign) {
        this.design = design
        if (this.design.formDefinition) {
            this.form = new FormModel({
                definition: design.formDefinition!
            })
        }
    }

    get id(): string | undefined {
        return this.design.id
    }

    get definition(): FormDefinition | undefined {
        return this.design.formDefinition
    }

    get components(): FormComponent[] {
        return this.design.formView!.rows.flatMap(o => o.components);
    }

    get fields(): FormField[] {
        return this.design.formDefinition!.fields
    }

    async save() {
        if (this.id) {
            throw new Error("不能修改FormDesign")
        }
        this.design = await saveFormDesign(this.design)
        this.form = new FormModel({
            definition: this.design.formDefinition!
        })
    }
}



export class FormModel {

    private readonly form: Form

    constructor(form: Form) {
        this.form = {
            definition: form.definition,
            records: form.records ?? []
        }
    }

    get definition(): FormDefinition {
        return this.form.definition!
    }

    get fields(): FormField[] {
        return this.form.definition!.fields
    }

    get records(): FormRecord[] {
        return this.form.records!
    }

    get length(): number {
        return this.form.records!.length
    }

    requireField(fieldId: string) {
        const field = this.form.definition!.fields.find(o => o.id == fieldId)
        if (field == null) {
            throw new Error("找不到field, id=" + fieldId);
        }
        return field
    }

    findById(id: string) {
        return this.records.findIndex(o => o.id == id)
    }

    get(index: number = 0): FormRecordModel {
        const record = this.form.records![index]
        if (record == null) {
            throw new Error("索引越界")
        }
        return new FormRecordModel(this, record)
    }

    add(): FormRecordModel {
        const record: FormRecord = {
            values: {}
        }
        this.form.records!.push(record)
        return new FormRecordModel(this, record)
    }

    /**
     * 加载表单记录
     * @param id id数组
     */
    async load(id: string[]) {
        const forms = await loadFormBatch(id.map(o => {
            return {
                definitionId: this.definition.id!,
                recordId: o
            } as RecordRef
        }))
        this.form.definition = forms[0].definition

        // 按照ID更新数据，其余的追加到最后
        let temp: any[] = []
        forms[0].records?.forEach(r => {
            let index = this.findById(r.id!)
            if (index >= 0) {
                this.records[index] = r
            } else {
                temp.push(r)
            }
        })
        this.records.push(...temp)
    }
}

export class FormRecordModel {

    readonly form: FormModel
    readonly record: FormRecord

    constructor(form: FormModel, record: FormRecord) {
        this.form = form
        this.record = record
    }

    get id(): string | undefined {
        return this.record.id
    }

    get createdTime(): string {
        return this.record.createdTime!
    }

    get(fieldId: string): string | undefined {
        this.check(fieldId, ['INPUT', 'DATETIME', 'TEXTAREA', 'SELECT', 'CURRENCY'])
        return this.record.values[fieldId]
    }
    set(fieldId: string, value: string) {
        this.check(fieldId, ['INPUT', 'DATETIME', 'TEXTAREA', 'SELECT', 'CURRENCY'])
        this.record.values[fieldId] = value
    }

    getMixedRef(fieldId: string): DesignRecordRef[] | undefined {
        this.check(fieldId, ['MIXED_REF'])
        let v = this.record.values[fieldId]
        if (v == null) {
            return undefined
        }
        const list = JSON.parse(v) as any[]
        return list.map(o => {
            return {
                designId: o[0],
                recordId: o[1]
            }
        })
    }

    setMixedRef(fieldId: string, value: DesignRecordRef[]) {
        this.check(fieldId, ['MIXED_REF'])
        let a = value?.map(o => [o.designId, o.recordId]) ?? []
        this.record.values![fieldId] = JSON.stringify(a)
    }

    getCurrencyValue(fieldId: string): CurrencyValue | undefined {
        this.check(fieldId, ['CURRENCY'])
        let v = this.record.values[fieldId]
        if (v == null) {
            return undefined
        }
        let array: string[] = JSON.parse(v)
        return {
            standard: {
                code: array[0],
                amount: array[1]
            },
            foreign: {
                code: array[2],
                amount: array[3]
            }
        }
    }

    setCurrencyValue(fieldId: string, value?: CurrencyValue) {
        this.check(fieldId, ['CURRENCY'])
        if (value == null) {
            delete this.record.values![fieldId]
            return
        }
        this.record.values![fieldId] = JSON.stringify([value.standard.code, value.standard.amount, value.foreign.code, value.foreign.amount])
    }

    async save() {
        const record = await saveFormRecord(this.form.definition.id!, this.record)
        this.record.id = record.id
        this.record.createdTime = record.createdTime
        this.record.updateTime = record.updateTime
    }

    private check(fieldId: string, types: FieldType[]) {
        const field = this.form.requireField(fieldId)
        if (types.indexOf(field.type) == -1) {
            throw new Error("字段类型不匹配, 字段code=" + field.code + "字段类型" + field.type);
        }
    }
}


export interface Form {
    definition?: FormDefinition
    records?: FormRecord[]
    queryCount?: number
}

export interface FormRecord {
    id?: string
    createdTime?: string
    updateTime?: string
    values: { [key: string]: string }
}

export interface FormComponent {
    fieldId?: string
    type: ComponentType
    code: string
    label?: string
    props?: FormViewComponentProps
}

export interface FormDesign {
    id?: string
    formDefinitionId?: string
    name?: string
    formView?: FormView
    formDefinition?: FormDefinition
}

export interface FormView {
    rows: FormRow[]

}

export interface FormRow {
    components: FormComponent[]
}

export interface FormViewComponentProps {
    name?: string
    placeholder?: string
    format?: TextFormat
    required?: boolean
    wordDownLimit?: number
    wordUpLimit?: number
    defaultValue?: string
    options?: {
        value: string
    }[]
    mixedFormRefRange?: string[]
}

export interface FormRecordVo {
    id: string
}

export interface FormField {
    id?: string
    type: FieldType
    columns: string[]
    code: string
    formDefinitionId: string
}

export interface FormDefinition {
    id?: string
    tenantId: string
    sheetDefinitionId: string
    sheetDefinition?: SheetDefinition
    createdTimeColumnId: string
    updateTimeColumnId: string
    serialNoColumnId: string
    name: string
    fields: FormField[]
}


export interface SheetDefinition {
    id: string
    name: string
    columns: SheetColumn[]
}

export interface SheetColumn {
    type: ValueTypeName
    id: string
    code: string
}


function request(url: string, data: any): Promise<any> {
    return fetch(url, {
        method: 'post',
        mode: 'cors',
        headers: {
            "Authorization": "Bearer 11",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(r => r.data)
}

function saveFormDesign(design: FormDesign): Promise<FormDesign> {
    return request(api + "form-design/save", design)
}

function loadFormDesign(id: string): Promise<FormDesign> {
    return request(api + "form-design/load", {
        id
    });
}
export function loadFormDesignBatch(id: string[]): Promise<FormDesign[]> {
    return request(api + "form-design/load-batch", {
        idList: id
    });
}

function saveFormRecord(formDefinitionId: string, record: FormRecord): Promise<FormRecord> {
    return request(api + "form/save/" + formDefinitionId, record);
}

function loadForm(definitionId: string, recordId: string[]): Promise<Form> {
    let refs: any = {}
    refs[definitionId] = recordId
    return request(api + "form/load", {
        refs
    }).then(r => r[0])
}

function loadFormBatch(refs: RecordRef[]): Promise<Form[]> {
    const map: any = {}
    refs.forEach(ref => {
        let list = map[ref.definitionId]
        if (list == null) {
            list = []
            map[ref.definitionId] = list
        }
        list.push(ref.recordId)
    })
    return request(api + "form/load", {
        refs: map
    });
}

async function loadDesigns(id: string[]) {
    const designs = await loadFormDesignBatch(id)
    const models = designs.map(o => new FormDesignModel(o))
    return models;
}



const sub1: FormDesign = {
    name: "住宿费用",
    formView: {
        rows: [{
            components: [{
                type: "INPUT",
                code: "费用金额",
                props: {
                    name: "费用金额",
                    placeholder: "费用金额"
                }
            }, {
                type: "DATETIME",
                code: "消费时间",
                props: {
                    name: "住宿时间"
                }
            }, {
                type: "INPUT",
                code: "C1",
                props: {
                    name: "酒店名称"
                }
            }]
        }]
    }
}
const sub2: FormDesign = {
    name: "交通费用",
    formView: {
        rows: [{
            components: [{
                type: "INPUT",
                code: "费用金额",
                props: {
                    name: "费用金额",
                    placeholder: "费用金额"
                }
            }, {
                type: "DATETIME",
                code: "消费时间",
                props: {
                    name: "出发时间"
                }
            }, {
                type: "INPUT",
                code: "C2",
                props: {
                    name: "车次"
                }
            }]
        }]
    }
}



export async function testSave() {

    // 创建子表1
    const design1 = new FormDesignModel(sub1)
    await design1.save()

    // 保存子表1数据
    // let value1 = design1.form.add()
    // value1.set(design1.form.fields[0].id!, '103.2')
    // value1.set(design1.form.fields[1].id!, '2022-01-02')
    // await value1.save()
    // let value2 = design1.form.add()
    // value2.set(design1.form.fields[0].id!, '224')
    // value2.set(design1.form.fields[1].id!, '2022-03-14')
    // await value2.save()


    // 创建子表2
    const design2 = new FormDesignModel(sub2)
    await design2.save()

    // 保存子表2数据
    // let value3 = design2.form.add()
    // value3.set(design2.form.fields[0].id!, 'G308')
    // value3.set(design2.form.fields[1].id!, '2022-02-09')
    // await value3.save()
    // let value4 = design2.form.add()
    // value4.set(design2.form.fields[0].id!, 'Z1')
    // value4.set(design2.form.fields[1].id!, '2022-02-10')
    // await value4.save()


    // 创建主表
    const main: FormDesign = {
        name: "测试表单" + new Date().getTime(),
        formView: {
            rows: [{
                components: [{
                    type: "INPUT",
                    code: "M1",
                    props: {
                        name: "姓名",
                        placeholder: "请输入姓名"
                    }
                }, {
                    type: "COST",
                    code: "M2",
                    props: {
                        name: "机票",
                        placeholder: "请保存机票",
                        mixedFormRefRange: [design1.id!, design2.id!]
                    }
                }, {
                    type: "CURRENCY",
                    code: "M3",
                    props: {
                        name: "货币",
                        placeholder: "请输入货币"
                    }
                }, {
                    type: "SELECT",
                    code: "M4",
                    props: {
                        name: "单选序列",
                        placeholder: "请输入",
                        options: [{
                            value: "北京"
                        }, {
                            value: "上海"
                        }, {
                            value: "深圳"
                        }]
                    }
                }]
            }]
        }
    }
    const designMain = new FormDesignModel(main)
    await designMain.save()

    // 保存主表数据
    const mainValue = designMain.form.add()
    mainValue.set(designMain.form.fields[0].id!, '张三')
    // mainValue.setMixedRef(designMain.form.fields[1].id!, [{
    //     designId: design1.design.id!,
    //     recordId: value1.id!
    // }, {
    //     designId: design2.design.id!,
    //     recordId: value3.id!
    // }])
    await mainValue.save()

    return {
        designId: designMain.id!,
        recordId: mainValue.id!
    }
}



export async function testLoad(designId: string, recordId: string) {

    // 读取数据
    const model = new FormViewModel(designId)
    await model.load(recordId)
    return model
}