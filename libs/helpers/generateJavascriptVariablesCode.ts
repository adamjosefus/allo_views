/**
 * @internal
 * TODO: Rename
 */
export function generateJavascriptVariablesCode(params: Record<string, unknown>): string {
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
