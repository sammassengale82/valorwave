import { create } from "zustand";

export interface StemSettings {
  deckId: number;
  vocal: number;
  drums: number;
  bass: number;
  other: number;

  muteVocal: boolean;
  muteDrums: boolean;
  muteBass: boolean;
  muteOther: boolean;

  solo: "none" | "vocal" | "drums" | "bass" | "other";
}

interface StemsState {
  stems: StemSettings[];
  setVolume: (deckId: number, stem: keyof Omit<StemSettings, "deckId" | "solo" | "muteVocal" | "muteDrums" | "muteBass" | "muteOther">, value: number) => void;
  toggleMute: (deckId: number, stem: "vocal" | "drums" | "bass" | "other") => void;
  setSolo: (deckId: number, stem: StemSettings["solo"]) => void;
}

export const useStemsState = create<StemsState>((set) => ({
  stems: [1, 2, 3, 4].map((id) => ({
    deckId: id,
    vocal: 1,
    drums: 1,
    bass: 1,
    other: 1,
    muteVocal: false,
    muteDrums: false,
    muteBass: false,
    muteOther: false,
    solo: "none",
  })),

  setVolume: (deckId, stem, value) =>
    set((state) => ({
      stems: state.stems.map((s) =>
        s.deckId === deckId ? { ...s, [stem]: value } : s
      ),
    })),

  toggleMute: (deckId, stem) =>
    set((state) => ({
      stems: state.stems.map((s) =>
        s.deckId === deckId
          ? { ...s, [`mute${stem[0].toUpperCase() + stem.slice(1)}`]: !s[`mute${stem[0].toUpperCase() + stem.slice(1)}`] }
          : s
      ),
    })),

  setSolo: (deckId, stem) =>
    set((state) => ({
      stems: state.stems.map((s) =>
        s.deckId === deckId ? { ...s, solo: stem } : s
      ),
    })),
}));
