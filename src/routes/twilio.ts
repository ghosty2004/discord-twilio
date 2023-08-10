import { Router } from "express";
import { twiml as Twiml } from "twilio";

const router = Router();

router.get("/", (req, res) => {
	res.send("Hello World !");
});

router.post("/process-input", (req, res) => {
	const twiml = new Twiml.VoiceResponse();
	console.log(req.body);
	twiml.say("Ok");
	res.type("text/xml");
	res.send(twiml.toString());
});

export default router;
