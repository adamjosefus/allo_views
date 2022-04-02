import { type ContextedValue } from "./ContextedValue.ts";


export interface IDocumentBasedValueFactory {
    create(source: string): ContextedValue[];
}
