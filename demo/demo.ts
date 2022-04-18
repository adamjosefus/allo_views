import { dirname, fromFileUrl, join } from "https://deno.land/std@0.135.0/path/mod.ts";
import { RouterList } from "https://deno.land/x/allo_routing@v1.1.4/mod.ts";
import { Server } from "https://deno.land/x/allo_server@v1.0.1/mod.ts";
import { html, js, TemplateEngine } from "../mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

const port = 8080;
const templateDir = join(__dirname, "templates");

const engine = new TemplateEngine();

const router = new RouterList();
router.add("", (_req: Request, _params: Record<string, string>) => {
    const templatePath = join(templateDir, "page.html");
    const s = engine.render(templatePath, {
        html_text: "<h1>Hello, world!</h1>",
        html: html`<h1>Hello, world!</h1>`,
        js_text: `(() => 123)()`,
        js: js`(() => 123)()`,
    });

    return new Response(s);
});

const server = new Server(router);
server.listen({ port });

console.log(`http://localhost:${port}`);
