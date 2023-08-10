import OpusScript from "opusscript";
import { WaveFile } from "wavefile";
import { mulaw } from "alawmulaw";

const opusEncoder = new OpusScript(8000, 1, OpusScript.Application.AUDIO);
const opusDecoder = new OpusScript(8000, 1, OpusScript.Application.AUDIO);

export const convertMulawToOpus = (buffer: Buffer) => {
	const frameSize = (8000 * 20) / 1000;
	const decodedBuffer = Buffer.from(mulaw.decode(buffer).buffer);
	const packet = opusEncoder.encode(decodedBuffer, frameSize);
	return packet;
};

export const convertOpusToMulaw = (opusBuffer: Buffer) => {
	const decodedBuffer = opusDecoder.decode(opusBuffer);
	const waveFile = new WaveFile();
	waveFile.fromScratch(1, 8000, "16", decodedBuffer);
	waveFile.toMuLaw();
	return Buffer.from(waveFile.toBuffer().buffer);
};
