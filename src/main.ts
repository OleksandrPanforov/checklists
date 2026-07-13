type Item = {
  id: string;
  name: string;
  imageUrl: string | null;
  imageBlob: Blob | null;
  imageFileName: string | null;
};

type ItemDetails = {
  count: number;
  comment: string;
};

type ProgressFile = {
  version: 1;
  names: string[];
  checkedByName: Record<string, boolean>;
  countByName?: Record<string, number>;
  commentsByName?: Record<string, string>;
  exportedAt: string;
};

type PersistedItem = {
  id: string;
  name: string;
  imageBlob: Blob | null;
  imageFileName: string | null;
};

type PersistedSnapshot = {
  version: 1;
  namesText: string;
  items: PersistedItem[];
  checkedById: Record<string, boolean>;
  detailsById?: Record<string, ItemDetails>;
  searchQuery: string;
  missingOnly: boolean;
  savedAt: string;
};

type SyncPayload = {
  version: 1;
  savedAt: string;
  names: string[];
  checkedByNormalizedName: Record<string, boolean>;
  detailsByNormalizedName?: Record<string, ItemDetails>;
};

type SupabaseConfig = {
  url: string;
  anonKey: string;
  syncKey: string;
};

type SupabaseAuthResponse = {
  access_token: string;
  refresh_token: string;
  user?: {
    id: string;
    email?: string;
  };
};

type SupabaseUserResponse = {
  id: string;
  email?: string;
};

import { enTranslations } from "./i18n/en";
import { ukTranslations } from "./i18n/uk";

const namesInput = document.querySelector<HTMLTextAreaElement>("#namesInput")!;
const namesFile = document.querySelector<HTMLInputElement>("#namesFile")!;
const imagesInput = document.querySelector<HTMLInputElement>("#imagesInput")!;
const buildBtn = document.querySelector<HTMLButtonElement>("#buildBtn")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clearBtn")!;
const resetProgressBtn = document.querySelector<HTMLButtonElement>("#resetProgressBtn")!;
const deleteSavedBtn = document.querySelector<HTMLButtonElement>("#deleteSavedBtn")!;
const exportProgressBtn = document.querySelector<HTMLButtonElement>("#exportProgressBtn")!;
const importProgressInput = document.querySelector<HTMLInputElement>("#importProgressInput")!;
const indexedDbMode = document.querySelector<HTMLInputElement>("#indexedDbMode")!;
const supabaseConfigSection = document.querySelector<HTMLDivElement>("#supabaseConfigSection")!;
const supabaseAuthSection = document.querySelector<HTMLDivElement>("#supabaseAuthSection")!;
const supabaseConnectedSection = document.querySelector<HTMLDivElement>("#supabaseConnectedSection")!;
const supabaseUrlInput = document.querySelector<HTMLInputElement>("#supabaseUrlInput")!;
const supabaseAnonKeyInput = document.querySelector<HTMLInputElement>("#supabaseAnonKeyInput")!;
const supabaseSyncKeyInput = document.querySelector<HTMLInputElement>("#supabaseSyncKeyInput")!;
const supabaseEmailInput = document.querySelector<HTMLInputElement>("#supabaseEmailInput")!;
const supabasePasswordInput = document.querySelector<HTMLInputElement>("#supabasePasswordInput")!;
const signUpSupabaseBtn = document.querySelector<HTMLButtonElement>("#signUpSupabaseBtn")!;
const signInSupabaseBtn = document.querySelector<HTMLButtonElement>("#signInSupabaseBtn")!;
const signOutSupabaseBtn = document.querySelector<HTMLButtonElement>("#signOutSupabaseBtn")!;
const connectSupabaseBtn = document.querySelector<HTMLButtonElement>("#connectSupabaseBtn")!;
const pushSupabaseBtn = document.querySelector<HTMLButtonElement>("#pushSupabaseBtn")!;
const pullSupabaseBtn = document.querySelector<HTMLButtonElement>("#pullSupabaseBtn")!;
const disconnectSupabaseBtn = document.querySelector<HTMLButtonElement>("#disconnectSupabaseBtn")!;
const supabaseAuthStatusText = document.querySelector<HTMLDivElement>("#supabaseAuthStatusText")!;
const supabaseStatusText = document.querySelector<HTMLDivElement>("#supabaseStatusText")!;
const searchInput = document.querySelector<HTMLInputElement>("#searchInput")!;
const missingOnly = document.querySelector<HTMLInputElement>("#missingOnly")!;
const statusText = document.querySelector<HTMLDivElement>("#statusText")!;
const grid = document.querySelector<HTMLDivElement>("#grid")!;
const languageSelector = document.querySelector<HTMLSelectElement>("#languageSelector")!;

// Translations
type Language = "en" | "uk";

interface Translations {
  [key: string]: string;
}

interface TranslationDict {
  en: Translations;
  uk: Translations;
}

const translations: TranslationDict = {
  en: enTranslations,
  uk: ukTranslations
};

let currentLanguage: Language = "en";

function getTranslation(key: string): string {
  return translations[currentLanguage][key] ?? key;
}

function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem("collection-checklist:language", lang);
  applyTranslations();
}

function loadLanguagePreference(): Language {
  const saved = localStorage.getItem("collection-checklist:language");
  return (saved === "uk" || saved === "en") ? saved : "en";
}

function applyTranslations(): void {
  // Update header
  document.querySelector("h1")!.textContent = getTranslation("Collection Checklist");
  document.querySelector(".hero p")!.textContent = getTranslation(
    "Offline tracker for your local collection images and names."
  );

  // Update labels
  const labels = document.querySelectorAll("label");
  labels.forEach((label) => {
    const text = label.textContent?.trim();
    if (text) {
      label.textContent = getTranslation(text);
    }
  });

  // Update button texts
  const buttons = document.querySelectorAll("button, .button");
  buttons.forEach((btn) => {
    const text = btn.textContent?.trim();
    if (text) {
      btn.textContent = getTranslation(text);
    }
  });

  // Update headings
  const headings = document.querySelectorAll("h2");
  headings.forEach((heading) => {
    const text = heading.textContent?.trim();
    if (text) {
      heading.textContent = getTranslation(text);
    }
  });

  // Update paragraphs and hints
  const paragraphs = document.querySelectorAll(".hint, .block-heading > p, .action-group-title");
  paragraphs.forEach((para) => {
    const text = para.textContent?.trim();
    if (text && !text.includes("/")) {
      para.textContent = getTranslation(text);
    }
  });

  // Update placeholders and titles
  const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
  inputs.forEach((input) => {
    const placeholder = input.getAttribute("placeholder");
    if (placeholder) {
      input.setAttribute("placeholder", getTranslation(placeholder));
    }
  });

  // Update div action titles
  const actionTitles = document.querySelectorAll(".action-group-title");
  actionTitles.forEach((title) => {
    const text = title.textContent?.trim();
    if (text) {
      title.textContent = getTranslation(text);
    }
  });

  // Update language selector label
  languageSelector.value = currentLanguage;
}

let items: Item[] = [];
let checkedById: Record<string, boolean> = {};
let detailsById: Record<string, ItemDetails> = {};
let storageKey = "";
let detailsStorageKey = "";
let activeImageUrls: string[] = [];
let persistTimer: number | null = null;
let supabaseConnected = false;
let supabaseAccessToken = "";
let supabaseRefreshToken = "";
let supabaseUserId = "";
let supabaseUserEmail = "";

const STORAGE_PREFIX = "collection-checklist:v1:";
const DB_NAME = "collection-checklist-db";
const DB_VERSION = 1;
const DB_STORE = "snapshots";
const DB_LATEST_KEY = "latest";
const PERSIST_DEBOUNCE_MS = 220;
const SUPABASE_TABLE = "checklist_sync";
const SUPABASE_URL_KEY = "collection-checklist:supabase-url";
const SUPABASE_ANON_KEY = "collection-checklist:supabase-anon-key";
const SUPABASE_SYNC_KEY = "collection-checklist:supabase-sync-key";
const SUPABASE_EMAIL_KEY = "collection-checklist:supabase-email";

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashText(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function parseNames(raw: string): string[] {
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed = rows
    .map((line) => {
      if (!line.includes(",")) {
        return line;
      }
      const firstCell = line.split(",")[0] ?? "";
      return firstCell.replace(/^"|"$/g, "").trim();
    })
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const name of parsed) {
    const key = normalizeText(name);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(name);
  }

  return unique;
}

function revokeImageUrls(): void {
  for (const url of activeImageUrls) {
    URL.revokeObjectURL(url);
  }
  activeImageUrls = [];
}

function readCheckedFromStorage(key: string): Record<string, boolean> {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed;
  } catch {
    return {};
  }
}

function clampCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function defaultItemDetails(): ItemDetails {
  return {
    count: 0,
    comment: ""
  };
}

function sanitizeItemDetails(value: unknown): ItemDetails {
  if (!value || typeof value !== "object") {
    return defaultItemDetails();
  }

  const data = value as Partial<ItemDetails>;
  const count = clampCount(Number(data.count ?? 0));
  const comment = typeof data.comment === "string" ? data.comment : "";
  return { count, comment };
}

function readDetailsFromStorage(key: string): Record<string, ItemDetails> {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalized: Record<string, ItemDetails> = {};
    for (const [id, details] of Object.entries(parsed)) {
      normalized[id] = sanitizeItemDetails(details);
    }
    return normalized;
  } catch {
    return {};
  }
}

function writeCheckedToStorage(): void {
  if (!storageKey) {
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(checkedById));
}

function writeDetailsToStorage(): void {
  if (!detailsStorageKey) {
    return;
  }
  localStorage.setItem(detailsStorageKey, JSON.stringify(detailsById));
}

function setSupabaseStatus(message: string): void {
  supabaseStatusText.textContent = message;
}

function setSupabaseAuthStatus(message: string): void {
  supabaseAuthStatusText.textContent = message;
}

function updateSupabaseUi(): void {
  const isAuthenticated = Boolean(supabaseAccessToken && supabaseUserId);
  const isConnected = supabaseConnected;

  supabaseConfigSection.classList.toggle("hidden-section", isConnected);
  supabaseAuthSection.classList.toggle("hidden-section", isAuthenticated);
  supabaseConnectedSection.classList.toggle("hidden-section", !isAuthenticated);

  connectSupabaseBtn.classList.toggle("hidden-section", isConnected);
  pushSupabaseBtn.classList.toggle("hidden-section", !isConnected);
  pullSupabaseBtn.classList.toggle("hidden-section", !isConnected);
  disconnectSupabaseBtn.classList.toggle("hidden-section", !isConnected);
  signOutSupabaseBtn.classList.toggle("hidden-section", !isAuthenticated);
}

function setAuthenticatedUser(userId: string, email = ""): void {
  supabaseUserId = userId;
  supabaseUserEmail = email;
  setSupabaseAuthStatus(email ? `Supabase auth: signed in as ${email}.` : "Supabase auth: signed in.");
  updateSupabaseUi();
}

function clearAuthenticatedUser(): void {
  supabaseAccessToken = "";
  supabaseRefreshToken = "";
  supabaseUserId = "";
  supabaseUserEmail = "";
  setSupabaseAuthStatus("Supabase auth: signed out.");
  updateSupabaseUi();
}

function loadStoredSupabaseConfig(): SupabaseConfig {
  return {
    url: localStorage.getItem(SUPABASE_URL_KEY) ?? "",
    anonKey: localStorage.getItem(SUPABASE_ANON_KEY) ?? "",
    syncKey: localStorage.getItem(SUPABASE_SYNC_KEY) ?? ""
  };
}

function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_URL_KEY, config.url);
  localStorage.setItem(SUPABASE_ANON_KEY, config.anonKey);
  localStorage.setItem(SUPABASE_SYNC_KEY, config.syncKey);
}

function loadStoredSupabaseEmail(): string {
  return localStorage.getItem(SUPABASE_EMAIL_KEY) ?? "";
}

function saveSupabaseEmail(email: string): void {
  if (!email) {
    localStorage.removeItem(SUPABASE_EMAIL_KEY);
    return;
  }
  localStorage.setItem(SUPABASE_EMAIL_KEY, email);
}

function getSupabaseConfig(): SupabaseConfig {
  const config: SupabaseConfig = {
    url: supabaseUrlInput.value.trim().replace(/\/+$/, ""),
    anonKey: supabaseAnonKeyInput.value.trim(),
    syncKey: supabaseSyncKeyInput.value.trim()
  };

  if (!config.url || !config.anonKey || !config.syncKey) {
    throw new Error("Provide Supabase URL, anon key, and sync key.");
  }

  return config;
}

function supabaseAnonHeaders(config: SupabaseConfig): Headers {
  return new Headers({
    apikey: config.anonKey,
    "Content-Type": "application/json"
  });
}

function ensureSupabaseAuthToken(): string {
  if (!supabaseAccessToken || !supabaseUserId) {
    throw new Error("Sign in to Supabase first.");
  }
  return supabaseAccessToken;
}

function supabaseHeaders(config: SupabaseConfig): Headers {
  const token = ensureSupabaseAuthToken();
  return new Headers({
    apikey: config.anonKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  });
}

function getSupabaseAuthCredentials(): { email: string; password: string } {
  const email = supabaseEmailInput.value.trim();
  const password = supabasePasswordInput.value;
  if (!email || !password) {
    throw new Error("Provide Supabase email and password.");
  }
  return { email, password };
}

async function fetchSupabaseUser(config: SupabaseConfig, accessToken: string): Promise<SupabaseUserResponse> {
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: new Headers({
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`
    })
  });

  if (!response.ok) {
    throw new Error(`Supabase user fetch failed (${response.status}).`);
  }

  return (await response.json()) as SupabaseUserResponse;
}

async function buildSupabaseError(response: Response, fallback: string): Promise<Error> {
  let detail = "";

  try {
    detail = await response.text();
  } catch {
    detail = "";
  }

  return new Error(`${fallback} (${response.status}).${detail ? ` ${detail}` : ""}`);
}

async function signInSupabaseWithPassword(config: SupabaseConfig): Promise<void> {
  const credentials = getSupabaseAuthCredentials();
  saveSupabaseEmail(credentials.email);

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: supabaseAnonHeaders(config),
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw await buildSupabaseError(response, "Supabase sign-in failed");
  }

  const auth = (await response.json()) as SupabaseAuthResponse;
  const user = auth.user ?? (await fetchSupabaseUser(config, auth.access_token));
  supabaseAccessToken = auth.access_token;
  supabaseRefreshToken = auth.refresh_token;
  setAuthenticatedUser(user.id, user.email ?? credentials.email);
}

async function signUpSupabaseWithPassword(config: SupabaseConfig): Promise<void> {
  const credentials = getSupabaseAuthCredentials();
  saveSupabaseEmail(credentials.email);

  const response = await fetch(`${config.url}/auth/v1/signup`, {
    method: "POST",
    headers: supabaseAnonHeaders(config),
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw await buildSupabaseError(response, "Supabase sign-up failed");
  }

  setSupabaseAuthStatus(
    "Supabase sign-up request accepted. If email confirmation is enabled, confirm email then sign in."
  );
}

async function pushToSupabase(config: SupabaseConfig, payload: SyncPayload): Promise<void> {
  const userId = supabaseUserId;
  if (!userId) {
    throw new Error("Sign in to Supabase first.");
  }

  const url = `${config.url}/rest/v1/${SUPABASE_TABLE}?on_conflict=owner_id,sync_key`;
  const body = JSON.stringify([
    {
      owner_id: userId,
      sync_key: config.syncKey,
      payload,
      updated_at: new Date().toISOString()
    }
  ]);

  const headers = supabaseHeaders(config);
  headers.set("Prefer", "resolution=merge-duplicates,return=minimal");

  const response = await fetch(url, {
    method: "POST",
    headers,
    body
  });

  if (!response.ok) {
    throw await buildSupabaseError(response, "Supabase push failed");
  }
}

async function pullFromSupabase(config: SupabaseConfig): Promise<SyncPayload | null> {
  const userId = supabaseUserId;
  if (!userId) {
    throw new Error("Sign in to Supabase first.");
  }

  const encodedSyncKey = encodeURIComponent(config.syncKey);
  const encodedUserId = encodeURIComponent(userId);
  const url = `${config.url}/rest/v1/${SUPABASE_TABLE}?owner_id=eq.${encodedUserId}&sync_key=eq.${encodedSyncKey}&select=payload&limit=1`;
  const response = await fetch(url, {
    headers: supabaseHeaders(config)
  });

  if (!response.ok) {
    throw await buildSupabaseError(response, "Supabase pull failed");
  }

  const rows = (await response.json()) as Array<{ payload: SyncPayload }>;
  return rows[0]?.payload ?? null;
}

async function validateSupabaseSyncTable(config: SupabaseConfig): Promise<void> {
  const userId = supabaseUserId;
  if (!userId) {
    throw new Error("Sign in to Supabase first.");
  }

  const encodedSyncKey = encodeURIComponent(config.syncKey);
  const encodedUserId = encodeURIComponent(userId);
  const url = `${config.url}/rest/v1/${SUPABASE_TABLE}?owner_id=eq.${encodedUserId}&sync_key=eq.${encodedSyncKey}&select=owner_id,sync_key&limit=1`;
  const response = await fetch(url, {
    headers: supabaseHeaders(config)
  });

  if (!response.ok) {
    throw await buildSupabaseError(
      response,
      "Supabase table validation failed. Check the safer schema and RLS setup from README"
    );
  }
}

function buildSyncPayload(): SyncPayload {
  const checkedByNormalizedName: Record<string, boolean> = {};
  const detailsByNormalizedName: Record<string, ItemDetails> = {};
  for (const item of items) {
    const normalizedName = normalizeText(item.name);
    checkedByNormalizedName[normalizedName] = Boolean(checkedById[item.id]);
    detailsByNormalizedName[normalizedName] = sanitizeItemDetails(detailsById[item.id]);
  }

  return {
    version: 1,
    savedAt: new Date().toISOString(),
    names: items.map((item) => item.name),
    checkedByNormalizedName,
    detailsByNormalizedName
  };
}

function normalizedNamesOfCurrentItems(): string[] {
  return items.map((item) => normalizeText(item.name));
}

function normalizedNamesOfPayload(payload: SyncPayload): string[] {
  return payload.names.map((name) => normalizeText(name));
}

function areNameListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function supportsIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB."));
    };
  });
}

async function runDbRequest<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, mode);
    const store = tx.objectStore(DB_STORE);
    const request = action(store);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    };

    tx.oncomplete = () => {
      db.close();
    };

    tx.onerror = () => {
      reject(tx.error ?? new Error("IndexedDB transaction failed."));
      db.close();
    };
  });
}

async function readLatestSnapshot(): Promise<PersistedSnapshot | null> {
  if (!supportsIndexedDb()) {
    return null;
  }

  const result = await runDbRequest("readonly", (store) =>
    store.get(DB_LATEST_KEY) as IDBRequest<PersistedSnapshot | undefined>
  );
  return result ?? null;
}

async function writeLatestSnapshot(snapshot: PersistedSnapshot): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  await runDbRequest("readwrite", (store) => store.put(snapshot, DB_LATEST_KEY));
}

async function deleteLatestSnapshot(): Promise<void> {
  if (!supportsIndexedDb()) {
    return;
  }

  await runDbRequest("readwrite", (store) => store.delete(DB_LATEST_KEY));
}

function currentSnapshot(): PersistedSnapshot {
  return {
    version: 1,
    namesText: items.map((item) => item.name).join("\n"),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      imageBlob: item.imageBlob,
      imageFileName: item.imageFileName
    })),
    checkedById: { ...checkedById },
    detailsById: { ...detailsById },
    searchQuery: searchInput.value,
    missingOnly: missingOnly.checked,
    savedAt: new Date().toISOString()
  };
}

async function persistCurrentState(): Promise<void> {
  writeCheckedToStorage();
  writeDetailsToStorage();

  if (!indexedDbMode.checked || !items.length) {
    return;
  }

  try {
    await writeLatestSnapshot(currentSnapshot());
  } catch {
    renderStatus("IndexedDB save failed; keeping local state only.");
  }
}

function cancelScheduledPersist(): void {
  if (persistTimer !== null) {
    window.clearTimeout(persistTimer);
    persistTimer = null;
  }
}

function schedulePersist(): void {
  cancelScheduledPersist();
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    void persistCurrentState();
  }, PERSIST_DEBOUNCE_MS);
}

async function restoreFromSnapshot(snapshot: PersistedSnapshot): Promise<void> {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Saved snapshot is invalid.");
  }

  const snapshotItems = Array.isArray(snapshot.items) ? snapshot.items : [];
  if (snapshotItems.length === 0) {
    throw new Error("Saved snapshot has no items.");
  }

  revokeImageUrls();

  items = snapshotItems.map((item, index) => {
    const safeName = typeof item.name === "string" && item.name.trim() ? item.name : `Item ${index + 1}`;
    const safeId = typeof item.id === "string" && item.id.trim() ? item.id : `${index}-${normalizeText(safeName)}`;
    const safeBlob = item.imageBlob instanceof Blob ? item.imageBlob : null;
    const safeFileName = typeof item.imageFileName === "string" ? item.imageFileName : null;
    const imageUrl = safeBlob ? URL.createObjectURL(safeBlob) : null;
    if (imageUrl) {
      activeImageUrls.push(imageUrl);
    }
    return {
      id: safeId,
      name: safeName,
      imageUrl,
      imageBlob: safeBlob,
      imageFileName: safeFileName
    };
  });

  checkedById = snapshot.checkedById && typeof snapshot.checkedById === "object" ? { ...snapshot.checkedById } : {};
  detailsById =
    snapshot.detailsById && typeof snapshot.detailsById === "object" ? { ...snapshot.detailsById } : {};
  for (const item of items) {
    if (typeof checkedById[item.id] !== "boolean") {
      checkedById[item.id] = false;
    }
    detailsById[item.id] = sanitizeItemDetails(detailsById[item.id]);
  }

  const names = items.map((item) => item.name);
  storageKey = `${STORAGE_PREFIX}${hashText(names.map((name) => normalizeText(name)).join("|"))}`;
  detailsStorageKey = `${storageKey}:details`;

  namesInput.value = typeof snapshot.namesText === "string" ? snapshot.namesText : items.map((item) => item.name).join("\n");
  searchInput.value = typeof snapshot.searchQuery === "string" ? snapshot.searchQuery : "";
  missingOnly.checked = Boolean(snapshot.missingOnly);
  renderStatus("Restored saved checklist from IndexedDB.");
  render();
}

function render(): void {
  const query = normalizeText(searchInput.value);
  const showMissingOnly = missingOnly.checked;

  grid.innerHTML = "";

  const visibleItems = items.filter((item) => {
    const checked = Boolean(checkedById[item.id]);
    const matchesQuery = !query || normalizeText(item.name).includes(query);
    const matchesMissing = !showMissingOnly || !checked;
    return matchesQuery && matchesMissing;
  });

  for (const item of visibleItems) {
    const card = document.createElement("article");
    card.className = `card${checkedById[item.id] ? " checked" : ""}`;

    if (item.imageUrl) {
      const img = document.createElement("img");
      img.src = item.imageUrl;
      img.alt = item.name;
      card.append(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      placeholder.textContent = getTranslation("No image");
      card.append(placeholder);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "name";
    title.textContent = item.name;

    const ownToggle = document.createElement("label");
    ownToggle.className = "own-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(checkedById[item.id]);
    checkbox.addEventListener("change", () => {
      checkedById[item.id] = checkbox.checked;
      renderStatus();
      if (missingOnly.checked) {
        render();
      } else {
        card.className = `card${checkbox.checked ? " checked" : ""}`;
      }
      schedulePersist();
    });

    const textNode = document.createElement("span");
    textNode.textContent = getTranslation("Owned");

    const details = sanitizeItemDetails(detailsById[item.id]);

    const countRow = document.createElement("label");
    countRow.className = "item-details-row";

    const countLabel = document.createElement("span");
    countLabel.textContent = getTranslation("Count");

    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.min = "0";
    countInput.step = "1";
    countInput.value = String(details.count);
    countInput.className = "item-count-input";
    countInput.addEventListener("change", () => {
      const nextCount = clampCount(Number(countInput.value));
      detailsById[item.id] = {
        ...sanitizeItemDetails(detailsById[item.id]),
        count: nextCount
      };
      countInput.value = String(nextCount);
      schedulePersist();
    });

    countRow.append(countLabel, countInput);

    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = getTranslation("Comment");
    commentInput.className = "item-comment-input";
    commentInput.value = details.comment;
    commentInput.addEventListener("change", () => {
      detailsById[item.id] = {
        ...sanitizeItemDetails(detailsById[item.id]),
        comment: commentInput.value
      };
      schedulePersist();
    });

    ownToggle.append(checkbox, textNode);
    body.append(title, ownToggle, countRow, commentInput);
    card.append(body);
    grid.append(card);
  }

  if (visibleItems.length === 0) {
    const empty = document.createElement("div");
    empty.className = "panel";
    empty.textContent = getTranslation("No items match the current filters.");
    grid.append(empty);
  }
}

function renderStatus(extraMessage = ""): void {
  if (!items.length) {
    statusText.textContent = getTranslation("No checklist loaded.");
    return;
  }

  const owned = items.filter((item) => checkedById[item.id]).length;
  const total = items.length;
  const missing = total - owned;
  const pct = Math.round((owned / total) * 100);

  statusText.textContent = `${owned}/${total} owned (${pct}%). ${getTranslation("Missing")}: ${missing}.${
    extraMessage ? ` ${extraMessage}` : ""
  }`;
}

async function buildChecklist(): Promise<void> {
  cancelScheduledPersist();

  const names = parseNames(namesInput.value);
  if (names.length === 0) {
    alert(getTranslation("Please provide at least one name."));
    return;
  }

  revokeImageUrls();

  const imageFiles = Array.from(imagesInput.files ?? []);
  const unmatchedImages = [...imageFiles];
  const imageByStem = new Map<string, File[]>();

  for (const file of imageFiles) {
    const stem = normalizeText(file.name);
    const bucket = imageByStem.get(stem) ?? [];
    bucket.push(file);
    imageByStem.set(stem, bucket);
  }

  items = names.map((name, index) => {
    const stem = normalizeText(name);
    const exact = imageByStem.get(stem);
    let chosen: File | undefined;

    if (exact && exact.length > 0) {
      chosen = exact.shift();
      const idx = unmatchedImages.indexOf(chosen as File);
      if (idx >= 0) {
        unmatchedImages.splice(idx, 1);
      }
    } else if (unmatchedImages.length > 0) {
      chosen = unmatchedImages.shift();
    }

    const imageUrl = chosen ? URL.createObjectURL(chosen) : null;
    if (imageUrl) {
      activeImageUrls.push(imageUrl);
    }

    return {
      id: `${index}-${normalizeText(name)}`,
      name,
      imageUrl,
      imageBlob: chosen ?? null,
      imageFileName: chosen?.name ?? null
    };
  });

  storageKey = `${STORAGE_PREFIX}${hashText(names.map((name) => normalizeText(name)).join("|"))}`;
  detailsStorageKey = `${storageKey}:details`;
  checkedById = readCheckedFromStorage(storageKey);
  detailsById = readDetailsFromStorage(detailsStorageKey);

  for (const item of items) {
    if (typeof checkedById[item.id] !== "boolean") {
      checkedById[item.id] = false;
    }
    detailsById[item.id] = sanitizeItemDetails(detailsById[item.id]);
  }

  await persistCurrentState();

  let message = "";
  if (imageFiles.length === 0) {
    message = getTranslation("Loaded without images.");
  } else {
    const withImage = items.filter((item) => item.imageUrl).length;
    message = `${withImage}/${items.length} items have images.`;
  }

  renderStatus(message);
  render();
}

async function applySyncPayload(payload: SyncPayload): Promise<void> {
  if (payload.version !== 1 || !Array.isArray(payload.names) || !payload.checkedByNormalizedName) {
    throw new Error(getTranslation("Unsupported sync payload format."));
  }

  const currentNames = normalizedNamesOfCurrentItems();
  const incomingNames = normalizedNamesOfPayload(payload);
  const sameDataset = areNameListsEqual(currentNames, incomingNames);

  if (!sameDataset) {
    if (items.length > 0) {
      const proceed = confirm(
        getTranslation(
          "Synced payload has a different item list. Replace current checklist with synced checklist?"
        )
      );
      if (!proceed) {
        return;
      }
    }

    namesInput.value = payload.names.join("\n");
    imagesInput.value = "";
    await buildChecklist();
  }

  let applied = 0;
  for (const item of items) {
    const key = normalizeText(item.name);
    const next = payload.checkedByNormalizedName[key];
    const nextDetails = payload.detailsByNormalizedName?.[key];
    if (typeof next === "boolean") {
      checkedById[item.id] = next;
      applied += 1;
    }
    if (nextDetails) {
      detailsById[item.id] = sanitizeItemDetails(nextDetails);
    }
  }

  await persistCurrentState();
  renderStatus(`${getTranslation("Pulled from Supabase. Applied")} ${applied}/${items.length} items.`);
  render();
}

function exportProgress(): void {
  if (!items.length) {
    alert(getTranslation("Build a checklist first."));
    return;
  }

  const payload: ProgressFile = {
    version: 1,
    names: items.map((item) => item.name),
    checkedByName: Object.fromEntries(
      items.map((item) => [normalizeText(item.name), Boolean(checkedById[item.id])])
    ),
    countByName: Object.fromEntries(
      items.map((item) => [normalizeText(item.name), sanitizeItemDetails(detailsById[item.id]).count])
    ),
    commentsByName: Object.fromEntries(
      items.map((item) => [normalizeText(item.name), sanitizeItemDetails(detailsById[item.id]).comment])
    ),
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "checklist-progress.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file: File): Promise<void> {
  cancelScheduledPersist();

  if (!items.length) {
    alert(getTranslation("Build a checklist first."));
    return;
  }

  const text = await file.text();
  let data: ProgressFile;

  try {
    data = JSON.parse(text) as ProgressFile;
  } catch {
    alert(getTranslation("Could not parse JSON file."));
    return;
  }

  if (data.version !== 1 || !Array.isArray(data.names) || !data.checkedByName) {
    alert(getTranslation("Unsupported progress format."));
    return;
  }

  const checkedByName = data.checkedByName;
  const countByName = data.countByName ?? {};
  const commentsByName = data.commentsByName ?? {};
  let applied = 0;

  for (const item of items) {
    const key = normalizeText(item.name);
    const next = checkedByName[key];
    const currentDetails = sanitizeItemDetails(detailsById[item.id]);
    const nextCount = clampCount(Number(countByName[key] ?? currentDetails.count));
    const nextComment = typeof commentsByName[key] === "string" ? commentsByName[key] : currentDetails.comment;

    detailsById[item.id] = {
      count: nextCount,
      comment: nextComment
    };

    if (typeof next === "boolean") {
      checkedById[item.id] = next;
      applied += 1;
    }
  }

  await persistCurrentState();
  renderStatus(`${getTranslation("Imported progress for")} ${applied}/${items.length} items.`);
  render();
}

async function loadNamesFromFile(file: File): Promise<void> {
  const text = await file.text();
  namesInput.value = text;
}

async function clearAll(): Promise<void> {
  cancelScheduledPersist();

  if (storageKey) {
    localStorage.removeItem(storageKey);
  }
  if (detailsStorageKey) {
    localStorage.removeItem(detailsStorageKey);
  }

  if (indexedDbMode.checked) {
    try {
      await deleteLatestSnapshot();
    } catch {
      // Ignore errors when deleting persisted data.
    }
  }

  namesInput.value = "";
  namesFile.value = "";
  imagesInput.value = "";
  searchInput.value = "";
  missingOnly.checked = false;
  revokeImageUrls();
  items = [];
  checkedById = {};
  detailsById = {};
  storageKey = "";
  detailsStorageKey = "";
  renderStatus();
  render();
}

async function resetProgress(): Promise<void> {
  cancelScheduledPersist();

  if (!items.length || !storageKey) {
    alert(getTranslation("Build a checklist first."));
    return;
  }

  for (const item of items) {
    checkedById[item.id] = false;
    detailsById[item.id] = defaultItemDetails();
  }

  await persistCurrentState();
  renderStatus(getTranslation("Progress reset."));
  render();
}

async function deleteSavedData(): Promise<void> {
  cancelScheduledPersist();

  try {
    await deleteLatestSnapshot();
    renderStatus(getTranslation("IndexedDB snapshot deleted."));
  } catch {
    renderStatus(getTranslation("Could not delete IndexedDB snapshot."));
  }
}

function connectSupabase(): void {
  void (async () => {
    try {
      const config = getSupabaseConfig();
      ensureSupabaseAuthToken();
      saveSupabaseConfig(config);
      await validateSupabaseSyncTable(config);
      supabaseConnected = true;
      setSupabaseStatus(getTranslation("Supabase connected for manual sync."));
      updateSupabaseUi();
    } catch (error) {
      const message = error instanceof Error ? error.message : getTranslation("Supabase connection failed.");
      setSupabaseStatus(message);
      updateSupabaseUi();
    }
  })();
}

async function signInSupabaseNow(): Promise<void> {
  try {
    const config = getSupabaseConfig();
    saveSupabaseConfig(config);
    await signInSupabaseWithPassword(config);
    setSupabaseStatus(getTranslation("Supabase signed in. Click Connect Supabase."));
  } catch (error) {
    const message = error instanceof Error ? error.message : getTranslation("Supabase sign-in failed.");
    setSupabaseAuthStatus(message);
  }
}

async function signUpSupabaseNow(): Promise<void> {
  try {
    const config = getSupabaseConfig();
    saveSupabaseConfig(config);
    await signUpSupabaseWithPassword(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : getTranslation("Supabase sign-up failed.");
    setSupabaseAuthStatus(message);
  }
}

async function signOutSupabaseNow(): Promise<void> {
  try {
    const config = getSupabaseConfig();
    if (supabaseAccessToken) {
      await fetch(`${config.url}/auth/v1/logout`, {
        method: "POST",
        headers: new Headers({
          apikey: config.anonKey,
          Authorization: `Bearer ${supabaseAccessToken}`
        })
      });
    }
  } finally {
    clearAuthenticatedUser();
    supabaseConnected = false;
    setSupabaseStatus(getTranslation("Supabase sync is disconnected."));
    updateSupabaseUi();
  }
}

async function pushToSupabaseNow(): Promise<void> {
  if (!items.length) {
    alert(getTranslation("Build a checklist first."));
    return;
  }

  try {
    const config = getSupabaseConfig();
    ensureSupabaseAuthToken();
    saveSupabaseConfig(config);
    const payload = buildSyncPayload();
    await pushToSupabase(config, payload);
    supabaseConnected = true;
    setSupabaseStatus(`${getTranslation("Pushed to Supabase at")} ${new Date().toLocaleString()}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : getTranslation("Supabase push failed.");
    setSupabaseStatus(message);
  }
}

async function pullFromSupabaseNow(): Promise<void> {
  try {
    const config = getSupabaseConfig();
    ensureSupabaseAuthToken();
    saveSupabaseConfig(config);
    const payload = await pullFromSupabase(config);
    if (!payload) {
      setSupabaseStatus(getTranslation("No synced state found for this sync key yet."));
      return;
    }

    await applySyncPayload(payload);
    supabaseConnected = true;
    setSupabaseStatus(`${getTranslation("Pulled from Supabase at")} ${new Date().toLocaleString()}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : getTranslation("Supabase pull failed.");
    setSupabaseStatus(message);
  }
}

function disconnectSupabase(): void {
  supabaseConnected = false;
  setSupabaseStatus(getTranslation("Supabase sync is disconnected."));
  updateSupabaseUi();
}

buildBtn.addEventListener("click", async () => {
  await buildChecklist();
});

clearBtn.addEventListener("click", async () => {
  await clearAll();
});

resetProgressBtn.addEventListener("click", async () => {
  await resetProgress();
});

deleteSavedBtn.addEventListener("click", async () => {
  await deleteSavedData();
});

signUpSupabaseBtn.addEventListener("click", async () => {
  await signUpSupabaseNow();
});

signInSupabaseBtn.addEventListener("click", async () => {
  await signInSupabaseNow();
});

signOutSupabaseBtn.addEventListener("click", async () => {
  await signOutSupabaseNow();
});

connectSupabaseBtn.addEventListener("click", () => {
  connectSupabase();
});

pushSupabaseBtn.addEventListener("click", async () => {
  await pushToSupabaseNow();
});

pullSupabaseBtn.addEventListener("click", async () => {
  await pullFromSupabaseNow();
});

disconnectSupabaseBtn.addEventListener("click", () => {
  disconnectSupabase();
});

exportProgressBtn.addEventListener("click", () => {
  exportProgress();
});

namesFile.addEventListener("change", async () => {
  const file = namesFile.files?.[0];
  if (!file) {
    return;
  }
  await loadNamesFromFile(file);
});

importProgressInput.addEventListener("change", async () => {
  const file = importProgressInput.files?.[0];
  if (!file) {
    return;
  }
  await importProgress(file);
  importProgressInput.value = "";
});

searchInput.addEventListener("input", () => {
  schedulePersist();
  render();
});

missingOnly.addEventListener("change", () => {
  schedulePersist();
  render();
});

indexedDbMode.addEventListener("change", () => {
  if (!indexedDbMode.checked) {
    renderStatus(getTranslation("IndexedDB mode disabled. Local session remains active."));
    return;
  }
  void persistCurrentState();
  renderStatus(getTranslation("IndexedDB mode enabled."));
});

supabaseUrlInput.addEventListener("change", () => {
  supabaseConnected = false;
  setSupabaseStatus(getTranslation("Supabase settings changed. Click Connect Supabase."));
  updateSupabaseUi();
});

supabaseAnonKeyInput.addEventListener("change", () => {
  supabaseConnected = false;
  setSupabaseStatus(getTranslation("Supabase settings changed. Click Connect Supabase."));
  updateSupabaseUi();
});

supabaseSyncKeyInput.addEventListener("change", () => {
  supabaseConnected = false;
  setSupabaseStatus(getTranslation("Supabase settings changed. Click Connect Supabase."));
  updateSupabaseUi();
});

languageSelector.addEventListener("change", () => {
  const selectedLang = languageSelector.value as Language;
  setLanguage(selectedLang);
});

supabaseEmailInput.addEventListener("change", () => {
  saveSupabaseEmail(supabaseEmailInput.value.trim());
  clearAuthenticatedUser();
  supabaseConnected = false;
  updateSupabaseUi();
});

supabasePasswordInput.addEventListener("change", () => {
  clearAuthenticatedUser();
  supabaseConnected = false;
  updateSupabaseUi();
});

window.addEventListener("beforeunload", () => {
  cancelScheduledPersist();
  writeCheckedToStorage();
  revokeImageUrls();
});

renderStatus();
const storedSupabase = loadStoredSupabaseConfig();
supabaseUrlInput.value = storedSupabase.url;
supabaseAnonKeyInput.value = storedSupabase.anonKey;
supabaseSyncKeyInput.value = storedSupabase.syncKey;
supabaseEmailInput.value = loadStoredSupabaseEmail();
clearAuthenticatedUser();
if (storedSupabase.url && storedSupabase.anonKey && storedSupabase.syncKey) {
  setSupabaseStatus(getTranslation("Supabase settings loaded. Sign in, then click Connect Supabase."));
} else {
  setSupabaseStatus(getTranslation("Supabase sync is disconnected."));
}
updateSupabaseUi();
if (!supportsIndexedDb()) {
  indexedDbMode.checked = false;
  indexedDbMode.disabled = true;
  renderStatus(getTranslation("IndexedDB is not supported in this browser."));
} else {
  void (async () => {
    try {
      const snapshot = await readLatestSnapshot();
      if (!snapshot) {
        return;
      }
      await restoreFromSnapshot(snapshot);
    } catch {
      renderStatus(getTranslation("Saved checklist could not be restored. Build checklist again to continue."));
    }
  })();
}

// Initialize language
currentLanguage = loadLanguagePreference();
languageSelector.value = currentLanguage;
applyTranslations();
