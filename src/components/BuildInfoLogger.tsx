"use client";

import { useEffect } from "react";

export const CURRENT_COMMIT =
  (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA &&
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)) ||
  "58b9179";

export const BUILD_TIME = "2026-10-27 03:36 GMT+7";

export default function BuildInfoLogger() {
  useEffect(() => {
    console.log(
      `%c🚀 [SelfStorage FE Live] Commit: ${CURRENT_COMMIT} | Build: ${BUILD_TIME} | Auto-polling SePay: ACTIVE`,
      "background: #0f172a; color: #38bdf8; font-weight: 800; font-size: 13px; padding: 6px 12px; border-radius: 6px; border: 1px solid #38bdf8;"
    );
  }, []);

  return null;
}
