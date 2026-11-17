"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Eye, EyeOff, FolderTree, Pencil, Trash2, Plus, X } from "lucide-react";
import {
  getAdminCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  type CategoryInput,
} from "@/lib/api/categories";
import type { Category } from "@/types/category";
import { errorMessage } from "@/lib/api/error-message";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { CheckboxField, Field, inputClass } from "@/components/admin/ui/field";
import { T } from "@/i18n/language-provider";
import { cn } from "@/lib/utils";

function CategoryFormFields({
  value,
  onChange,
  parentOptions,
  idPrefix,
}: {
  value: CategoryInput;
  onChange: (v: CategoryInput) => void;
  parentOptions: Category[];
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor={`${idPrefix}-name`}>
        <input
          id={`${idPrefix}-name`}
          required
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Inside" htmlFor={`${idPrefix}-parent`}>
        <select
          id={`${idPrefix}-parent`}
          value={value.parent ?? ""}
          onChange={(e) => onChange({ ...value, parent: e.target.value || null })}
          className={inputClass}
        >
          <option value="">— Top level —</option>
          {parentOptions.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Image URL" htmlFor={`${idPrefix}-image`} className="sm:col-span-2">
        <input
          id={`${idPrefix}-image`}
          value={value.image ?? ""}
          onChange={(e) => onChange({ ...value, image: e.target.value || null })}
          className={inputClass}
        />
      </Field>
      <Field label="Description" htmlFor={`${idPrefix}-description`} className="sm:col-span-2">
        <input
          id={`${idPrefix}-description`}
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value || null })}
          className={inputClass}
        />
      </Field>
      <CheckboxField
        className="sm:col-span-2"
        checked={value.isFeaturedOnHome ?? false}
        onChange={(checked) => onChange({ ...value, isFeaturedOnHome: checked })}
        label="Featured on the home page"
      />
    </div>
  );
}

function emptyInput(): CategoryInput {
  return { name: "", parent: null, image: null, description: null, isFeaturedOnHome: false };
}

const iconButton =
  "grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: tree, isLoading } = useQuery({
    queryKey: ["admin", "categories", "tree"],
    queryFn: getAdminCategoryTree,
  });

  const [creating, setCreating] = useState(false);
  const [createValue, setCreateValue] = useState<CategoryInput>(emptyInput());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<CategoryInput>(emptyInput());
  const [deleting, setDeleting] = useState<Category | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "categories", "tree"] });

  const createMutation = useMutation({
    mutationFn: () => createCategory(createValue),
    onSuccess: () => {
      toast.success("Section created");
      setCreating(false);
      setCreateValue(emptyInput());
      invalidate();
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not create section")),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) => updateCategory(id, editValue),
    onSuccess: () => {
      toast.success("Section updated");
      setEditingId(null);
      invalidate();
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not update section")),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (cat: Category) => updateCategory(cat._id, { isActive: !cat.isActive }),
    onSuccess: invalidate,
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not update section")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Section deleted");
      setDeleting(null);
      invalidate();
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not delete section")),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; displayOrder: number }[]) => reorderCategories(items),
    onSuccess: invalidate,
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not reorder")),
  });

  function move(siblings: Category[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate(reordered.map((c, i) => ({ id: c._id, displayOrder: i })));
  }

  function startEdit(cat: Category) {
    setEditingId(cat._id);
    setEditValue({
      name: cat.name,
      parent: cat.parent,
      image: cat.image,
      description: cat.description,
      isFeaturedOnHome: cat.isFeaturedOnHome,
    });
  }

  const topLevel = tree ?? [];

  function renderRow(cat: Category, siblings: Category[], index: number, nested: boolean) {
    const editing = editingId === cat._id;
    return (
      <li key={cat._id}>
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-5",
            nested && "ps-8 sm:ps-10",
            !cat.isActive && "opacity-60",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className={cn("text-base", nested ? "font-semibold" : "font-bold")}>
              <T>{cat.name}</T>
            </p>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              {!cat.isActive && <StatusPill>Hidden</StatusPill>}
              {cat.isFeaturedOnHome && <StatusPill tone="success">On home page</StatusPill>}
            </div>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => move(siblings, index, -1)}
              disabled={index === 0 || reorderMutation.isPending}
              className={iconButton}
              aria-label="Move up"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => move(siblings, index, 1)}
              disabled={index === siblings.length - 1 || reorderMutation.isPending}
              className={iconButton}
              aria-label="Move down"
            >
              <ArrowDown className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => (editing ? setEditingId(null) : startEdit(cat))}
              className={iconButton}
              aria-label="Edit"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => toggleActiveMutation.mutate(cat)}
              className={iconButton}
              aria-label={cat.isActive ? "Hide from the menu" : "Show on the menu"}
              title={cat.isActive ? "Hide from the menu" : "Show on the menu"}
            >
              {cat.isActive ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => setDeleting(cat)}
              className={cn(iconButton, "hover:bg-danger-soft hover:text-danger-strong")}
              aria-label="Delete"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(cat._id);
            }}
            className={cn("border-t border-border bg-muted/30 p-4 sm:p-5", nested && "ps-8 sm:ps-10")}
          >
            <CategoryFormFields
              idPrefix={`edit-${cat._id}`}
              value={editValue}
              onChange={setEditValue}
              parentOptions={topLevel.filter((c) => c._id !== cat._id)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" disabled={updateMutation.isPending} className="action-primary min-h-11 rounded-xl px-6">
                Save
              </button>
              <button type="button" onClick={() => setEditingId(null)} className="action-secondary min-h-11 rounded-xl px-6">
                Cancel
              </button>
            </div>
          </form>
        )}

        {!nested && (cat.children ?? []).length > 0 && (
          <ul className="divide-y divide-border border-t border-border">
            {(cat.children ?? []).map((child, childIndex) =>
              renderRow(child, cat.children ?? [], childIndex, true),
            )}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Menu sections" description="The headings dishes are grouped under on the menu.">
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className={creating ? "action-secondary min-h-11 rounded-xl px-4" : "action-primary min-h-11 rounded-xl px-4"}
        >
          {creating ? <X className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {creating ? "Cancel" : "New section"}
        </button>
      </AdminPageHeader>

      {creating && (
        <Panel title="New section" className="max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <CategoryFormFields idPrefix="new" value={createValue} onChange={setCreateValue} parentOptions={topLevel} />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="action-primary mt-4 min-h-12 rounded-xl px-8"
            >
              {createMutation.isPending ? "Creating…" : "Create section"}
            </button>
          </form>
        </Panel>
      )}

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : topLevel.length === 0 ? (
        <EmptyState icon={<FolderTree aria-hidden />} title="No sections yet." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {topLevel.map((parent, parentIndex) => renderRow(parent, topLevel, parentIndex, false))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this section?"
        confirmLabel="Delete section"
        tone="danger"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      >
        This only works if the section has no dishes or sections inside it. It cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
