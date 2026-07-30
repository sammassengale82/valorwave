export interface Singer {
  id: number;
  name: string;
  requested_song?: string;
  stats: {
    totalSongsSung: number;
    avgPitch: number;
    avgTiming: number;
    bestSong: string;
    performanceHistory: Array<{
      song: string,
      pitch: number,
      timing: number,
      date: number
    }>;
  };
}
