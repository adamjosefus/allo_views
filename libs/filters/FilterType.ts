import { StaticContextValue, InstanceContextValue } from "../context-values/CommonContextValue.ts";

export type FilterType<T = unknown> = (ctx: StaticContextValue, value: T, args: unknown[]) => InstanceContextValue | unknown;
