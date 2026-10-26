"use client";

import { useEffect } from "react";

export const CURRENT_COMMIT = "cefdd62";
export const BUILD_TIME = "2026-10-27 02:45 GMT+7";

export default function BuildInfoLogger() {
  useEffect(() => {
    console.log(
      `%c🚀 [SelfStorage FE Live] Commit: ${CURRENT_COMMIT} | Build: ${BUILD_TIME} | Auto-polling SePay: ACTIVE`,
      "background: #0f172a; color: #38bdf8; font-weight: 800; font-size: 13px; padding: 6px 12px; border-radius: 6px; border: 1px solid #38bdf8;"
    );
  }, []);

  return null;
}
