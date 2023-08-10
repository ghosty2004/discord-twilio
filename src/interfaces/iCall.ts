import type { VoiceConnection } from "@discordjs/voice";
import type { BaseGuildVoiceChannel, GuildMember, Message } from "discord.js";
import type { WebSocket } from "ws";

export interface iCall {
	member: GuildMember;
	discordVoiceChannel: BaseGuildVoiceChannel;
	discordVoiceChannelConnection: VoiceConnection;
	discordMessage: Message;
	callSid: string;
	streamSid?: string;
	socket?: WebSocket;
	onStart: () => void;
	onStop: () => void;
	onAudioBuffer: (chunk: Buffer) => void;
}
