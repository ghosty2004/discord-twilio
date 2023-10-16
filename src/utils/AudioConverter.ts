import OpusScript from "opusscript";
import { WaveFile } from "wavefile";
import { mulaw } from "alawmulaw";

const opusHelper = new OpusScript(8000, 1, OpusScript.Application.AUDIO);

export const convertMulawToOpus = (mulawBuffer: Buffer) => {
  const frameSize = (8000 * 20) / 1000;
  const decodedBuffer = Buffer.from(mulaw.decode(mulawBuffer).buffer);
  const packet = opusHelper.encode(decodedBuffer, frameSize);
  return packet;
};

export const convertOpusToMulaw = (opusBuffer: Buffer) => {
  const decodedBuffer = opusHelper.decode(opusBuffer);
  const waveFile = new WaveFile();
  waveFile.fromScratch(1, 8000, "16", decodedBuffer);
  waveFile.toMuLaw();
  return Buffer.from(waveFile.toBuffer().buffer);
};
