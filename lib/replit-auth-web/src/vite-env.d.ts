interface ImportMeta {
  readonly env: Record<string, string | undefined> & {
    readonly BASE_URL: string;
  };
}
