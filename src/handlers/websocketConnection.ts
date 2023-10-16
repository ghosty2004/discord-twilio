import { WebSocket } from "ws";
import { CallManager } from "@/utils/CallManager";
import { convertMulawToOpus } from "@/utils/AudioConverter";

export default (socket: WebSocket) => {
  socket.on("message", (message) => {
    console.log(message.toString());
    const msg = JSON.parse(message.toString());

    switch (msg.event) {
      case "start":
        CallManager.findByCallSid(msg.start.callSid)?.onStart();
        CallManager.setSocketForCallSid(msg.start?.callSid, socket);
        CallManager.setStreamSidForCallSid(msg.start?.callSid, msg.streamSid);
        break;
      case "stop":
        CallManager.findByStreamSid(msg.streamSid)?.onStop();
        CallManager.removeFromCall(msg.streamSid);
        break;
      case "media":
        const buffer = Buffer.from(msg.media.payload, "base64");
        CallManager.findByStreamSid(
          msg.streamSid
        )?.discordVoiceChannelConnection?.playOpusPacket(
          convertMulawToOpus(buffer)
        );
    }
  });
};
