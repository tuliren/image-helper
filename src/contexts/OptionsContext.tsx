import { FC, ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  DEFAULT_OPTIONS,
  ExtensionOptions,
  OPTIONS_STORAGE_KEY,
  readOptions,
  writeOptions,
} from '../common/options';

interface OptionsContextType {
  options: ExtensionOptions;
  loadingOptions: boolean;
  savingOptions: boolean;
  updateOptions: (next: Partial<ExtensionOptions>) => Promise<void>;
}

const OptionsContext = createContext<OptionsContextType>({
  options: DEFAULT_OPTIONS,
  loadingOptions: true,
  savingOptions: false,
  updateOptions: async () => {},
});

export const useOptions = () => useContext(OptionsContext);

export const OptionsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ExtensionOptions>(DEFAULT_OPTIONS);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [savingOptions, setSavingOptions] = useState(false);

  useEffect(() => {
    (async () => {
      setOptions(await readOptions());
      setLoadingOptions(false);
    })();

    if (chrome?.storage?.onChanged == null) {
      return;
    }
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: chrome.storage.AreaName
    ) => {
      if (areaName !== 'sync' || changes[OPTIONS_STORAGE_KEY] == null) {
        return;
      }
      const next = changes[OPTIONS_STORAGE_KEY].newValue as Partial<ExtensionOptions> | undefined;
      setOptions({ ...DEFAULT_OPTIONS, ...(next ?? {}) });
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateOptions = useCallback(
    async (next: Partial<ExtensionOptions>) => {
      setSavingOptions(true);
      try {
        const merged = { ...options, ...next };
        await writeOptions(merged);
        setOptions(merged);
      } finally {
        setSavingOptions(false);
      }
    },
    [options]
  );

  return (
    <OptionsContext.Provider value={{ options, loadingOptions, savingOptions, updateOptions }}>
      {children}
    </OptionsContext.Provider>
  );
};
