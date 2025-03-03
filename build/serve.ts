import { build } from "./build";

Bun.serve({
    port: process.env.PORT || 1024,
    routes: {
        "/": async () => {
            // Build the files
            const buildOutput = await build(false);

            // Send the file content
            return new Response(buildOutput, {
                'headers': {
                    'cache-control': 'no-store',
                    'content-type': 'text/javascript',
                }
            });
        }
    },
    fetch() {
        return new Response('Hi it wasn\'t expected for you to visit this page.');
    }
})