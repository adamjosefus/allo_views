import { ParamsType } from "../ParamsType.ts";
import { ContextValue } from "./ContextValue.ts";


class _CommonContextValue extends ContextValue {
    render(_params: ParamsType): string {
        throw new Error("Not implemented");
    }
}

export type StaticContextValue = typeof _CommonContextValue;
export type InstanceContextValue = _CommonContextValue;
