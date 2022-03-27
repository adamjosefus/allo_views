import { type ContextFragmentType } from "./ContextFragmentType.ts";


export interface IContextFragmentFactory {
    create(source: string): ContextFragmentType[];
}
