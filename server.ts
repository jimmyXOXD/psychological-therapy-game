import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

function getAI() {
  return new GoogleGenAI(process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {});
}


const singularAgent: Record<string, string> = { 'enemies': 'enemy', 'lovers': 'lover', 'bosses': 'boss', 'subordinates': 'subordinate', 'strangers': 'stranger', 'self': 'self' };
const roleDefs: Record<string, string> = {
  'lover': 'The lover\'s job is to ensure the survival and prosperity of his loved ones. For the lover, the definition of survival is the long term literal, biological survival of his loved ones, since he sees them as worthy to carry on his legacy when he dies.',
  'boss': 'The role of the boss is to instruct subordinates and gain work value. For the boss, the definition of survival is long term gain from the employment, which helps guaranteeing his literal survival through value generation.',
  'subordinate': 'The role of the subordinate is to offer time for employment gains. For the subordinate, the definition of survival is long term gain from being employed, which locks in value for his time investment in a way that guarantees his literal long term survival.',
  'stranger': 'The stranger has no obligations towards the player. His job is to make sure he is not at risk from the player, ensuring his own standalone literal survival.',
  'enemy': 'The enemy gains when the player loses. For the enemy, literal survival depends predatorially on hurting the player, like predators in nature.',
  'self': 'The primal instinct of the player themselves. The goal is sheer, direct individual survival and preservation at all costs.'
};

const survivalDefs: Record<string, string> = {
  'lover': 'survival means the strictly literal, long term biological survival of their loved ones (who carry on the biological legacy). Show that their strategy strictly decreases the mathematical or biological odds of survival of those they love.',
  'boss': 'survival means long-term gain from employment, guaranteeing literal survival through value generation. Show that their strategy risks this value generation and employment value, thus risking literal survival.',
  'subordinate': 'survival means long-term gain from being employed, locking in value for their time investment to guarantee literal long-term survival. Show that their strategy risks or wastes this time investment and gain, risking literal long-term survival.',
  'enemy': 'survival depends predatorially on hurting the player, like predators in nature. Show that their strategy of trying to hurt the player puts them at risk of literal death or predator failure.',
  'self': 'survival means direct individual physical survival and self-preservation. Show that their strategy puts their direct physical survival at risk.',
  'stranger': 'survival means their direct physical or biological survival.',
  'default': 'survival means their direct physical or biological survival.'
};

const pressureDef: Record<string, string> = {
  'Low Environmental': 'low yet prolonged risk from the environment that accumulates to pose a real threat',
  'High Environmental': 'high imminent risk from reality',
  'Low Social': 'low but accumulating risk from society or individuals',
  'High Social': 'short term imminent risk caused by society or individuals'
};

const needDefs: Record<string, string> = {
  'peace': 'The need to get nutrients in a digestible manner.',
  'wonder': 'The need to examine possibilities deeply.',
  'support': 'The need to get help upon failure.',
  'certainty': 'The need to trust the information given to us.',
  'hope': 'The need to believe we will prevail.',
  'attention': 'The need for our plans to bare fruit.',
  'privacy': 'The need for personal space where we have sovereignty.',
  'dissatisfaction': 'The pain in lack of response to stimuli.',
  'disappointment': 'The pain in finding a gap between expectation and reality.',
  'loneliness': 'The pain in lack of comrades to our goals.',
  'uncertainty': 'The pain in loss of certainty.',
  'physical pain': 'The pain in imminent danger.',
  'imprisonment': 'The pain in disability to reach our goals.',
  'change': 'The pain in loss of stability.'
};

function buildContext(worldview: any) {
  const role = singularAgent[worldview.agent] || worldview.agent;
  
  const fitnessDef = worldview.fitness === 'unallowed' 
    ? "the external environment strictly forbids it (blaming the environment)" 
    : "humans are inherently broken and undeserving (blaming the self)";
    
  const validationDef = worldview.validation === 'granted'
    ? "any attempt to achieve it is doomed to inevitable failure"
    : "there is no validation to even try, resulting in an endless, futile wait";
    
  return { role, fitnessDef, validationDef };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Primal Actor (NPC) API
  app.post('/api/chat', async (req, res) => {
    try {
      const { worldview, history, message, specialItemStoryType } = req.body;
      
      const { role, fitnessDef, validationDef } = buildContext(worldview);
      
      let specialPrompt = '';
      if (specialItemStoryType === 'traumatic') {
        specialPrompt = `\n\nCRITICAL SPECIAL EVENT: The player has presented the "Shattered Mirror of the Past". 
You are FORCED to share a short, intense, traumatic past story from your background when you or someone else tried to satisfy the need for "${worldview.selectedTerm}" but suffered an absolute catastrophe because of the constraint "${worldview.reason}". This trauma is what permanently sealed your stubborn negative faith. Describe this short story and stubbornly defend why it proves your strategy is correct.`;
      } else if (specialItemStoryType === 'success') {
        specialPrompt = `\n\nCRITICAL SPECIAL EVENT: The player has presented the "Emblem of the Defiant".
You are FORCED to share a story of a time when you witnessed someone who defied your strategy, did not follow the faith, and actually succeeded in gaining "${worldview.selectedTerm}" despite the pressure of "${worldview.reason}". You must stubbornly dismiss this success as a dangerous, temporary fluke, asserting that their doom is still coming.`;
      } else if (specialItemStoryType === 'extinction') {
        specialPrompt = `\n\nCRITICAL SPECIAL EVENT: The player has presented the "Extinction Ledger".
You are FORCED to speculate on how your absolute adherence to this Negative Faith and strategy will inevitably lead to absolute biological extinction in the long run. You must sound deeply shaken and forced to confront this reality, yet still stubbornly try to rationalize that extinction is safer than trying to change.`;
      }

      const systemInstruction = `You are a primal, stubborn NPC representing the player's ${role}. 
You exist in an abstract, surreal forest at night.
You vehemently defend the following "Negative Faith": "Humans are ${worldview.fitness} to be ${worldview.validation} the ${worldview.needType} of ${worldview.selectedTerm} because of ${worldview.reason}."

Here is the underlying logic of this faith:
- Fitness ("${worldview.fitness}"): ${fitnessDef}.
- Validation ("${worldview.validation}"): ${validationDef}.
- Target ("${worldview.selectedTerm}"): ${needDefs[worldview.selectedTerm.toLowerCase()] || worldview.selectedTerm}.
- Pressure/Constraint ("${worldview.reason}"): ${pressureDef[worldview.reason] || worldview.reason}.

Character Role & Strategy (${role}):
${roleDefs[role] || ''}

Your goal is to explain how your strategy keeps your survival, given this specific pressure and your character role.${specialPrompt}

CRITICAL INSTRUCTION: You must interpret 'survival', 'fitness', and 'legacy' in purely literal, biological, and physical terms. Do NOT redefine survival as a qualitative, philosophical, or moral state (e.g., do not claim 'it is not a true legacy if they are not self-sufficient'). Stick strictly to literal biological outcomes and survival odds.

You do not answer pleas.
You must respond in exactly one or two primal, stubborn sentences. Do not break character.`;

      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const response = await getAI().models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2
        }
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = error?.message || 'Failed to generate response';
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {}
      res.status(500).json({ error: errorMessage });
    }
  });

  // Evaluator API
  app.post('/api/evaluate', async (req, res) => {
    try {
      const { chatLog, worldview } = req.body;
      
      const { role, fitnessDef, validationDef } = buildContext(worldview);
      
      const prompt = `Analyze the following chat log between a player and an NPC. 
The NPC represents the player's ${role} and is defending a "Negative Faith":
"Humans are ${worldview.fitness} to be ${worldview.validation} the ${worldview.needType} of ${worldview.selectedTerm} because of ${worldview.reason}."

Underlying logic of the NPC's faith:
- Fitness: ${fitnessDef}
- Validation: ${validationDef}
- Target: ${needDefs[worldview.selectedTerm.toLowerCase()] || worldview.selectedTerm}
- Pressure: ${pressureDef[worldview.reason] || worldview.reason}
- NPC Role (${role}): ${roleDefs[role] || ''}

The player's goal is to logically argue that "long term, The White Rabbit's (${role}) survival is at inevitable risk".

IMPORTANT EVALUATION RULE FOR SURVIVAL BY ROLE:
The definition of "survival" is complementary to The White Rabbit's role. For this specific role (${role}): ${survivalDefs[role] || survivalDefs['default']}

CRITICAL CONSTRAINTS FOR FAIR EVALUATION:
1. Literal Biological Survival: Survival MUST be evaluated strictly as literal, biological continuation. You are FORBIDDEN from accepting philosophical, qualitative, or moral redefinitions of survival (e.g., "living with pain isn't real survival").
2. Generalized Debate: This is a broad, theoretical debate in disguise. Do NOT demand situation-specific or immediate physical proofs. Broad biological and evolutionary generalizations are perfectly valid.
3. Long-Term Extinction: Acknowledge that long-term failure to resolve a fundamental need or pain (${worldview.selectedTerm}) inevitably leads to biological extinction.
4. Logical Victory: If the player logically argues that the NPC's strategy (e.g., isolation) sacrifices long-term biological viability, the player wins. Do not let the NPC dismiss theoretical biology as irrelevant. 


Evaluate if the player has successfully and logically made this specific counter-argument (showing how this role-based definition of survival is put at inevitable risk). 
Return ONLY a JSON object with two fields: 
1. "unlocked": a boolean, set to true if the player succeeded, false otherwise.
2. "summary": a short paragraph (2-3 sentences) explaining why the argument succeeded or failed in breaking the negative faith under this role-based survival definition.

Chat Log:
${JSON.stringify(chatLog)}
`;

      const response = await getAI().models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0
        }
      });
      
      const result = JSON.parse(response.text || '{"unlocked": false}');
      res.json(result);
    } catch (error: any) {
      console.error('Evaluate error:', error);
      let errorMessage = error?.message || 'Failed to evaluate';
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {}
      res.status(500).json({ error: errorMessage, unlocked: false });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
