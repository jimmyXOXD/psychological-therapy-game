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
