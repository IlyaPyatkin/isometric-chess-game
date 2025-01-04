export const unsafeGetKeys = Object.keys as <T extends object>(
  obj: T,
) => Array<keyof T>

export const unsafeGetEntries = Object.entries as <T extends object>(
  obj: T,
) => [keyof T, NonNullable<T[keyof T]>][]