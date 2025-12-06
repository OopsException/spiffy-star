/// <reference types="astro/client" />

// Allow importing .astro files in TypeScript/VS Code without errors
declare module '*.astro' {
  const Component: any;
  export default Component;
}
