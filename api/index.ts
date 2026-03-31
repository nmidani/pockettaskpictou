// dist/index.cjs is the esbuild-bundled server.
// It is pre-built by vercel-build and included in the Lambda via includeFiles.
// @ts-ignore
import app from "../dist/index.cjs";

export default app;
