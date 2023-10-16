import { WebSocket } from "ws";
import { iCall } from "@/interfaces/iCall";
import { convertOpusToMulaw } from "@/utils/AudioConverter";

export class CallManager {
  private static calls = new Set<iCall>();

  public static addToCall(call: iCall) {
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
        Buffer.from(
          JSON.stringify({
            event: "media",
            streamSid: call.streamSid,
            media: {
              payload: convertedChunk.toString("base64"),
            },
          })
        )
      );

      // console.log(
      //   `original:${chunk.length} bytes | converted:${convertedChunk.length} bytes`
      // );
    });
  }

  public static removeFromCall(streamSid: string) {
    const call = [...this.calls.values()].find(
      (f) => f.streamSid === streamSid
    );
    if (typeof call === "undefined") return;
    call.discordVoiceChannelConnection.destroy();
    this.calls.delete(call);
  }

  public static findByCallSid(callSid: string) {
    return [...this.calls.values()].find((f) => f.callSid === callSid);
  }

  public static setSocketForCallSid(callSid: string, socket: WebSocket) {
    const call = this.findByCallSid(callSid);
    if (call) {
      call.socket = socket;
    }
  }

  public static setStreamSidForCallSid(callSid: string, streamSid: string) {
    const call = this.findByCallSid(callSid);
    if (call) {
      call.streamSid = streamSid;
    }
  }

  public static findByStreamSid(sid: string) {
    return [...this.calls.values()].find((f) => f.streamSid === sid);
  }
}
