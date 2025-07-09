import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "rainforest-payment": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "session-key": string;
        "payin-config-id": string;
        "allowed-methods"?: string;
      };
    }
  }
}
export {};
