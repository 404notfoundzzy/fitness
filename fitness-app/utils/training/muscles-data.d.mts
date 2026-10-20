// muscles-data.mjs 的类型声明（供 TypeScript 侧引用）
export declare const MUSCLES: readonly string[]
export declare const INERT: string[]
export declare const MUSCLE_NAME: Record<string, string>
export declare const MUSCLE_NAME_EN: Record<string, string>
export declare const ALIAS: Record<string, string | null>
export declare const BY_BODYPART: Record<string, Record<string, number>>
export declare const SECONDARY: number
export declare const ZH_MUSCLE_RULES: Array<[RegExp, string]>
export declare const ZH_MUSCLE_FALLBACK: Array<[RegExp, string]>
export declare const EQUIPMENT_RULES: Array<[RegExp, string]>
export declare const EQUIPMENT_DEFAULT: string
export declare const equipmentOf: (...texts: Array<string | null | undefined>) => string
export declare function canonicalMuscleFrom(value: unknown): string | null
export declare function canonicalizeZhMuscle(text: unknown): string | null
