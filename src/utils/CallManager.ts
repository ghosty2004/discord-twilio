import { WebSocket } from "ws";
import { iCall } from "../interfaces/iCall";
import { convertOpusToMulaw } from "./AudioConverter";

class CallManager {
	private calls = new Set<iCall>();

	public addToCall(call: iCall) {
		this.calls.add(call);

		const memberVoiceSubscribe =
			call.discordVoiceChannelConnection.receiver.subscribe(
				call.member.user.id
			);

		memberVoiceSubscribe.on("data", (chunk: Buffer) => {
			if (!call.socket || !call.streamSid) return;

			const convertedChunk = convertOpusToMulaw(chunk);
			call.socket.emit(
				"message",
				JSON.stringify({
					event: "media",
					streamSid: call.streamSid,
					media: {
						payload: convertedChunk.toString("base64"),
					},
				})
			);

			console.log(
				`original:${chunk.length} bytes | converted:${convertedChunk.length} bytes`
			);
		});
	}

	public removeFromCall(streamSid: string) {
		const call = [...this.calls.values()].find(
			(f) => f.streamSid === streamSid
		);
		if (typeof call === "undefined") return;
		call.discordVoiceChannelConnection.destroy();
		this.calls.delete(call);
	}

	public findByCallSid(callSid: string) {
		return [...this.calls.values()].find((f) => f.callSid === callSid);
	}

	public setCocketForCallSid(callSid: string, socket: WebSocket) {
		const call = this.findByCallSid(callSid);
		if (call) {
			call.socket = socket;
		}
	}

	public setStreamSidForCallSid(callSid: string, streamSid: string) {
		const call = this.findByCallSid(callSid);
		if (call) {
			call.streamSid = streamSid;
		}
	}

	public findByStreamSid(sid: string) {
		return [...this.calls.values()].find((f) => f.streamSid === sid);
	}
}

export const callManager = new CallManager();
