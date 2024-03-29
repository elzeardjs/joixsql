import { Schema } from 'joi'
import { config } from '../../index'
import Element from './element'

import { LIST_SUPPORTED_TYPES } from './mysql/types'
import Ecosystem from '../ecosystem'

import MYSQL_RESERVED_WORDS_LIST from './mysql/mysql-reserved-words'
import errors from './errors'

export const detectAndTriggerSchemaErrors = (schema: Schema, tableName: string) => {
    const described = schema.describe().keys
    let countPrimary = 0
    
    const detectMySQLNamingError = (key: string) => {
        if (MYSQL_RESERVED_WORDS_LIST.indexOf(key) != -1){
            throw errors.reservedMySQLTransacKeyWord(key)
        }
        const reg = /^[A-Za-z][\w_]*$/
        if (!reg.test(key)){
            throw errors.wrongColumnOrTableFormat(key)
        }
    }

    detectMySQLNamingError(tableName)

    for (const key in described){
        const elem = parseSupportedTypes(schema, new Element(described[key], key))    
        if (elem.is().primaryKey())
            countPrimary++
        detectMySQLNamingError(key)
    }

    if (countPrimary > 1)
        throw errors.manyPrimaryKey(tableName)
}

export const parseSupportedTypes = (schema: Schema, elem: Element): Element => {
    const key = elem.key()

    const assignSpecsToDescribeKey = (e: any) => {
        if (e && e.flags){
            if (e.flags.auto_increment){
                if (Array.isArray(e.rules)){
                    e.rules.push({name: 'positive'})
                } else {
                    e.rules = [{name: 'positive'}]
                }
                e.flags.presence = elem.flags().presence
            }
            e.flags.auto_increment = undefined
            e.flags.primary_key = elem.flags().primary_key
            e.flags.foreign_key = elem.flags().foreign_key
            e.flags.delete_cascade = elem.flags().delete_cascade
            e.flags.unique = elem.flags().unique
            e.flags.update_cascade = elem.flags().update_cascade
            e.flags.populate = elem.flags().populate
            e.flags.noPopulate = elem.flags().noPopulate
            e.flags.group = elem.flags().group
            e.flags.default = elem.flags().default
        }
        return e
    }

    if (config.hasEcosystem()){
        const ecosystem = config.ecosystem() as Ecosystem
        if (elem.is().foreignKey() || elem.is().populate()){
            const [table, k] = elem.is().foreignKey() ? elem.get().foreignKey() : elem.get().populate()
            const m = ecosystem.getModel(table)
            if (m){
                return new Element(assignSpecsToDescribeKey(m.schema.describe().keys[k]), key)
            }
        }
    }

    if (elem.is().ref()){
        const ref = elem.get().ref()
        const newElemObject = assignSpecsToDescribeKey(schema.describe().keys[ref])
        return new Element(newElemObject, key)
    }

    if (LIST_SUPPORTED_TYPES.indexOf(elem.type()) == -1)
        throw errors.unsupportedType(elem.type())
    
    return elem
}