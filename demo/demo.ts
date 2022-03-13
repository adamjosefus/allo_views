import { RouterList } from "https://deno.land/x/allo_routing@v1.1.4/mod.ts";
import { Server } from "https://deno.land/x/allo_server@v1.0.1/mod.ts";
import { TemplateEngine } from "../mod.ts";


const port = 8080;

const engine = new TemplateEngine();


const router = new RouterList();
router.add("", (req: Request, params: Record<string, string>) => {
    const s = engine.render("./templates/page.html", { foo: "Bar" });
    return new Response(s);
});

const server = new Server(router);
server.listen({port})

console.log(`http://localhost:${port}`);
