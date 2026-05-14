// Local ambient types so this lib doesn't need to depend on `vite/client`.
// The hook is consumed from a vite app (feelzlike) where BASE_URL is always
// populated; this declaration just teaches tsc the shape during isolated
// typechecks of the lib itself.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
