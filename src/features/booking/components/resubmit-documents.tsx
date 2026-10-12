"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { resubmitDocuments, type BookingDetails } from "@/api/bookings";
import { Alert, Button } from "@/components/ui";
import { content } from "@/content";
import { ownBookingsKey } from "@/features/account/hooks/use-account";
import { DOCUMENT_KINDS } from "@/lib/constants";
import type { BookingDocuments } from "@/types";
import { documentsFormSchema, type DocumentsFormValues } from "../schemas";
import { confirmationPath } from "../steps";
import { BookingAccess } from "./booking-access";
import { DocumentUpload } from "./document-upload";
import { StepHeading } from "./step-parts";

const t = content.booking.resubmit;
const docs = content.booking.documents;

/** The page behind the link we email when staff reject the customer's documents. */
export function ResubmitDocuments({ reference }: { reference: string }) {
  return (
    <BookingAccess reference={reference} title={t.title} description={t.accessDescription(reference.toUpperCase())}>
      {({ details, email }) =>
        details.booking.status === "pending" && details.booking.documentsStatus === "rejected" ? (
          <NewPhotosForm details={details} email={email} />
        ) : (
          <div className="flex max-w-narrow flex-col gap-6">
            <StepHeading title={t.notNeededTitle} description={t.notNeededBody} />
            <div>
              <Button asChild variant="outline">
                <Link href={confirmationPath(details.booking.reference)}>{content.booking.pay.viewBooking}</Link>
              </Button>
            </div>
          </div>
        )
      }
    </BookingAccess>
  );
}

function NewPhotosForm({ details, email }: { details: BookingDetails; email: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { booking } = details;
  const form = useForm<DocumentsFormValues>({
    resolver: zodResolver(documentsFormSchema),
    defaultValues: { documents: { validId: null, proofOfBilling: null, driversLicense: null } },
  });
  const send = useMutation({
    mutationFn: (documents: BookingDocuments) => resubmitDocuments(booking.reference, email, documents),
    onSuccess: () => {
      // The status page may still hold the "rejected" booking from before.
      queryClient.invalidateQueries({ queryKey: ["booking", booking.reference] });
      queryClient.invalidateQueries({ queryKey: ownBookingsKey });
      router.push(confirmationPath(booking.reference));
    },
  });

  // The schema has checked that all three photos are there.
  const onSubmit = form.handleSubmit(({ documents }) => send.mutate(documents as BookingDocuments));

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-narrow flex-col gap-6">
      <StepHeading title={t.title} description={docs.description} />

      {booking.rejectionReason && (
        <Alert variant="warning" title={t.reasonTitle}>
          {booking.rejectionReason}
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        {DOCUMENT_KINDS.map((kind) => (
          <Controller
            key={kind}
            control={form.control}
            name={`documents.${kind}`}
            render={({ field, fieldState }) => (
              <DocumentUpload
                label={docs.kinds[kind].label}
                hint={docs.kinds[kind].hint}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
      </div>

      {send.isError && <Alert variant="danger">{t.error}</Alert>}

      <div>
        <Button type="submit" size="lg" variant="accent" loading={send.isPending || send.isSuccess}>
          {t.send}
        </Button>
      </div>
    </form>
  );
}
