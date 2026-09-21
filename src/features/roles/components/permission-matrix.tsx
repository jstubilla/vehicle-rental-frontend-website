"use client";

import { Checkbox } from "@/components/ui";
import { content } from "@/content";
import type { Permission } from "@/lib/constants";
import { PERMISSION_GROUPS, PERMISSION_REQUIRES } from "@/lib/permissions";

const t = content.admin.permissions;

interface PermissionMatrixProps {
  value: Permission[];
  onChange: (value: Permission[]) => void;
  disabled?: boolean;
}

/**
 * The list of everything a role can be allowed to do, in groups. Turning on an
 * "edit" permission also turns on its "view"; turning off a "view" turns off its "edit".
 */
export function PermissionMatrix({ value, onChange, disabled }: PermissionMatrixProps) {
  function toggle(permission: Permission, on: boolean) {
    if (on) {
      const required = PERMISSION_REQUIRES[permission];
      onChange([...new Set([...value, permission, ...(required ? [required] : [])])]);
    } else {
      onChange(value.filter((p) => p !== permission && PERMISSION_REQUIRES[p] !== permission));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {PERMISSION_GROUPS.map((group) => (
        <fieldset key={group.id} className="flex flex-col gap-3 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold">{t.groups[group.id]}</legend>
          {group.permissions.map((permission) => (
            <Checkbox
              key={permission}
              label={t.items[permission].label}
              description={t.items[permission].description}
              checked={value.includes(permission)}
              disabled={disabled}
              onChange={(e) => toggle(permission, e.target.checked)}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}
