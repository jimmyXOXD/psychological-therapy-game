import { t, SupportedLocale } from './locales/i18n';

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
  language?: SupportedLocale;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const needDefinitionKeys = new Set([
  'peace', 'wonder', 'support', 'certainty', 'hope', 'attention', 'privacy',
  'dissatisfaction', 'disappointment', 'loneliness', 'uncertainty', 'physical pain', 'imprisonment', 'change'
]);

export const NEED_DEFINITIONS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get: (_target, prop: string) => {
    if (typeof prop === 'string' && needDefinitionKeys.has(prop)) {
      return t(`needDefinitions.${prop}`);
    }
    return undefined;
  },
  has: (_target, prop: string) => typeof prop === 'string' && needDefinitionKeys.has(prop)
});
