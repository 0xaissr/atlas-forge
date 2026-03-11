"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Grid3X3, Box, FileText, Download } from "lucide-react";
import { GridSettings } from "@/components/grid-settings";
import { RectangularSettings } from "@/components/rectangular-settings";
import { DataFileSettings } from "@/components/datafile-settings";
import type { SplitMode } from "@/types";

interface SettingsPanelProps {
  splitMode: SplitMode;
  onSplitModeChange: (mode: SplitMode) => void;
  image: HTMLImageElement;
  fileName: string;
}

const TAB_MAP: Record<string, SplitMode> = {
  "0": "grid",
  "1": "rectangular",
  "2": "datafile",
};

const MODE_TO_TAB: Record<SplitMode, string> = {
  grid: "0",
  rectangular: "1",
  datafile: "2",
};

export function SettingsPanel({
  splitMode,
  onSplitModeChange,
  image,
  fileName,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Tabs
        value={MODE_TO_TAB[splitMode]}
        onValueChange={(val) => {
          const mode = TAB_MAP[String(val)];
          if (mode) onSplitModeChange(mode);
        }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-border px-3 pt-3 pb-0">
          <TabsList className="w-full">
            <TabsTrigger value="0" className="flex items-center gap-1.5">
              <Grid3X3 className="size-3.5" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="1" className="flex items-center gap-1.5">
              <Box className="size-3.5" />
              Rect
            </TabsTrigger>
            <TabsTrigger value="2" className="flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Data
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="0">
            <GridSettings image={image} fileName={fileName} />
          </TabsContent>

          <TabsContent value="1">
            <RectangularSettings image={image} fileName={fileName} />
          </TabsContent>

          <TabsContent value="2">
            <DataFileSettings fileName={fileName} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Export Settings */}
      <div className="shrink-0 border-t border-border p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Export Settings
        </h3>
        <div className="mb-3 rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          匯出設定將在後續實作
        </div>
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary/20 px-4 py-2 text-sm font-medium text-primary/50 cursor-not-allowed transition-colors"
        >
          <Download className="size-4" />
          Download
        </button>
      </div>
    </div>
  );
}
