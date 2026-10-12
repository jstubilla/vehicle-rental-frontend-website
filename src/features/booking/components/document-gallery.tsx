import { useState } from "react";
import { Modal } from "@/components/ui";
import { content } from "@/content";
import { DOCUMENT_KINDS, type DocumentKind } from "@/lib/constants";
import type { BookingDocuments } from "@/types";

const kinds = content.booking.documents.kinds;

/** The three document photos side by side. Each opens larger in a dialog, for a closer look. */
export function DocumentGallery({ documents }: { documents: BookingDocuments }) {
  const [viewing, setViewing] = useState<DocumentKind | null>(null);

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-3">
        {DOCUMENT_KINDS.map((kind) => (
          <li key={kind}>
            <button
              type="button"
              onClick={() => setViewing(kind)}
              aria-label={content.booking.documents.view(kinds[kind].label)}
              className="group flex w-full flex-col gap-2 rounded-md text-left"
            >
              <span className="block aspect-4/3 w-full overflow-hidden rounded-md border border-border bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing to optimise */}
                <img
                  src={documents[kind].dataUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-(--duration-base) ease-out group-hover:scale-[1.03]"
                />
              </span>
              <span className="text-sm font-medium">{kinds[kind].label}</span>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewing(null)}
        title={viewing ? kinds[viewing].label : ""}
        size="lg"
      >
        {viewing && (
          // eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing to optimise
          <img
            src={documents[viewing].dataUrl}
            alt={kinds[viewing].label}
            className="max-h-[70vh] w-full rounded-md object-contain"
          />
        )}
      </Modal>
    </>
  );
}
