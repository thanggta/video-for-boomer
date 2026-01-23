import viStrings from '@/../public/locales/vi.json';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type StringKey = NestedKeyOf<typeof viStrings>;

export const t = (key: StringKey, replacements?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = viStrings;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation value is not a string: ${key}`);
    return key;
  }

  if (replacements) {
    return value.replace(/\{(\w+)\}/g, (match, placeholder) => {
      return replacements[placeholder]?.toString() ?? match;
    });
  }

  return value;
};

export const translations = viStrings;

export default t;
