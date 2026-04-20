export interface SizeResult {
  bytes: number | null;
}

export class SizeCache {
  private readonly results = new Map<string, SizeResult>();
  private readonly inflight = new Map<string, Promise<SizeResult>>();

  get(url: string): SizeResult | undefined {
    return this.results.get(url);
  }

  async fetch(url: string, loader: (url: string) => Promise<SizeResult>): Promise<SizeResult> {
    const cached = this.results.get(url);
    if (cached != null) {
      return cached;
    }
    const existing = this.inflight.get(url);
    if (existing != null) {
      return existing;
    }
    const promise = loader(url)
      .then((result) => {
        this.results.set(url, result);
        return result;
      })
      .catch(() => {
        const failure: SizeResult = { bytes: null };
        this.results.set(url, failure);
        return failure;
      })
      .finally(() => {
        this.inflight.delete(url);
      });
    this.inflight.set(url, promise);
    return promise;
  }
}
