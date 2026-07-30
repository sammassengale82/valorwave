import { recordingEngine } from "../engine/recordingEngine";

export const useRecordingEngine = () => {
  const startRecording = () => recordingEngine.start();
  const stopRecording = () => recordingEngine.stop();
  const isRecording = recordingEngine.getStatus();

  return {
    startRecording,
    stopRecording,
    isRecording,
  };
};
