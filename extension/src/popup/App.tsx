import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AutofillMode,
  ExtensionState,
  Profile
} from "@/types";
import OnboardingForm, { OnboardingPayload } from "./components/OnboardingForm";
import ProfileManager from "./components/ProfileManager";
import AutoFillControls from "./components/AutoFillControls";
import { RefreshIcon, EditIcon } from "./components/Icons";
import logoImg from "./quickfill-logo.png";

type BackgroundSuccessResponse = {
  success: true;
  state?: ExtensionState;
};

type BackgroundErrorResponse = {
  success: false;
  error: string;
};

type BackgroundResponse = BackgroundSuccessResponse | BackgroundErrorResponse;

async function sendBackgroundMessage<T extends BackgroundResponse | any>(
  message: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response);
    });
  });
}

function useExtensionState() {
  const [state, setState] = useState<ExtensionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sendBackgroundMessage<BackgroundResponse>({ type: "GET_STATE" });
      if ("success" in response && response.success && response.state) {
        setState(response.state);
        setError(null);
      } else if ("error" in response) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    state,
    setState,
    loading,
    error,
    refresh
  };
}

function App() {
  const { state, setState, loading, error, refresh } = useExtensionState();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const handleOnboardingComplete = useCallback(
    async (payload: OnboardingPayload) => {
      try {
        setStatusMessage("Saving your details...");
        const response = await sendBackgroundMessage<BackgroundResponse>({
          type: "INITIALIZE_VAULT",
          payload
        });
        if ("success" in response && response.success && response.state) {
          setState(response.state);
          setStatusMessage("Profiles saved locally. You can start auto-filling forms.");
        } else if ("error" in response) {
          setStatusMessage(response.error);
        }
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : String(err));
      }
    },
    [setState]
  );

  const handleSaveProfile = useCallback(
    async (profile: Profile) => {
      const response = await sendBackgroundMessage<BackgroundResponse>({
        type: "SAVE_PROFILE",
        payload: { profile }
      });
      if ("success" in response && response.success && response.state) {
        setState(response.state);
        setStatusMessage("Profile saved.");
      } else if ("error" in response) {
        setStatusMessage(response.error);
      }
    },
    [setState]
  );

  const handleChangeActiveProfile = useCallback(
    async (profileId: string) => {
      const response = await sendBackgroundMessage<BackgroundResponse>({
        type: "SET_ACTIVE_PROFILE",
        payload: { profileId }
      });
      if ("success" in response && response.success && response.state) {
        setState(response.state);
      }
    },
    [setState]
  );

  const handleAutofillModeChange = useCallback(
    async (mode: AutofillMode) => {
      const response = await sendBackgroundMessage<BackgroundResponse>({
        type: "SET_AUTOFILL_MODE",
        payload: { mode }
      });
      if ("success" in response && response.success && response.state) {
        setState(response.state);
        setStatusMessage(mode === "auto" ? "Auto-fill enabled." : "Auto-fill set to manual.");
      }
    },
    [setState]
  );

  const handleTriggerAutofill = useCallback(async () => {
    await sendBackgroundMessage<BackgroundResponse>({ type: "TRIGGER_AUTOFILL" });
    setStatusMessage("Attempted to auto-fill the active tab.");
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cream-300 border-t-primary" />
            <span className="text-sm text-warm-500">Loading...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 p-4 text-sm text-accent-red">
          {error}
          <button
            className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark"
            type="button"
            onClick={() => refresh()}
          >
            Retry
          </button>
        </div>
      );
    }

    if (!state) {
      return null;
    }

    if (state.needsOnboarding) {
      return <OnboardingForm onComplete={handleOnboardingComplete} />;
    }

    const activeProfile = state.profiles.find(p => p.id === state.activeProfileId) ?? state.profiles[0];
    const aliasActive = Boolean(activeProfile?.alias?.enabled);

    const handleToggleAlias = async () => {
      if (!activeProfile) return;
      const updatedProfile = {
        ...activeProfile,
        alias: activeProfile.alias
          ? { ...activeProfile.alias, enabled: !activeProfile.alias.enabled }
          : {
              enabled: true,
              generatedAt: new Date().toISOString(),
              fields: (await import("@/aliasGenerator")).generateAliasFields()
            }
      };
      await handleSaveProfile(updatedProfile);
    };

    if (showProfileEditor) {
      return (
        <div className="grid min-w-0 gap-3">
          <button
            type="button"
            onClick={() => setShowProfileEditor(false)}
            className="flex items-center gap-1 justify-self-start text-xs text-warm-500 hover:text-primary transition"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to controls
          </button>
          <ProfileManager
            profiles={state.profiles}
            activeProfileId={state.activeProfileId}
            onSaveProfile={handleSaveProfile}
            onSelectProfile={handleChangeActiveProfile}

          />
        </div>
      );
    }

    return (
      <div className="grid min-w-0 gap-3">
        {/* Active profile indicator */}
        <div className="flex items-center justify-between rounded-xl border border-cream-300 bg-cream-50 px-4 py-3">
          <div>
            <span className="text-xs text-warm-500">Active profile</span>
            <p className="text-sm font-medium text-warm-800">{activeProfile?.label ?? "None"}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowProfileEditor(true)}
            className="flex items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3 py-1.5 text-xs font-medium text-warm-600 transition hover:border-primary/40 hover:text-primary"
          >
            <EditIcon className="w-3 h-3" />
            Edit
          </button>
        </div>

        <AutoFillControls
          onTriggerFill={handleTriggerAutofill}
          aliasActive={aliasActive}
          onToggleAlias={handleToggleAlias}
        />
        <div className="rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 text-xs text-warm-500 shadow-sm">
          QuickFill stores your profiles locally on this device and keeps them ready for autofill.
        </div>

      </div>
    );
  }, [
    loading,
    error,
    state,
    refresh,
    handleAutofillModeChange,
    handleChangeActiveProfile,
    handleOnboardingComplete,
    handleSaveProfile,
    handleTriggerAutofill,
    showProfileEditor
  ]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden bg-cream-100 p-4 text-warm-900">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src={logoImg} alt="QuickFill" className="h-9 w-9 rounded-lg" />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-warm-900">QuickFill</h1>
            <p className="text-[11px] text-warm-500">Local form autofill</p>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs font-medium text-warm-600 transition hover:border-primary/40 hover:text-primary"
          type="button"
          onClick={() => refresh()}
        >
          <RefreshIcon className="w-3.5 h-3.5" />
          Refresh
        </button>
      </header>

      {statusMessage && (
        <div className="shrink-0 rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 text-xs text-warm-600">
          {statusMessage}
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">{content}</main>
    </div>
  );
}

export default App;
