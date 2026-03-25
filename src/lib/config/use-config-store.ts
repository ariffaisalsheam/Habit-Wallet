import { create } from "zustand";
import { fetchPlatformConfig, updatePlatformConfig, PlatformConfig, DEFAULT_CONFIG } from "@/lib/config/platform-service";

type ConfigStore = {
  config: PlatformConfig;
  isLoading: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  saveConfig: (newConfig: PlatformConfig) => Promise<void>;
};

export const useConfigStore = create<ConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,
  error: null,

  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await fetchPlatformConfig();
      set({ config, isLoading: false });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Failed to load config", isLoading: false });
    }
  },

  saveConfig: async (newConfig: PlatformConfig) => {
    set({ isLoading: true, error: null });
    try {
      await updatePlatformConfig(newConfig);
      set({ config: newConfig, isLoading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      set({ 
        error: msg.includes("not found") 
          ? "Storage collection 'platform_config' not created in Appwrite." 
          : "Failed to save config: " + msg, 
        isLoading: false 
      });
      throw e;
    }
  },
}));
