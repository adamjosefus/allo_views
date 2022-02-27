import { ContentFragment } from "./ContentFragment.ts";


export class HtmlContentFragment extends ContentFragment {

    #regex = {
        specialChars: /[&<>"']/g,
    }

    escape(s: unknown): string {
        const regex = this.#regex.specialChars;
        const replacement = new Map<string, string>([
            ['&', '&amp;'],
            ['<', '&lt;'],
            ['>', '&gt;'],
            ['"', '&quot;'],
            ["'", '&#39;'],
        ]);

        regex.lastIndex = 0;
        return `${s}`.replace(regex, (match) => {
            if (replacement.has(match)) {
                return replacement.get(match)!;
            }

            throw new Error("Unknown special character");
        });
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this.#parts.length; i++) {
            const base = this.#parts[i];
            acc.push(base);

            if (this.#values[i] !== undefined) {
                const value = this.#values[i];

                if (value instanceof HtmlContentFragment) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export function html(contents: TemplateStringsArray, ...expressions: any[]) {
    return new HtmlContentFragment([...contents], expressions);
}