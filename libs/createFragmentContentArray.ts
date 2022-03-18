import { type ExpressionType } from "./fragments/ExpressionType.ts";
import { type FragmentContentArrayType } from "./fragments/FragmentContentArrayType.ts";
import { generateJavascriptVariablesCode } from "./helpers/generateJavascriptVariablesCode.ts";
import { type ParamsType } from "./ParamsType.ts";

const expressionParser = /\{\{((?<name>\w+)|(\=(?<stringQuote>["']?)(?<inline>.+)\4))(?<callable>\((?<callableArgs>.*)\))?(?<filters>(\|\w+(\:.+)*)*)?\}\}/g;


type SerializeCallback = (params: ParamsType) => unknown;


const createStringSerializeCallback = (rawString: string, quoteMark: string): SerializeCallback => {
    return _params => {
        return eval.apply(null, [`${quoteMark}${rawString}${quoteMark}`]);
    }
}


const createExpressionSerializeCallback = (expression: string): SerializeCallback => {
    return params => {
        const script = `(() => {
            ${generateJavascriptVariablesCode(params)}
            return ${expression};
        })();`;

        return eval.apply(null, [script]);
    }
}


const createVariableSerializeCallback = (paramName: string): SerializeCallback => {
    return params => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(paramName)) throw new Error(`Missing parameter: ${paramName}`);

        return paramStore.get(paramName)!;
    }
}


const createFunctionSerializeCallback = (paramName: string, rawArgs: string | null): SerializeCallback => {
    return params => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(paramName)) throw new Error(`Missing parameter: ${paramName}`);

        const fce = paramStore.get(paramName) as (...args: unknown[]) => unknown;

        if (rawArgs === null) {
            return fce();
        } else {
            const script = `(() => {
                ${generateJavascriptVariablesCode(params)}
                return [${rawArgs}];
            })();`;

            const args = eval.apply(null, [script]) as unknown[];
            return fce(...args);
        }
    }
}


export function createFragmentContentArray(source: string): FragmentContentArrayType {
    expressionParser.lastIndex = 0;
    const regex = expressionParser;

    const bases: string[] = [];
    const expressions: ExpressionType[] = [];

    const previous = {
        start: 0,
        end: 0
    }

    let match: RegExpMatchArray | null = null;
    while ((match = regex.exec(source)) !== null) {
        const start = match.index!;
        const end = regex.lastIndex!;

        const { name, stringQuote, inline, callable, callableArgs, _filters } = match.groups ?? {} as Record<string, string | null | undefined>;

        // Set tag
        const serializeCallback = ((): SerializeCallback => {
            // Inline force string value
            if (inline && stringQuote) return createStringSerializeCallback(inline, stringQuote);

            // Inline value
            if (inline) return createExpressionSerializeCallback(inline);

            // Variable callable
            if (name && callable) return createFunctionSerializeCallback(name, callableArgs ?? null);

            // Variable
            if (name) return createVariableSerializeCallback(name);

            throw new Error("Unknown tag type");
        })();

        expressions.push({
            serialize: (params) => {
                try {
                    return serializeCallback(params);
                } catch (err) {
                    console.log("Expression serialize error:", err);
                    return null;
                }
            }
        });

        // Set base
        const base = source.substring(previous.end, start);
        bases.push(base);

        // Update to next iteration
        previous.start = start;
        previous.end = end;

    }

    bases.push(source.substring(previous.end));

    return [bases, expressions];
}
