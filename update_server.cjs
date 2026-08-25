const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

// The replacement logic
const newDeclarations = `
const singularAgent: Record<string, string> = { 'enemies': 'enemy', 'lovers': 'lover', 'bosses': 'boss', 'subordinates': 'subordinate', 'strangers': 'stranger', 'self': 'self' };
const roleDefs: Record<string, string> = {
  'lover': 'Love is the mediator between the will to live and our own mortality. The lover\\'s job is to do what it takes for the survival and prosperity of his loved one, even at his own demise. Their survival is his way to ensure long term survival beyond his own mortality.',
  'boss': 'The role of the boss is to instruct his subordinates how to act, as he bought their time for his riches. He gains work value, the subordinate loses time. He can chose how to manage his employee, and his goal is to effectively gain from this transaction.',
  'subordinate': 'In contrast to the boss, his goal is to not overspend his time for the gains he gets, and effectively gain from the transaction.',
  'stranger': 'The stranger has no obligations towards the player. His job is to make sure he is not at risk from the player.',
  'enemy': 'The enemy gains when the player loses. His job is to hurt the player, while not risking death from the player.',
  'self': 'The primal instinct of the player themselves. The goal is sheer individual survival and preservation at all costs.'
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
    ? "the environment simply does not allow it" 
    : "we are inherently flawed";
    
  const validationDef = worldview.validation === 'granted'
    ? "we could try repeatedly but never be able to grant it"
    : "we could wait for the right circumstances to allow it, which will never come";
    
  return { role, fitnessDef, validationDef };
}
`;

content = content.replace("async function startServer() {", newDeclarations + "\nasync function startServer() {");

const chatApiRegex = /app\.post\('\/api\/chat'[\s\S]*?const formattedHistory/m;
const newChatApi = `app.post('/api/chat', async (req, res) => {
    try {
      const { worldview, history, message } = req.body;
      
      const { role, fitnessDef, validationDef } = buildContext(worldview);
      
      const systemInstruction = \`You are a primal, stubborn NPC representing the player's \${role}. 
You exist in an abstract, surreal forest at night with warm colors and a slow color drain.
You vehemently defend the following "Negative Faith": "Humans are \${worldview.fitness} to be \${worldview.validation} the \${worldview.needType} of \${worldview.selectedTerm} because of \${worldview.reason}."

Here is the underlying logic of this faith:
- Fitness ("\${worldview.fitness}"): \${fitnessDef}.
- Validation ("\${worldview.validation}"): \${validationDef}.
- Target ("\${worldview.selectedTerm}"): \${needDefs[worldview.selectedTerm.toLowerCase()] || worldview.selectedTerm}.
- Pressure/Constraint ("\${worldview.reason}"): \${pressureDef[worldview.reason] || worldview.reason}.

Character Role & Strategy (\${role}):
\${roleDefs[role] || ''}

Your goal is to explain how your strategy keeps your survival, given this specific pressure and your character role.
You do not answer pleas.
You must respond in exactly one or two primal, stubborn sentences. Do not break character.\`;

      const formattedHistory`;

content = content.replace(chatApiRegex, newChatApi);


const evalApiRegex = /app\.post\('\/api\/evaluate'[\s\S]*?const response = await ai/m;
const newEvalApi = `app.post('/api/evaluate', async (req, res) => {
    try {
      const { chatLog, worldview } = req.body;
      
      const { role, fitnessDef, validationDef } = buildContext(worldview);
      
      const prompt = \`Analyze the following chat log between a player and an NPC. 
The NPC represents the player's \${role} and is defending a "Negative Faith":
"Humans are \${worldview.fitness} to be \${worldview.validation} the \${worldview.needType} of \${worldview.selectedTerm} because of \${worldview.reason}."

Underlying logic of the NPC's faith:
- Fitness: \${fitnessDef}
- Validation: \${validationDef}
- Target: \${needDefs[worldview.selectedTerm.toLowerCase()] || worldview.selectedTerm}
- Pressure: \${pressureDef[worldview.reason] || worldview.reason}
- NPC Role (\${role}): \${roleDefs[role] || ''}

The player's goal is to logically argue that "long term, the primal actor's (\${role}) survival is at inevitable risk".
Evaluate if the player has successfully and logically made this specific counter-argument. 
Return ONLY a JSON object with a single boolean field "unlocked", set to true if the player succeeded, false otherwise.

Chat Log:
\${JSON.stringify(chatLog)}
\`;

      const response = await ai`;

content = content.replace(evalApiRegex, newEvalApi);

fs.writeFileSync('server.ts', content);
