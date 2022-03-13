import { type ExpressionSerializeCallback } from "./ExpressionSerializeCallback.ts";

const expressionParser = /\{\{((?<name>\w+)|(\=(?<stringQuote>["']?)(?<inline>.+)\4))(?<callable>\((?<callableArgs>.*)\))?(?<filters>(\|\w+(\:.+)*)*)?\}\}/g;


function generateJavascriptVariablesCode(params: Record<string, unknown>): string {
    function escape(v: unknown): string {
        if (typeof v === 'function') return v.toString();
        if (typeof v === 'number') return v.toString();
        if (typeof v === 'string') return `"${v.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

        return JSON.stringify(v);
    }

    const arr = Object.entries(params);

    type VariableArr = [string, (...args: unknown[]) => unknown][];
    type FunctionArr = [string, unknown][];

    const vars = arr.filter(([_n, v]) => typeof v !== 'function') as VariableArr;
    const funcs = arr.filter(([_n, v]) => typeof v === 'function') as FunctionArr;

    // Variables must be declared before functions
    return [...vars, ...funcs]
        .map(([n, v]) => `const ${n} = ${escape(v)};`)
        .join('\n');
}



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
    const serialize = (params: Record<string, unknown>) => {
        const script = `(() => {
            ${generateJavascriptVariablesCode(params)}
            return ${expression};
        })();`;

        return eval.apply(null, [script]);
    }

    return (params) => {
        // TODO: Throw error or something
        try {
            return serialize(params);
        } catch (_error) {
            return null;
        }
    };
}


function createVariableSerializer(paramName: string): ExpressionSerializeCallback {
    const serialize = (params: Record<string, unknown>) => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(paramName)) throw new Error(`Missing parameter: ${paramName}`);

        return paramStore.get(paramName)!;
    }

    return (params) => {
        // TODO: Throw error or something
        try {
            return serialize(params);
        } catch (_error) {
            return null;
        }
    };
}


function createFunctionSerializer(name: string, rawArgs: string | null): ExpressionSerializeCallback {
    const serialize = (params: Record<string, unknown>) => {
        const paramStore = new Map(Object.entries(params));
        if (!paramStore.has(name)) throw new Error(`Missing parameter: ${name}`);

        const fce = paramStore.get(name) as (...args: unknown[]) => unknown;

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

    return (params) => {
        // TODO: Throw error or something
        try {
            return serialize(params);
        } catch (_error) {
            return null;
        }
    };
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
        const expr = ((): ExpressionSerializeCallback => {
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

        expressions.push(expr);

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
