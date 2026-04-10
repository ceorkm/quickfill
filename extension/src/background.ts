import { applyAlias } from "./aliasGenerator";
import {
  AutofillMode,
  ExtensionSettings,
  ExtensionState,
  Profile,
  RuntimeState,
  VaultPayload
} from "./types";

const VAULT_VERSION = 1;
const VAULT_STORAGE_KEY = "swiftFillVault";
const SETTINGS_STORAGE_KEY = "swiftFillSettings";

const runtimeState: RuntimeState = {
  decryptedVault: null,
  activeProfileId: null,
  autofillMode: "manual"
};

type BackgroundMessage =
  | { type: "GET_STATE" }
  | {
      type: "INITIALIZE_VAULT";
      payload: {
        profiles: Profile[];
        autofillMode: AutofillMode;
      };
    }
  | { type: "SAVE_PROFILE"; payload: { profile: Profile } }
  | { type: "SET_ACTIVE_PROFILE"; payload: { profileId: string } }
  | { type: "SET_AUTOFILL_MODE"; payload: { mode: AutofillMode } }
  | { type: "TRIGGER_AUTOFILL" }
  | { type: "CONTENT_READY"; tabId?: number }
  | { type: "RESET_VAULT" };

type BackgroundResponse =
  | { success: true; state?: ExtensionState }
  | { success: false; error: string }
  | { fillDirective?: FillDirective };

interface FillDirective {
  shouldFill: boolean;
  profile?: Profile;
  mode: AutofillMode;
}

async function storageGet<T>(key: string): Promise<T | null> {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => {
      resolve((result?.[key] ?? null) as T | null);
    });
  });
}

async function storageSet(partial: Record<string, unknown>): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set(partial, () => resolve());
  });
}

async function autoLoadVault(): Promise<void> {
  if (runtimeState.decryptedVault) return;

  const stored = await storageGet<VaultPayload>(VAULT_STORAGE_KEY);
  if (!stored?.profiles) return;

  const settings = await getSettings();
  runtimeState.decryptedVault = stored;
  runtimeState.activeProfileId = settings.activeProfileId ?? stored.profiles[0]?.id ?? null;
  runtimeState.autofillMode = settings.autofillMode;
}

async function buildExtensionState(): Promise<ExtensionState> {
  await autoLoadVault();

  const settings = await getSettings();
  const hasVault = runtimeState.decryptedVault !== null;
  const profiles = runtimeState.decryptedVault?.profiles ?? [];
  const activeProfileId =
    runtimeState.activeProfileId ??
    settings.activeProfileId ??
    (profiles.length > 0 ? profiles[0].id : null);
  const autofillMode = runtimeState.autofillMode ?? settings.autofillMode ?? "manual";

  return {
    hasVault,
    needsOnboarding: !hasVault,
    profiles,
    activeProfileId,
    autofillMode,
    lastUpdatedAt: runtimeState.decryptedVault?.updatedAt
  };
}

function resetRuntimeState(): void {
  runtimeState.decryptedVault = null;
  runtimeState.activeProfileId = null;
  runtimeState.autofillMode = "manual";
}

async function getSettings(): Promise<ExtensionSettings> {
  const stored = await storageGet<ExtensionSettings>(SETTINGS_STORAGE_KEY);
  return (
    stored ?? {
      activeProfileId: null,
      autofillMode: "manual"
    }
  );
}

function findProfileById(
  profiles: Profile[] | undefined,
  profileId: string | null
): Profile | null {
  if (!profiles || profiles.length === 0) {
    return null;
  }
  if (!profileId) {
    return profiles[0];
  }
  return profiles.find(profile => profile.id === profileId) ?? profiles[0];
}

function getUnlockedProfile(): Profile | null {
  if (!runtimeState.decryptedVault) {
    return null;
  }
  return findProfileById(runtimeState.decryptedVault.profiles, runtimeState.activeProfileId);
}

function getAutofillProfile(): Profile | null {
  const profile = getUnlockedProfile();
  if (!profile) {
    return null;
  }
  const clone: Profile = {
    ...profile,
    fields: { ...(profile.fields ?? {}) }
  };
  return applyAlias(clone);
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      resolve(tabs[0] ?? null);
    });
  });
}

function sendProfileToTab(tabId: number, profile: Profile): void {
  chrome.tabs.sendMessage(
    tabId,
    {
      type: "APPLY_PROFILE",
      payload: {
        profile,
        mode: runtimeState.autofillMode
      }
    },
    () => {
      if (chrome.runtime.lastError) {
        console.debug("Auto-fill message error", chrome.runtime.lastError.message);
      }
    }
  );
}

async function triggerAutofillForActiveTab(): Promise<void> {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }
  const profile = getAutofillProfile();
  if (!profile) {
    return;
  }
  sendProfileToTab(tab.id, profile);
}

async function persistVault(): Promise<void> {
  if (!runtimeState.decryptedVault) {
    throw new Error("No profile data to save.");
  }

  const updatedPayload: VaultPayload = {
    ...runtimeState.decryptedVault,
    updatedAt: new Date().toISOString()
  };

  runtimeState.decryptedVault = updatedPayload;
  await storageSet({ [VAULT_STORAGE_KEY]: updatedPayload });
}

async function persistSettings(partial: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const next: ExtensionSettings = {
    activeProfileId:
      partial.activeProfileId !== undefined ? partial.activeProfileId : current.activeProfileId ?? null,
    autofillMode:
      partial.autofillMode !== undefined ? partial.autofillMode : current.autofillMode ?? "manual"
  };

  runtimeState.activeProfileId = next.activeProfileId;
  runtimeState.autofillMode = next.autofillMode;

  await storageSet({ [SETTINGS_STORAGE_KEY]: next });
  return next;
}

async function handleMessage(
  message: BackgroundMessage,
  sender: chrome.runtime.MessageSender
): Promise<BackgroundResponse> {
  switch (message.type) {
    case "GET_STATE": {
      const state = await buildExtensionState();
      return { success: true, state };
    }

    case "INITIALIZE_VAULT": {
      const { profiles, autofillMode } = message.payload;
      if (!profiles || profiles.length === 0) {
        return { success: false, error: "At least one profile is required." };
      }

      const timestamp = new Date().toISOString();
      const payload: VaultPayload = {
        version: VAULT_VERSION,
        profiles,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      runtimeState.decryptedVault = payload;
      runtimeState.activeProfileId = profiles[0]?.id ?? null;
      runtimeState.autofillMode = autofillMode;

      await Promise.all([
        storageSet({ [VAULT_STORAGE_KEY]: payload }),
        persistSettings({
          activeProfileId: runtimeState.activeProfileId,
          autofillMode
        })
      ]);

      const state = await buildExtensionState();
      return { success: true, state };
    }

    case "SAVE_PROFILE": {
      await autoLoadVault();
      if (!runtimeState.decryptedVault) {
        return { success: false, error: "Set up a profile before editing." };
      }

      const { profile } = message.payload;
      const profiles = [...runtimeState.decryptedVault.profiles];
      const existingIndex = profiles.findIndex(item => item.id === profile.id);
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }
      runtimeState.decryptedVault.profiles = profiles;
      await persistVault();
      await persistSettings({
        activeProfileId: runtimeState.activeProfileId ?? profile.id
      });
      const state = await buildExtensionState();
      return { success: true, state };
    }

    case "SET_ACTIVE_PROFILE": {
      const { profileId } = message.payload;
      await persistSettings({
        activeProfileId: profileId
      });
      const state = await buildExtensionState();
      return { success: true, state };
    }

    case "SET_AUTOFILL_MODE": {
      const { mode } = message.payload;
      await persistSettings({
        autofillMode: mode
      });
      const state = await buildExtensionState();
      if (mode === "auto") {
        await triggerAutofillForActiveTab();
      }
      return { success: true, state };
    }

    case "TRIGGER_AUTOFILL": {
      await triggerAutofillForActiveTab();
      return { success: true };
    }

    case "RESET_VAULT": {
      resetRuntimeState();
      await chrome.storage.local.remove([VAULT_STORAGE_KEY, SETTINGS_STORAGE_KEY]);
      const state = await buildExtensionState();
      return { success: true, state };
    }

    case "CONTENT_READY": {
      const profile = getAutofillProfile();
      const mode = runtimeState.autofillMode;
      const shouldFill = mode === "auto" && Boolean(profile);
      return {
        fillDirective: {
          shouldFill,
          profile: profile ?? undefined,
          mode
        }
      };
    }

    default:
      return { success: false, error: "Unsupported message type." };
  }
}

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error("Background message error", error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    });
  return true;
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  if (!runtimeState.decryptedVault || runtimeState.autofillMode !== "auto") {
    return;
  }
  try {
    const profile = getUnlockedProfile();
    if (!profile) {
      return;
    }
    sendProfileToTab(activeInfo.tabId, getAutofillProfile() ?? profile);
  } catch (error) {
    console.debug("Tab activation autofill skipped", error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (
    changeInfo.status !== "complete" ||
    !runtimeState.decryptedVault ||
    runtimeState.autofillMode !== "auto"
  ) {
    return;
  }

  const profile = getUnlockedProfile();
  if (!profile) {
    return;
  }
  sendProfileToTab(tabId, getAutofillProfile() ?? profile);
});
