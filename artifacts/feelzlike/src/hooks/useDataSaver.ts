// The setting lives in the shared shell so every regional shell consumer
// observes the same persisted preference. Keep the app-local path available
// for media surfaces that already import shared hooks through "@/hooks".
export {
  DATA_SAVER_CHANGE_EVENT,
  DATA_SAVER_STORAGE_KEY,
  browserDataSaverDefault,
  readDataSaverOverride,
  useDataSaver,
} from "@workspace/feelzlike-shell";
export type { DataSaverState } from "@workspace/feelzlike-shell";