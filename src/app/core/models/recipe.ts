export interface Recipe {
  id: string;
  title: string;
  steps: string[];
  durationMin?: number;
  defaultPortions: number;
  tags?: string[];
  notes?: string;
  defaultVariantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeInput {
  title: string;
  steps: string[];
  durationMin?: number;
  defaultPortions: number;
  tags?: string[];
  notes?: string;
}

export interface UpdateRecipeInput {
  title: string;
  steps: string[];
  durationMin?: number;
  defaultPortions: number;
  tags?: string[];
  notes?: string;
}

export function createRecipe(input: CreateRecipeInput, defaultVariantId: string): Recipe {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    steps: input.steps.map((step) => step.trim()).filter(Boolean),
    durationMin: input.durationMin,
    defaultPortions: input.defaultPortions,
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
    notes: input.notes?.trim() || undefined,
    defaultVariantId,
    createdAt: now,
    updatedAt: now,
  };
}
