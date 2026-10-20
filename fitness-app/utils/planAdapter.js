const FIELD_MAP = {
  plan: {
    id: "id",
    name: "name",
    type: "type",
    description: "description",
    daysPerWeek: "daysPerWeek",
    difficulty: "difficulty",
    targetAudience: "targetAudience",
    tags: "tags",
    planType: "planType",
    source: "source",
  },
  day: {
    dayNumber: "dayNumber",
    dayName: "dayName",
    focus: "focus",
  },
  exercise: {
    id: "exerciseId",
    name: "exerciseName",
    sets: "sets",
    reps: "reps",
    restSeconds: "restSeconds",
    notes: "notes",
    sortOrder: "sortOrder",
  },
};

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return raw.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

function mapExercise(apiEx) {
  const m = FIELD_MAP.exercise;
  return {
    id: apiEx[m.id] ?? null,
    name: apiEx[m.name] ?? "",
    sets: apiEx[m.sets] ?? 0,
    reps: apiEx[m.reps] ?? "",
    restSeconds: apiEx[m.restSeconds] ?? 60,
    notes: apiEx[m.notes] ?? "",
    sortOrder: apiEx[m.sortOrder] ?? 0,
  };
}

function mapDay(apiDay) {
  const m = FIELD_MAP.day;
  return {
    day: apiDay[m.dayNumber] ?? 1,
    name: apiDay[m.dayName] ?? "",
    focus: apiDay[m.focus] ?? "",
    exercises: (apiDay.exercises || []).map(mapExercise),
  };
}

export function adaptPlanDetail(apiPlan, apiDays) {
  const m = FIELD_MAP.plan;
  const plan = apiPlan || {};
  const days = (apiDays || []).map(mapDay);

  return {
    id: plan[m.id],
    name: plan[m.name] ?? "",
    type: plan[m.type] ?? "custom",
    description: plan[m.description] ?? "",
    daysPerWeek: plan[m.daysPerWeek] ?? days.length,
    difficulty: plan[m.difficulty] || "intermediate",
    targetAudience: plan[m.targetAudience] ?? "",
    tags: parseTags(plan[m.tags]),
    planType: plan[m.planType] ?? 0,
    source: plan[m.source] ?? "user",
    schedule: days,
  };
}

export function adaptPlanListItem(apiItem) {
  const m = FIELD_MAP.plan;
  return {
    id: apiItem[m.id],
    name: apiItem[m.name] ?? "",
    type: apiItem[m.type] ?? "custom",
    description: apiItem[m.description] ?? "",
    daysPerWeek: apiItem[m.daysPerWeek] ?? 0,
    difficulty: apiItem[m.difficulty] ?? "",
    targetAudience: apiItem[m.targetAudience] ?? "",
    tags: parseTags(apiItem[m.tags]),
    planType: apiItem[m.planType] ?? 0,
    source: apiItem[m.source] ?? "user",
  };
}

export function adaptExerciseForApi(localEx) {
  const m = FIELD_MAP.exercise;
  return {
    [m.id]: localEx.id || null,
    [m.name]: localEx.name,
    [m.sets]: localEx.sets,
    [m.reps]: localEx.reps,
    [m.restSeconds]: localEx.restSeconds,
    [m.notes]: localEx.notes || "",
    [m.sortOrder]: localEx.sortOrder || 0,
  };
}

export function adaptDayForApi(localDay) {
  const m = FIELD_MAP.day;
  return {
    [m.dayNumber]: localDay.day ?? localDay.dayNumber,
    [m.dayName]: localDay.name ?? localDay.dayName,
    [m.focus]: localDay.focus ?? "",
    exercises: (localDay.exercises || []).map((ex, i) => ({
      ...adaptExerciseForApi(ex),
      [FIELD_MAP.exercise.sortOrder]: i + 1,
    })),
  };
}

export function adaptPlanForApi(localPlan) {
  const m = FIELD_MAP.plan;
  return {
    [m.name]: localPlan.name,
    [m.type]: localPlan.type || "custom",
    [m.description]: localPlan.description || "",
    [m.daysPerWeek]: localPlan.daysPerWeek || 0,
    [m.difficulty]: localPlan.difficulty || "intermediate",
    [m.targetAudience]: localPlan.targetAudience || "",
    [m.tags]: Array.isArray(localPlan.tags) ? localPlan.tags.join(",") : localPlan.tags || "",
    [m.planType]: localPlan.planType ?? 0,
    days: (localPlan.schedule || localPlan.days || []).map((d, i) => ({
      ...adaptDayForApi(d),
      dayNumber: d.day ?? d.dayNumber ?? i + 1,
      sortOrder: i + 1,
    })),
  };
}

export { FIELD_MAP, parseTags };
