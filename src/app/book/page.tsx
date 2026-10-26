"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

function BookDispatcherContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusText, setStatusText] = useState("Đang chuẩn bị trang đặt kho...");

  useEffect(() => {
    let isCancelled = false;

    async function resolveRoute() {
      const facilityId = searchParams.get("facilityId");
      const unitTypeId = searchParams.get("unitTypeId");
      const unitId = searchParams.get("unitId");

      // 1. If facilityId is already provided, forward directly
      if (facilityId) {
        const query = searchParams.toString();
        router.replace(`/book/${facilityId}${query ? `?${query}` : ""}`);
        return;
      }

      // 2. If unitId is provided, query /storage-units/:unitId to get facilityId & unitTypeId
      if (unitId) {
        setStatusText("Đang tìm cơ sở của ngăn kho...");
        try {
          const unitData: any = await api.get(`/storage-units/${unitId}`);
          if (isCancelled) return;
          const targetFacilityId = unitData?.facilityId || unitData?.facility?.id;
          const targetUnitTypeId = unitData?.unitTypeId || unitData?.unitType?.id || unitTypeId;
          if (targetFacilityId) {
            const params = new URLSearchParams();
            if (targetUnitTypeId) params.set("unitTypeId", targetUnitTypeId);
            params.set("unitId", unitId);
            router.replace(`/book/${targetFacilityId}?${params.toString()}`);
            return;
          }
        } catch (e) {
          console.warn("Could not resolve unit by unitId", e);
        }
      }

      // 3. If unitTypeId is provided, query /storage-unit-types/:unitTypeId to get facilityId
      if (unitTypeId) {
        setStatusText("Đang kiểm tra loại kho phù hợp...");
        try {
          const unitTypeData: any = await api.get(`/storage-unit-types/${unitTypeId}`);
          if (isCancelled) return;
          const targetFacilityId = unitTypeData?.facilityId || unitTypeData?.facility?.id;
          if (targetFacilityId) {
            router.replace(`/book/${targetFacilityId}?unitTypeId=${unitTypeId}`);
            return;
          }
        } catch (e) {
          console.warn("Could not resolve unit type by unitTypeId", e);
        }
      }

      // 4. Fallback: Query all facilities, pick the first active facility or go to /locations
      try {
        setStatusText("Đang điều hướng đến cơ sở kho...");
        const facilities: any = await api.get("/facilities");
        if (isCancelled) return;
        const list = Array.isArray(facilities) ? facilities : facilities?.data || [];
        if (list.length > 0) {
          router.replace(`/book/${list[0].id}`);
          return;
        }
      } catch (e) {
        console.warn("Could not load facilities", e);
      }

      if (!isCancelled) {
        router.replace("/locations");
      }
    }

    resolveRoute();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center flex flex-col items-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-900">{statusText}</h2>
        <p className="text-xs text-slate-500 mt-2">
          Hệ thống đang kết nối đến cơ sở và ngăn kho phù hợp nhất cho bạn.
        </p>
      </div>
    </div>
  );
}

export default function BookDispatcherPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <BookDispatcherContent />
    </Suspense>
  );
}
