import { Client, EmbedBuilder } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { config } from "dotenv";
import twilio from "twilio";
import WebSocket from "ws";
import express from "express";
import fs from "node:fs/promises";
import http from "node:http";

import websocketConnectionHandler from "./handlers/websocketConnection";
import twilioRouter from "./routes/twilio";
import { callManager } from "./utils/CallManager";

// Dotenv config
const dotEnv = config();

// Discord BOT
const bot = new Client({
	intents: [
		"Guilds",
		"GuildMembers",
		"GuildMessages",
		"GuildVoiceStates",
		"MessageContent",
	],
});

// Twilio Client
const twilioClient = twilio(
	dotEnv.parsed?.TWILIO_ACCOUNT_SID,
	dotEnv.parsed?.TWILIO_AUTH_TOKEN
);

// Express app
const app = express();
app.use(express.json());
app.use("/twilio", twilioRouter);

// HTTP server
const server = http.createServer(app);

// Websocket server
const ws = new WebSocket.Server({ server });
ws.on("connection", websocketConnectionHandler);

bot.on("ready", () => {
	console.log(`${bot.user?.tag} is ready !`);
});

bot.on("messageCreate", async (message) => {
	if (message.author.bot) return;

	const args = message.content.split(" ");
	if (args[0]?.[0] !== dotEnv.parsed?.BOT_PREFIX) return;
	const command = args[0]?.slice(1);

	if (command === "call") {
		const phoneNumber = args[1];
		if (phoneNumber) {
			const userVoiceChannel = message.member?.voice.channel;

			if (userVoiceChannel) {
				twilioClient.calls
					.create({
						twiml: (
							await fs.readFile("twiml.xml", { encoding: "utf-8" })
						).toString(),
						to: phoneNumber,
						from: "+12059533722",
					})
					.then(async ({ sid }) => {
						const getEmbed = (status: string) => {
							const embed = new EmbedBuilder();
							embed.setColor("Aqua");
							embed.setTitle("☎ Call System");
							embed.setDescription(
								`Phone number: **${phoneNumber}**\nStatus: **${status}**`
							);
							embed.setTimestamp(Date.now());
							return embed;
						};

						callManager.addToCall({
							member: message.member!,
							discordVoiceChannel: userVoiceChannel,
							discordVoiceChannelConnection: joinVoiceChannel({
								channelId: userVoiceChannel.id,
								guildId: userVoiceChannel.guild.id,
								adapterCreator: userVoiceChannel.guild.voiceAdapterCreator,
							}),
							discordMessage: await message.channel.send({
								embeds: [getEmbed("Ringing")],
							}),
							callSid: sid,

							// events
							onStart() {
								this.discordMessage.edit({ embeds: [getEmbed("In call")] });
							},
							onStop() {
								this.discordMessage.edit({ embeds: [getEmbed("Finished")] });
							},
							onAudioBuffer(chunk) {
								this.discordVoiceChannelConnection.playOpusPacket(chunk);
							},
						});
					})
					.catch(() => {
						message.reply("Unexpected error from twilio API.");
					});
			} else {
				message.reply("You need to be in a voice channel to use this command.");
			}
		} else {
			message.reply("Please provide a phone number to call.");
		}
	} else if (command === "listen") {
		const userVoiceChannel = message.member?.voice.channel;
		if (userVoiceChannel) {
			const connection = joinVoiceChannel({
				channelId: userVoiceChannel.id,
				guildId: userVoiceChannel.guild.id,
				adapterCreator: userVoiceChannel.guild.voiceAdapterCreator,
			});
			connection.receiver
				.subscribe(message.member.user.id)
				.on("data", (chunk: Buffer) => {
					console.log(chunk.length);
				});
		} else {
			message.reply("You need to be in a voice channel to use this command.");
		}
	}
});

bot.login(dotEnv.parsed?.BOT_TOKEN);

server.listen(8080, () => {
	console.log("HTTP Server started on port 8080");
});
