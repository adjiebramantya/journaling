export type Messages = Record<string, any>;

export function resolveMessage(messages: Messages, key: string) {
  return key.split(".").reduce<any>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return acc[segment];
    }
    return undefined;
  }, messages);
}

export function formatMessage(
  value: any,
  vars?: Record<string, string | number>
) {
  if (value == null) return "";
  if (!vars) return String(value);
  return String(value).replace(/{(\w+)}/g, (_, name) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

export function createTranslator(messages: Messages, namespace?: string) {
  return (key: string, vars?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const value = resolveMessage(messages, fullKey);
    if (typeof value === "undefined") {
      return fullKey;
    }
    if (typeof value === "string") {
      return formatMessage(value, vars);
    }
    return value;
  };
}
