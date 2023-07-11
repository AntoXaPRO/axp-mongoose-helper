export * from './_base-action'
export * from './query-entity-action'
export * from './query-collection-action'

import { Model, FilterQuery, PopulateOptions, ToObjectOptions } from 'mongoose'

import { QueryCollection } from './query-collection-action'
import { QueryEntity } from './query-entity-action'

/**
 * Настройки репозитория по умолчанию.
 */
export type TRepositoryOptions = {
	select?: string[]
	populate?: PopulateOptions | Array<PopulateOptions>
	sort?: any
	toObject?: false | ToObjectOptions
	pagination?: {
		limit?: number
		maxLimit?: number
	}
}

export class Repository<T extends Object> {
	/**
	 * Конфигурация сервиса.
	 */
	private _options: TRepositoryOptions

	/**
	 * Модель монгуса.
	 */
	public model: Model<T>

	constructor(model: Model<T>, options?: TRepositoryOptions) {
		this.model = model
		this._options = options || {}
	}

	/**
	 * Копирует и возвращает клон объекта настроек для использования
	 * при инициализации других классов внутри этого.
	 */
	getOptions(): TRepositoryOptions {
		return Object.assign({}, this._options)
	}

	/**
	 * Выборка из коллекции.
	 */
	find(filter: FilterQuery<T> = {}): QueryCollection<T> {
		return new QueryCollection(filter, this.model, this.getOptions())
	}

	/**
	 * Одна сущность.
	 */
	findOne(filter: FilterQuery<T>): QueryEntity<T> {
		const query = this.model.findOne(filter)
		return new QueryEntity(query, this.getOptions())
	}

	/**
	 * Одна сущность по Ид.
	 */
	findById(id: string): QueryEntity<T> {
		const query = this.model.findById(id)
		return new QueryEntity(query, this.getOptions())
	}

	/**
	 * Проверка ObjectId
	 */
	isValidObjectId(id: string): boolean {
		if (typeof id !== 'string') return false
		return id.match(/^[a-f\d]{24}$/i) ? true : false
	}
}
