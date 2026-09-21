"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  Modal,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeVariant,
} from "@/components/ui";
import { content } from "@/content";
import type { VehicleStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { Vehicle } from "@/types";
import { priceFormSchema, type PriceFormValues } from "../schemas";
import { useUpdateVehiclePrice, useVehiclePrices } from "../hooks/use-vehicle-prices";

const t = content.admin.pricing;

const STATUS_BADGE: Record<VehicleStatus, BadgeVariant> = {
  available: "success",
  maintenance: "warning",
  inactive: "neutral",
};

export function PricingTable() {
  const prices = useVehiclePrices();
  const [changing, setChanging] = useState<Vehicle | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="max-w-narrow text-lg text-muted">{t.description}</p>
      </div>

      {prices.isError ? (
        <ErrorState onRetry={() => prices.refetch()} />
      ) : prices.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : prices.data.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <Table label={t.title} variant="striped">
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.vehicle}</TableHead>
              <TableHead>{t.columns.category}</TableHead>
              <TableHead>{t.columns.rate}</TableHead>
              <TableHead>{t.columns.status}</TableHead>
              <TableHead>{t.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.data.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.name}</TableCell>
                <TableCell>{content.enums.vehicleCategory[vehicle.category]}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{formatCurrency(vehicle.pricePerDay)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[vehicle.status]}>{content.enums.vehicleStatus[vehicle.status]}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setChanging(vehicle)}>
                    {t.change}
                    <span className="sr-only"> {vehicle.name}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal
        open={changing !== null}
        onOpenChange={(open) => !open && setChanging(null)}
        title={changing ? t.modalTitle(changing.name) : ""}
        size="sm"
      >
        {changing && <PriceForm vehicle={changing} onClose={() => setChanging(null)} />}
      </Modal>
    </div>
  );
}

function PriceForm({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const update = useUpdateVehiclePrice();
  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: { rate: String(vehicle.pricePerDay) },
  });
  const { register, formState, setError } = form;

  const onSubmit = form.handleSubmit(({ rate }) => {
    const value = Number(rate);
    if (value === vehicle.pricePerDay) {
      setError("rate", { message: t.noChange });
      return;
    }
    update.mutate({ vehicleId: vehicle.id, rate: value }, { onSuccess: onClose });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-muted">{t.currentRate(formatCurrency(vehicle.pricePerDay))}</p>
      {update.isError && <Alert variant="danger">{content.admin.common.saveError}</Alert>}
      <FormField label={t.rateLabel} required hint={t.rateHint} error={formState.errors.rate?.message}>
        <Input {...register("rate")} inputMode="numeric" autoComplete="off" />
      </FormField>
      <Alert variant="info">{t.impact}</Alert>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={update.isPending}>
          {content.admin.common.cancel}
        </Button>
        <Button type="submit" loading={update.isPending}>
          {update.isPending ? content.admin.common.saving : content.admin.common.save}
        </Button>
      </div>
    </form>
  );
}
