import { FunctionalComponent } from "preact";
import { ImportExportButtons } from "./ImportExportButtons";

interface MeetingsImportExportProps {
  meetings: any[];
  setMeetings: (meetings: any[]) => void;
  onFlushPendingUpdates?: () => Promise<void>;
  seriesTitle?: string;
  seriesAgenda?: string;
  onUpdateSeries?: (updates: { title?: string; agenda?: string }) => void;
}

export const MeetingsImportExport: FunctionalComponent<
  MeetingsImportExportProps
> = (
  {
    meetings,
    setMeetings,
    onFlushPendingUpdates,
    seriesTitle,
    seriesAgenda,
    onUpdateSeries,
  },
) => {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <ImportExportButtons
        meetings={meetings}
        onImportMeetings={setMeetings}
        onFlushPendingUpdates={onFlushPendingUpdates}
        variant="default"
        seriesTitle={seriesTitle}
        seriesAgenda={seriesAgenda}
        onUpdateSeries={onUpdateSeries}
      />
    </div>
  );
};
