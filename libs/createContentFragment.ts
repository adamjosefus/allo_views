import { type ContentFragment } from "./ContentFragment.ts";
import { HtmlContentFragment } from "./HtmlContentFragment.ts";
import { JsContentFragment } from "./JsContentFragment.ts";


export const createContentFragment = (contextType: 'html' | 'js', bases: string[] | string, values: unknown[] = []): ContentFragment => {
    switch (contextType) {
        case 'html':
            return new HtmlContentFragment(bases, values);

        case 'js':
            return new JsContentFragment(bases, values);

        default:
            throw new Error(`Unknown renderning context "${contextType}"`);
    }
}
