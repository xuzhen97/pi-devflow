import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Pi DevFlow extension entry point.
 *
 * Keep registration in this file and move individual workflow features into
 * focused modules as the package grows.
 */
export default function devflowExtension(pi: ExtensionAPI): void {
   pi.registerCommand("devflow", {
      description: "Show Pi DevFlow status",
      handler: async (_args, ctx) => {
         ctx.ui.notify("Pi DevFlow is installed and ready.", "info");
      },
   });
}
