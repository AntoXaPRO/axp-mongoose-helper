import { PopulateOptions } from 'mongoose'
import { TRepositoryOptions } from '.'

export abstract class _BaseAction {
	/**
	 * Настройки репозитория.
	 */
	protected _options: TRepositoryOptions

	constructor(options: TRepositoryOptions) {
		this._options = options
	}

	/**
	 * Сброс или изменение конфигурации по умолчанию.
	 */
	options(options: false | TRepositoryOptions): this {
		if (options === false) {
			this._options = {}
		} else {
			Object.assign(this._options, options)
		}

		return this
	}

	/**
	 * Выборка полей.
	 */
	select(arg: string | string[]): this {
		const items = typeof arg === 'string' ? [arg] : arg
		this._options.select = Object.assign(this._options.select || [], items)
		return this
	}

	/**
	 * Заполнение сущностей.
	 */
	populate(arg: PopulateOptions | Array<PopulateOptions>): this {
		this._options.populate = arg
		return this
	}
}
