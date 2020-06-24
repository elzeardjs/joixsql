import Element from './element'
import Is from './is'
import _ from 'lodash'

export default class Get {

    private _is: Is
    private _element: Element
    
    constructor(element: Element){
        this._element = element
        this._is = new Is(element)
    }

    public is = () => this._is
    public element = () => this._element
    public flags = () => this.element().flags()
    public rules = () => this.element().rules()
    public type = () => this.element().type()

    defaultValue = (): any => this.is().defaultValue() ? this.flags().default : undefined
    foreignKey = (): Array<string[2]> => this.is().foreignKey() ? this.flags().foreign_key : undefined

    max = () => this.is().maxSet() ? _.find(this.rules(), {name: 'max'}).args.limit : undefined
    greater = () => this.is().greaterSet() ? _.find(this.rules(), {name: 'greater'}).args?.limit : undefined
    min = () => this.is().minSet() ? _.find(this.rules(), {name: 'min'}).args?.limit : undefined
    less = () => this.is().lessSet() ? _.find(this.rules(), {name: 'less'}).args?.limit : undefined
    precision = () => this.is().precisionSet() ? _.find(this.rules(), {name: 'precision'}).args?.limit : undefined
    
    stringLengthByType = () => {
        if (this.type() !== 'string'){
            return -1
        }
        if (_.find(this.rules(), o => o.name === 'dataUri' || o.name === 'uri' || o.name === 'uriCustomScheme' || o.name === "uriRelativeOnly"))
            return 90000
        if (_.find(this.rules(), o => o.name === 'email' || o.name === 'domain' || o.name === 'hostname' || o.name === 'ipVersion'))
            return 255
        if (_.find(this.rules(), {name: 'guid'}))
            return 70
        if (_.find(this.rules(), o => o.name === 'creditCard' || o.name === 'ip' || o.name === 'isoDate' || o.name === 'isoDuration'))
            return 32
        return -1
    }
}