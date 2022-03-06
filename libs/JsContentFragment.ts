/**
 * @copyright Copyright (c) 2022 Adam Josefus
 */

import { ContentFragment } from "./ContentFragment.ts";


export class JsContentFragment extends ContentFragment {
    
    escape(s: any): string {
        return JSON.stringify(s);
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this.parts.length; i++) {
            const base = this.parts[i];
            acc.push(base);

            if (this.values[i] !== undefined) {
                const value = this.values[i];

                if (value instanceof JsContentFragment) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export function js(contents: TemplateStringsArray, ...expressions: any[]) {
    return new JsContentFragment([...contents], expressions);
}