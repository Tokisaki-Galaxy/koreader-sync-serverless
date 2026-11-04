declare module "*.txt" {
  const content: string;
  export default content;
}

declare module "*.wasm" {
  const content: ArrayBuffer;
  export default content;
}
