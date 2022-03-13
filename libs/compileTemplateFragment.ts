import { type ExpressionSerializeCallback } from "./ExpressionSerializeCallback.ts";
import { generateJavascriptVariablesCode } from "./helpers/generateJavascriptVariablesCode.ts";

const expressionParser = /\{\{((?<name>\w+)|(\=(?<stringQuote>["']?)(?<inline>.+)\4))(?<callable>\((?<callableArgs>.*)\))?(?<filters>(\|\w+(\:.+)*)*)?\}\}/g;


function createStringSerializer(rawString: string, quoteMark: string): ExpressionSerializeCallback {
    const serialize = () => {
        return eval.apply(null, [`${quoteMark}${rawString}${quoteMark}`]);
    }

    return (_params) => {
        // TODO: Throw error or something
        try {
            return serialize();
        } catch (_error) {
            return null;
        }
    };
}


function createExpressionSerializer(expression: string): ExpressionSerializeCallback {
    return (params: Record<string, unknown>) => {
        const script = `(() => {
            ${generateJavascriptVariablesCode(params)}
            return ${expression};
        })();`;

        return eval.apply(null, [script]);
    }
}


function createVariableSerializer(paramName: string): ExpressionSerializeCallback {
    return (params: Record<string, unknown>) => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(paramName)) throw new Error(`Missing parameter: ${paramName}`);

        return paramStore.get(paramName)!;
    }
}


function createFunctionSerializer(paramName: string, rawArgs: string | null): ExpressionSerializeCallback {
    return (params: Record<string, unknown>) => {
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


export function compileTemplateFragment(source: string): [bases: string[], expressions: ExpressionSerializeCallback[]] {
    expressionParser.lastIndex = 0;
    const regex = expressionParser;

    const bases: string[] = [];
    const expressions: ExpressionSerializeCallback[] = [];

    const previous = {
        start: 0,
        end: 0
    }

    let match: RegExpMatchArray | null = null;
    while ((match = regex.exec(source)) !== null) {
        const start = match.index!;
        const end = regex.lastIndex!;

        const { name, stringQuote, inline, callable, callableArgs, filters } = match.groups ?? {} as Record<string, string | null | undefined>;

        // Set tag
        const exprSerialize = ((): ExpressionSerializeCallback => {
            // Inline force string value
            if (inline && stringQuote) return createStringSerializer(inline, stringQuote);

            // Inline value
            if (inline) return createExpressionSerializer(inline);

            // Variable callable
            if (name && callable) return createFunctionSerializer(name, callableArgs ?? null);

            // Variable
            if (name) return createVariableSerializer(name);

            throw new Error("Unknown tag type");
        })();

        expressions.push(params => {
            try {
                return exprSerialize(params);
            } catch (_error) {
                // TODO: Throw error or something
                console.log("Expression serialize error:", _error);
                
                return null;
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
