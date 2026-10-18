"use client";

import { DetailLink } from "./DetailPanel";
import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { useLoadingStatus } from "./LoadingFeedback";

function LinkFeedback() {
  const { pending } = useLinkStatus();
  useLoadingStatus(pending, "Loading view…");
  return null;
}

export default function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  if (typeof props.href === "string" && props.href.startsWith("/details?")) return <DetailLink href={props.href} className={props.className}>{children}</DetailLink>;
  return <Link {...props}>{children}<LinkFeedback /></Link>;
}
