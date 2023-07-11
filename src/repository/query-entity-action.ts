import { DataResultEntity } from 'axp-ts'
import { Query, HydratedDocument } from 'mongoose'

import { TRepositoryOptions } from '.'
import { _BaseAction } from './_base-action'

export class QueryEntity<T extends Object> extends _BaseAction {
	private _query: Query<HydratedDocument<T> | null, HydratedDocument<T>>

	constructor(
		query: Query<HydratedDocument<T> | null, HydratedDocument<T>>,
		options: TRepositoryOptions
	) {
		super(options)
		this._query = query
	}

	exec(): Promise<T | null> {
		return new Promise<T | null>(async (resolve, reject) => {
			let result: HydratedDocument<T> | null = null

			try {
				// Выборка полей в запросе.
				if (this._options.select) {
					this._query.select(this._options.select)
				}

				// Заполнение связей.
				if (this._options.populate) {
					this._query.populate(this._options.populate)
				}

				result = await this._query.exec()

				if (result && this._options.toObject) {
					resolve(result.toObject<T>(this._options.toObject || undefined))
					return
				}
			} catch (ex: any) {
				reject(ex)
			}

			resolve(result)
		})
	}

	dataResult(
		cb?: (dR: DataResultEntity<T | null>) => void
	): Promise<DataResultEntity<T | null>> {
		return new Promise(async resolve => {
			const dR = new DataResultEntity<T | null>()

			try {
				const result = await this.exec()
				if (result) {
					dR.setData(result)
				} else {
					dR.status = 404
					dR.message = 'Not Found'
					dR.errors.push({ code: 'not_found', text: 'Resource not found' })
					dR.setData(null)
				}
			} catch (ex: any) {
				dR.status = 500
				dR.message = 'Server Error'
				dR.errors.push({ code: 'server', text: ex.message })
			}

			if (cb) cb(dR)
			resolve(dR)
		})
	}
}
