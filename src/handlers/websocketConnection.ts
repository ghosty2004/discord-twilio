import { WebSocket } from "ws";
import { callManager } from "../utils/CallManager";
import { convertMulawToOpus } from "../utils/AudioConverter";

export default (socket: WebSocket) => {
	socket.on("message", (message) => {
		const msg = JSON.parse(message.toString());

		switch (msg.event) {
			case "start":
				console.log(msg);
				callManager.findByCallSid(msg.start.callSid)?.onStart();
				callManager.setCocketForCallSid(msg.start?.callSid, socket);
				callManager.setStreamSidForCallSid(msg.start?.callSid, msg.streamSid);
				break;
			case "stop":
				callManager.findByStreamSid(msg.streamSid)?.onStop();
				callManager.removeFromCall(msg.streamSid);
				break;
			case "media":
				const buffer = Buffer.from(msg.media.payload, "base64");
				callManager
					.findByStreamSid(msg.streamSid)
					?.discordVoiceChannelConnection?.playOpusPacket(
						convertMulawToOpus(buffer)
					);
		}
	});
};
