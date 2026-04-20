import { ChangeEvent, FC, useEffect, useState } from 'react';

import { DEFAULT_DOWNLOAD_SUBDIR, MiddleClickAction, sanitizeSubdir } from '../common/options';
import { useOptions } from '../contexts/OptionsContext';

const MIDDLE_CLICK_LABELS: Record<MiddleClickAction, string> = {
  none: 'Disabled',
  open: 'Open image in new tab',
  save: 'Save image',
};

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200';

const labelClass = 'flex flex-col gap-1 text-sm font-medium text-slate-700';

const Options: FC = () => {
  const { options, loadingOptions, savingOptions, updateOptions } = useOptions();
  const [thresholdKb, setThresholdKb] = useState<number>(options.thresholdKb);
  const [downloadSubdir, setDownloadSubdir] = useState<string>(options.downloadSubdir);
  const [middleClickAction, setMiddleClickAction] = useState<MiddleClickAction>(
    options.middleClickAction
  );
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    if (!loadingOptions) {
      setThresholdKb(options.thresholdKb);
      setDownloadSubdir(options.downloadSubdir);
      setMiddleClickAction(options.middleClickAction);
    }
  }, [loadingOptions, options]);

  if (loadingOptions) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        Loading options…
      </div>
    );
  }

  const handleThresholdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value);
    setThresholdKb(Number.isFinite(value) && value > 0 ? value : 0);
  };

  const handleSave = async () => {
    const sanitized = sanitizeSubdir(downloadSubdir);
    setDownloadSubdir(sanitized);
    await updateOptions({
      thresholdKb: Math.max(0, Math.round(thresholdKb)),
      downloadSubdir: sanitized,
      middleClickAction,
    });
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 1500);
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-900">Image Helper Options</h1>
        <p className="text-sm text-slate-500">
          Toggle the extension icon to activate. Images above the threshold get a floating toolbar
          on hover.
        </p>
      </header>

      <label className={labelClass}>
        <span>Minimum image size (KB)</span>
        <input
          type="number"
          min={0}
          step={10}
          value={thresholdKb}
          onChange={handleThresholdChange}
          className={inputClass}
        />
        <span className="text-xs font-normal text-slate-500">
          Images smaller than this are ignored.
        </span>
      </label>

      <label className={labelClass}>
        <span>Download subfolder</span>
        <input
          type="text"
          value={downloadSubdir}
          onChange={(event) => setDownloadSubdir(event.currentTarget.value)}
          placeholder={DEFAULT_DOWNLOAD_SUBDIR}
          className={inputClass}
        />
        <span className="text-xs font-normal text-slate-500">
          Relative to your default Downloads folder. Duplicate names get <code>(N)</code> suffixes
          automatically — e.g. <code>cat.png</code> → <code>cat (1).png</code> →{' '}
          <code>cat (2).png</code>.
        </span>
      </label>

      <label className={labelClass}>
        <span>Middle-click shortcut</span>
        <select
          value={middleClickAction}
          onChange={(event) => setMiddleClickAction(event.currentTarget.value as MiddleClickAction)}
          className={inputClass}
        >
          {(Object.keys(MIDDLE_CLICK_LABELS) as MiddleClickAction[]).map((action) => (
            <option key={action} value={action}>
              {MIDDLE_CLICK_LABELS[action]}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-slate-500">
          Runs the selected action when middle-clicking a qualifying image.
        </span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={savingOptions}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {savingOptions ? 'Saving…' : 'Save'}
        </button>
        {savedBanner && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </div>
  );
};

export default Options;
