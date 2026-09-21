"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ContactOwner } from "@/api/contact-details";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmModal,
  FormField,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import { content } from "@/content";
import { CONTACT_TYPES } from "@/lib/constants";
import type { ContactDetail } from "@/types";
import { useContactDetailMutations } from "../hooks/use-contact-detail-mutations";
import { contactDetailSchema, type ContactDetailFormValues } from "../schemas";

const t = content.admin.contacts;

interface ContactDetailsCardProps {
  owner: ContactOwner;
  ownerId: string;
  contacts: ContactDetail[];
  /** Whether the signed-in role may add, edit and delete. */
  canEdit: boolean;
}

/** The extra phone numbers and emails of a customer or lead: list, add, edit, delete. */
export function ContactDetailsCard({ owner, ownerId, contacts, canEdit }: ContactDetailsCardProps) {
  const mutations = useContactDetailMutations(owner, ownerId);
  const [editing, setEditing] = useState<ContactDetail | "new" | null>(null);
  const [deleting, setDeleting] = useState<ContactDetail | null>(null);

  return (
    <Card as="section" aria-labelledby={`contacts-heading-${ownerId}`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle as="h2" id={`contacts-heading-${ownerId}`} className="text-xl">
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
              {t.add}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-muted">{t.empty}</p>
        ) : (
          <ul className="flex flex-col">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-b-0"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge variant="outline">{t.types[contact.type]}</Badge>
                  {contact.label && <span className="text-sm text-muted">{contact.label}</span>}
                  <a
                    href={contact.type === "email" ? `mailto:${contact.value}` : `tel:${contact.value.replace(/[\s()-]/g, "")}`}
                    className="min-w-0 font-medium wrap-anywhere"
                  >
                    {contact.value}
                  </a>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(contact)}>
                      {content.admin.common.edit}
                      <span className="sr-only"> {contact.value}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(contact)}>
                      {content.admin.common.delete}
                      <span className="sr-only"> {contact.value}</span>
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "new" ? t.addTitle : t.editTitle}
        size="sm"
      >
        {editing !== null && (
          <ContactDetailForm
            contact={editing === "new" ? undefined : editing}
            mutations={mutations}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t.deleteTitle}
        description={deleting?.value ?? ""}
        confirmLabel={content.admin.common.confirmDelete}
        cancelLabel={content.admin.common.cancel}
        loading={mutations.remove.isPending}
        onConfirm={() => deleting && mutations.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </Card>
  );
}

function ContactDetailForm({
  contact,
  mutations,
  onClose,
}: {
  contact?: ContactDetail;
  mutations: ReturnType<typeof useContactDetailMutations>;
  onClose: () => void;
}) {
  const form = useForm<ContactDetailFormValues>({
    resolver: zodResolver(contactDetailSchema),
    defaultValues: { type: contact?.type ?? "phone", label: contact?.label ?? "", value: contact?.value ?? "" },
  });
  const { register, formState } = form;
  const { errors } = formState;
  const mutation = contact ? mutations.update : mutations.add;

  const onSubmit = form.handleSubmit((values) => {
    if (contact) mutations.update.mutate({ detailId: contact.id, input: values }, { onSuccess: onClose });
    else mutations.add.mutate(values, { onSuccess: onClose });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mutation.isError && <Alert variant="danger">{content.admin.common.saveError}</Alert>}
      <FormField label={t.type}>
        <Select {...register("type")}>
          {CONTACT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t.types[type]}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label={t.label}>
        <Input {...register("label")} placeholder={t.labelPlaceholder} autoComplete="off" />
      </FormField>
      <FormField label={t.value} required error={errors.value?.message}>
        <Input {...register("value")} autoComplete="off" />
      </FormField>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          {content.admin.common.cancel}
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {mutation.isPending ? content.admin.common.saving : content.admin.common.save}
        </Button>
      </div>
    </form>
  );
}
