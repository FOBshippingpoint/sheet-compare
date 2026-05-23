declare module "*.css" {
  const css: string;
  export default css;
}

declare module "*.po" {
  import type { Messages } from "@lingui/core";

  export const messages: Messages;
}
