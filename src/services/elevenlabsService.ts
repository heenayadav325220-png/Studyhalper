import fetch from "node-fetch";

export function setupElevenLabsRoute(app: any) {
  app.post("/api/tts/elevenlabs", async (req: any, res: any) => {
    try {
      const { text } = req.body || {};
      if (!text) {
        res.status(400).json({ error: "Text is required for TTS." });
        return;
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured in environment variables." });
        return;
      }

      let voiceId = "7qBNUtXRGP0jPi0H4r8k";
      let url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

      let response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey.trim()
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        // Fallback to pre-made free voice ID (Rachel: 21m00Tcm4TlvDq8ikWAM)
        voiceId = "21m00Tcm4TlvDq8ikWAM";
        url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey.trim()
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!response.ok) {
          const fallbackErrText = await response.text();
          if (fallbackErrText.includes("payment_required") || fallbackErrText.includes("paid_plan_required")) {
            res.json({ fallback: true, message: "ElevenLabs free tier requires paid plan, falling back to browser TTS." });
            return;
          }
          res.status(response.status).json({ error: `ElevenLabs API error: ${fallbackErrText || response.statusText}` });
          return;
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("ElevenLabs proxy error:", err);
      res.status(500).json({ error: err.message || "Failed to generate speech with ElevenLabs." });
    }
  });
}
