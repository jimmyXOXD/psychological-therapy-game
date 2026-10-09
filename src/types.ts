export type AgentOfChange = 'lovers' | 'bosses' | 'subordinates' | 'strangers';
export type Constraint = 'Low Environmental' | 'High Environmental' | 'Low Social' | 'High Social';

export interface Worldview {
  fitness: 'unallowed' | 'unfit';
  validation: 'granted' | 'validated';
  needType: 'need' | 'pain';
  fundamentalNeed: string;
  selectedTerm: string;
  reason: Constraint;
  agent: AgentOfChange;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const NEED_DEFINITIONS: Record<string, string> = {
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
