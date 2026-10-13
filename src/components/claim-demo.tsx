"use client";

import { useEffect } from "react";
import { claimDemoLibraryAction } from "@/app/actions";

export function ClaimDemoOnMount() {
  useEffect(() => {
    void claimDemoLibraryAction();
  }, []);

  return null;
}
