// src/engine/midiEngine.ts
import { audioEngine } from "./audioEngine";
import { useMidiMappings } from "../state/midiMappings";
import { WebMidi } from "webmidi";

WebMidi.enable()
  .then(() => {
    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);
  })
  .catch(err => console.error(err));

class MidiEngine {
  private midiAccess: MIDIAccess | null = null;
  private connectedInputs: MIDIInput[] = [];

  async init() {
    if (this.midiAccess) return;

    try {
      this.midiAccess = await navigator.requestMIDIAccess();

      this.midiAccess.inputs.forEach((input) => {
        this.connectedInputs.push(input);
        input.onmidimessage = this.handleMessage;
      });
    } catch (err) {
      console.error("MIDI init failed:", err);
    }
  }

  private handleMessage = (msg: MIDIMessageEvent) => {
    const mappings = useMidiMappings.getState().mappings;

    const [status, data1, data2] = msg.data;

    const key = `${status}:${data1}`;

    if (mappings[key]) {
      const action = mappings[key];

      switch (action.type) {
        case "play":
          audioEngine.play(action.deck);
          break;

        case "stop":
          audioEngine.stop(action.deck);
          break;

        case "crossfader":
          audioEngine.setCrossfader(data2 / 127);
          break;

        case "gain":
          audioEngine.setChannelGain(action.deck, data2 / 127);
          break;

        case "eq":
          audioEngine.setChannelEq(action.deck, action.band, (data2 - 64) / 64);
          break;

        case "karaoke":
          audioEngine.setKaraoke(action.deck, data2 > 64);
          break;

        case "position":
          audioEngine.setPosition(action.deck, data2 / 127);
          break;

        default:
          console.warn("Unknown MIDI action:", action);
      }
    }
  };
}

export const midiEngine = new MidiEngine();
