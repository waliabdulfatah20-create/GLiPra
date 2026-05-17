import {
  isMockAIEnabled,
  MOCK_MEAL_RECOGNITION,
  MOCK_DAILY_GUIDANCE,
  MOCK_MEAL_TEXT_PARSE,
  MOCK_VOICE_PARSE,
} from './mockAI';

describe('mockAI', () => {
  describe('isMockAIEnabled', () => {
    it('returns true when EXPO_PUBLIC_USE_MOCK_AI is "true"', () => {
      expect(isMockAIEnabled()).toBe(true);
    });
  });

  describe('MOCK_MEAL_RECOGNITION', () => {
    it('has expected shape with foods array', () => {
      expect(MOCK_MEAL_RECOGNITION.foods).toHaveLength(3);
      expect(MOCK_MEAL_RECOGNITION.total_protein_g).toBeGreaterThan(0);
      expect(MOCK_MEAL_RECOGNITION.total_calories).toBeGreaterThan(0);
      expect(MOCK_MEAL_RECOGNITION.confidence).toBeGreaterThan(0);
      expect(MOCK_MEAL_RECOGNITION.confidence).toBeLessThanOrEqual(1);
    });

    it('has valid food items with required fields', () => {
      const food = MOCK_MEAL_RECOGNITION.foods[0];
      expect(food).toHaveProperty('name');
      expect(food).toHaveProperty('protein_g');
      expect(food).toHaveProperty('calories');
      expect(food).toHaveProperty('serving_g');
    });
  });

  describe('MOCK_DAILY_GUIDANCE', () => {
    it('has expected shape', () => {
      expect(MOCK_DAILY_GUIDANCE.message).toBeTruthy();
      expect(typeof MOCK_DAILY_GUIDANCE.message).toBe('string');
      expect(MOCK_DAILY_GUIDANCE.protein_tip).toBeTruthy();
      expect(typeof MOCK_DAILY_GUIDANCE.hydration_reminder).toBe('boolean');
      expect(typeof MOCK_DAILY_GUIDANCE.phase_aware).toBe('boolean');
    });
  });

  describe('MOCK_MEAL_TEXT_PARSE', () => {
    it('has expected shape', () => {
      expect(MOCK_MEAL_TEXT_PARSE.foods).toHaveLength(2);
      expect(MOCK_MEAL_TEXT_PARSE.total_protein_g).toBeGreaterThan(0);
      expect(MOCK_MEAL_TEXT_PARSE.total_calories).toBeGreaterThan(0);
    });

    it('has valid food items with required fields', () => {
      const food = MOCK_MEAL_TEXT_PARSE.foods[0];
      expect(food).toHaveProperty('name');
      expect(food).toHaveProperty('protein_g');
      expect(food).toHaveProperty('calories');
      expect(food).toHaveProperty('serving_description');
    });
  });

  describe('MOCK_VOICE_PARSE', () => {
    it('has expected shape with transcript', () => {
      expect(MOCK_VOICE_PARSE.transcript).toContain('eggs');
      expect(MOCK_VOICE_PARSE.foods).toHaveLength(2);
      expect(MOCK_VOICE_PARSE.total_protein_g).toBeGreaterThan(0);
      expect(MOCK_VOICE_PARSE.total_calories).toBeGreaterThan(0);
    });

    it('has valid food items with required fields', () => {
      const food = MOCK_VOICE_PARSE.foods[0];
      expect(food).toHaveProperty('name');
      expect(food).toHaveProperty('protein_g');
      expect(food).toHaveProperty('calories');
      expect(food).toHaveProperty('serving_description');
    });
  });
});
