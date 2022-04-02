import { type InstanceContextValue } from "./context-values/mod.ts";


export interface IDocumentBasedValueFactory {
    create(source: string): InstanceContextValue[];
}
