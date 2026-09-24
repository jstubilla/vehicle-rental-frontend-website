"use client";

import { Controller } from "react-hook-form";
import { Alert, Button, FieldGroup, FormField, Input, StarRatingInput, Textarea } from "@/components/ui";
import { content } from "@/content";
import { useReviewForm } from "../hooks/use-review-form";

const t = content.reviews.form;

/** The public review form. Reviews are saved privately (see /src/api/reviews.ts). */
export function ReviewForm() {
  const { form, onSubmit, isSubmitting, isSuccess, isError, startOver } = useReviewForm();
  const { register, control, formState } = form;
  const { errors } = formState;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert variant="success" title={t.successTitle}>
          {t.successBody}
        </Alert>
        <Button variant="outline" onClick={startOver}>
          {t.another}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {isError && (
        <Alert variant="danger" title={t.errorTitle}>
          {t.errorBody}
        </Alert>
      )}

      <FormField label={t.name} required error={errors.name?.message}>
        <Input {...register("name")} autoComplete="name" />
      </FormField>

      <FieldGroup label={t.rating} required error={errors.rating?.message}>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <StarRatingInput name={field.name} value={field.value} onChange={field.onChange} />}
        />
      </FieldGroup>

      <FormField label={t.comment} required hint={t.commentHint} error={errors.comment?.message}>
        <Textarea {...register("comment")} />
      </FormField>

      <FormField label={t.reference} required hint={t.referenceHint} error={errors.bookingReference?.message}>
        <Input {...register("bookingReference")} autoCapitalize="characters" autoComplete="off" />
      </FormField>

      <p className="text-sm text-muted">{t.privacyNote}</p>

      <Button type="submit" size="lg" loading={isSubmitting} className="self-start">
        {isSubmitting ? t.sending : t.submit}
      </Button>
    </form>
  );
}
