// src/lib/utils/cva.ts
// Alternativa simples ao class-variance-authority se não estiver instalado

export type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

export function cva(
  base: string,
  config?: {
    variants?: Record<string, Record<string, string>>;
    defaultVariants?: Record<string, string>;
  }
) {
  return function (props?: Record<string, any>) {
    if (!config || !props) return base;

    let classes = base;
    const { variants = {}, defaultVariants = {} } = config;

    // Apply default variants first
    for (const [key, defaultValue] of Object.entries(defaultVariants)) {
      if (props[key] === undefined && variants[key]?.[defaultValue]) {
        classes += ' ' + variants[key][defaultValue];
      }
    }

    // Apply provided variants
    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined && variants[key]?.[value]) {
        classes += ' ' + variants[key][value];
      }
    }

    return classes.trim();
  };
}

// Se você já tem class-variance-authority instalado, use este import:
// export { cva, type VariantProps } from "class-variance-authority"