declare module "sql.js/dist/sql-wasm.js" {
  const content: string;
  export default content;
}

declare module "sql.js/dist/sql-wasm.wasm" {
  const content: ArrayBuffer;
  export default content;
}
