import { FilterQuery, Model, Query, HydratedDocument } from 'mongoose'
import { DataResultEntity, Pagination } from 'axp-ts'

import { TRepositoryOptions } from '.'
import { _BaseAction } from './_base-action'

type urlQueryArgs = {
	page?: number | string
	limit?: number | string
	sort?: string
}

export class QueryCollection<T extends Object> extends _BaseAction {
	/**
	 * Пагинация.
	 */
	public pagination: Pagination

	/**
	 * Фильтр запроса.
	 */
	private _filter: FilterQuery<T>

	/**
	 * Модель монгуса.
	 */
	private _model: Model<T>

	/**
	 * Запрос.
	 */
	private _query: Query<HydratedDocument<T>[], HydratedDocument<T>>

	constructor(
		filter: FilterQuery<T>,
		model: Model<T>,
		options: TRepositoryOptions
	) {
		super(options)

		this.pagination = new Pagination(
			this._options.pagination,
			this._options.pagination?.maxLimit || 100
		)

		this._filter = filter
		this._model = model
		this._query = this._model.find(this._filter)
	}

	/**
	 * Устанавливает параметры фильтра (false полный сброс).
	 */
	filter(filter: FilterQuery<T> | false): this {
		if (filter === false) {
			this._filter = {}
		} else {
			Object.assign(this._filter, filter)
		}

		return this
	}

	/**
	 * Сортировка.
	 */
	sort(value: any): this {
		this._options.sort = value
		return this
	}

	/**
	 * Применение параметров из URL.
	 */
	setUrlQuery(args: urlQueryArgs) {
		// Постраничное разбиение.
		const { page, limit } = args
		this.pagination.set({ page, limit })

		// Сортировка.
		if (args.sort) {
			this.sort(args.sort)
		}

		return this
	}

	/**
	 * Перед выполнением запроса.
	 */
	private preExec(): void {
		try {
			// Сортировка.
			if (this._options.sort) {
				this._query.sort(this._options.sort)
				// console.log('Sort', this._options.sort);
			}

			// Применение пагинации.
			this._query.skip(this.pagination.skip)
			this._query.limit(this.pagination.limit)

			// Выборка полей в запросе.
			if (this._options.select) {
				this._query.select(this._options.select)
				// console.log('Select:', this._options.select);
			}

			// Заполнение связей.
			if (this._options.populate) {
				this._query.populate(this._options.populate)
				// console.log('Populate:', this._options.populate);
			}
		} catch (ex: any) {
			console.log('Ex ProExec:', ex.message)
		}
	}

	/**
	 * Выполнение запроса.
	 */
	exec(): Promise<T[]> {
		return new Promise<T[]>(async (resolve, reject) => {
			try {
				// Коллекция для возврата.
				let items: HydratedDocument<T, {}, {}>[] = []

				// Кол-во сущностей относительно фильтра.
				const total = await this._model.countDocuments(this._filter)
				// console.log('Total:', total)

				// Если есть данные.
				if (total > 0) {
					// Устанавливаем значение общего кол-ва.
					this.pagination.set({ total })

					// Применяем параметры перед запросом.
					this.preExec()

					// Выполнение запроса.
					items = await this._query.exec()

					// Трансформация в объект.
					if (this._options.toObject !== false) {
						resolve(
							items.map(e =>
								e.toObject<T>(this._options.toObject || undefined)
							)
						)
					} else {
						resolve(items)
					}
				} else {
					// Возвращаем результат.
					resolve([])
				}
			} catch (ex: any) {
				// Возвращаем ошибку.
				reject(ex)
			}
		})
	}

	/**
	 * Возвращает промис с моделью результата данных.
	 */
	dataResult(
		cb?: (dR: DataResultEntity<T[]>) => void
	): Promise<DataResultEntity<T[]>> {
		return new Promise<DataResultEntity<T[]>>(async resolve => {
			const dR = new DataResultEntity<T[]>()

			try {
				const data = await this.exec()
				if (data) {
					dR.setData(data)
					dR.info.pagination = this.pagination.toObject()
				} else {
					dR.status = 404
					dR.message = 'Not found'
					dR.errors.push({ code: 'not_found', text: 'Resource not found' })
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
