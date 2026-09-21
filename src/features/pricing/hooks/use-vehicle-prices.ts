"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listVehiclePrices, updateVehiclePrice } from "@/api/pricing";
import { useToast } from "@/components/ui";
import { content } from "@/content";
import { availabilityKey } from "@/features/booking/hooks/use-available-vehicles";
import { vehicleKeys } from "@/features/vehicles/hooks/use-vehicles";

const pricesKey = ["vehicle-prices"] as const;

export function useVehiclePrices() {
  return useQuery({ queryKey: pricesKey, queryFn: listVehiclePrices });
}

/** Changes a daily rate, then refreshes everything that shows prices (including the public site's data). */
export function useUpdateVehiclePrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ vehicleId, rate }: { vehicleId: string; rate: number }) => updateVehiclePrice(vehicleId, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricesKey });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
      queryClient.invalidateQueries({ queryKey: availabilityKey });
      toast({ title: content.admin.pricing.saved, variant: "success" });
    },
  });
}
