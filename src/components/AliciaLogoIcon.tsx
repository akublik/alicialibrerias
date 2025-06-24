import * as React from "react";
import { cn } from "@/lib/utils";

export const AliciaLogoIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 40 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(className)}
    {...props}
  >
    <text
      x="20"
      y="22"
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily="Belleza, sans-serif"
      fontSize="32"
    >
      A
    </text>
    <text
      x="31"
      y="29"
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily="Alegreya, serif"
      fontSize="12"
      fontWeight="600"
    >
      IA
    </text>
  </svg>
);