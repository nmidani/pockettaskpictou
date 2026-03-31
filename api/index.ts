// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require("../dist/index.cjs");
const app = mod.default ?? mod;

export default app;
