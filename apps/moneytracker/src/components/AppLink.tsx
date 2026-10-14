"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { useLoadingStatus } from "./LoadingFeedback";

function LinkFeedback() {
  const { pending } = useLinkStatus();
  useLoadingStatus(pending, "Loading view…");
  return null;
}

export default function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props}>{children}<LinkFeedback /></Link>;
}
