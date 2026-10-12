import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { getOwnBooking, type BookingDetails } from "@/api/bookings";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { content } from "@/content";
import { useAccount } from "@/features/account/hooks/use-account";
import { StepHeading } from "./step-parts";

const t = content.booking.access;

/**
 * Asks for the email the booking was made with before showing it, so a forwarded or guessed link
 * is not enough to pay for or change someone's booking. Then renders `children` with the booking.
 */
export function BookingAccess({
  reference,
  title,
  description,
  children,
}: {
  reference: string;
  title: string;
  description: string;
  children: (access: { details: BookingDetails; email: string }) => React.ReactNode;
}) {
  const { data: account } = useAccount();
  // Signed-in customers have their email filled in; they still confirm with Continue.
  const [typed, setTyped] = useState<string | null>(null);
  const email = typed ?? account?.email ?? "";
  const setEmail = setTyped;
  const [showRequired, setShowRequired] = useState(false);
  const lookup = useMutation({ mutationFn: () => getOwnBooking(reference, email) });

  if (lookup.data) return <>{children({ details: lookup.data, email })}</>;

  return (
    <form
      noValidate
      className="flex max-w-narrow flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.trim()) {
          setShowRequired(true);
          return;
        }
        lookup.mutate();
      }}
    >
      <StepHeading title={title} description={description} />
      <FormField
        label={t.email}
        required
        hint={t.hint}
        error={showRequired && !email.trim() ? content.validation.required : undefined}
      >
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      {lookup.isError && (
        <Alert variant="danger" title={t.notFoundTitle}>
          {t.notFound}
        </Alert>
      )}
      <div>
        <Button type="submit" size="lg" variant="accent" loading={lookup.isPending} arrow>
          {t.continue}
        </Button>
      </div>
    </form>
  );
}
