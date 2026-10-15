import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelOwnBooking } from "@/api/bookings";
import { ApiError } from "@/api/client";
import { Alert, Button, FormField, Input, Modal, Textarea, useToast } from "@/components/ui";
import { content } from "@/content";
import { ownBookingsKey, useAccount } from "@/features/account/hooks/use-account";

const t = content.booking.cancel;

/**
 * "Cancel booking" and its dialog, for a booking the customer has not paid yet. The customer gives
 * a reason; their email proves the booking is theirs (filled in when they are logged in).
 */
export function CancelBooking({ reference, size = "md" }: { reference: string; size?: "sm" | "md" }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: account } = useAccount();
  const [open, setOpen] = useState(false);
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const email = typedEmail ?? account?.email ?? "";

  const cancel = useMutation({
    mutationFn: () => cancelOwnBooking(reference, email, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", reference] });
      queryClient.invalidateQueries({ queryKey: ownBookingsKey });
      setOpen(false);
      toast({ title: t.done, variant: "success" });
    },
  });

  const errorKey = cancel.error
    ? cancel.error instanceof ApiError && cancel.error.code in t.errors
      ? (cancel.error.code as keyof typeof t.errors)
      : "unknown"
    : null;

  function confirm() {
    if (!reason.trim() || !email.trim()) {
      setShowErrors(true);
      return;
    }
    cancel.mutate();
  }

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        {t.open}
      </Button>
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setShowErrors(false);
          cancel.reset();
        }}
        title={t.title}
        description={t.description}
        variant="danger"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={cancel.isPending}>
              {t.keep}
            </Button>
            <Button variant="danger" loading={cancel.isPending} onClick={confirm}>
              {t.confirm}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Logged-in customers have their email filled in and don't need to see it. */}
          {!account && (
            <FormField
              label={t.emailLabel}
              required
              error={showErrors && !email.trim() ? content.validation.required : undefined}
            >
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setTypedEmail(e.target.value)} />
            </FormField>
          )}
          <FormField
            label={t.reasonLabel}
            required
            hint={t.reasonHint}
            error={showErrors && !reason.trim() ? t.reasonRequired : undefined}
          >
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          {errorKey && <Alert variant="danger" title={t.errors[errorKey]} />}
        </div>
      </Modal>
    </>
  );
}
