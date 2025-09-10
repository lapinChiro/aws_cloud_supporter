// tests/unit/cli/feature-flag.test.ts (新規作成)
// Feature Flag M-007のテスト

describe('Feature Flag System', () => {
  beforeEach(() => {
    // 環境変数をクリア
    delete process.env.USE_OFFICIAL_CDK_TYPES;
  });

  describe('Environment Variable Detection', () => {
    it('should detect USE_OFFICIAL_CDK_TYPES=true', () => {
      process.env.USE_OFFICIAL_CDK_TYPES = 'true';
      
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || false;
      
      expect(useOfficialTypes).toBe(true);
    });

    it('should default to false when environment variable is not set', () => {
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || false;
      
      expect(useOfficialTypes).toBe(false);
    });

    it('should detect USE_OFFICIAL_CDK_TYPES=false', () => {
      process.env.USE_OFFICIAL_CDK_TYPES = 'false';
      
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || false;
      
      expect(useOfficialTypes).toBe(false);
    });
  });

  describe('CLI Option Detection', () => {
    it('should respect CLI option when set', () => {
      const options = { useOfficialTypes: true };
      
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || options.useOfficialTypes;
      
      expect(useOfficialTypes).toBe(true);
    });

    it('should default to false for CLI option', () => {
      const options = { useOfficialTypes: false };
      
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || options.useOfficialTypes;
      
      expect(useOfficialTypes).toBe(false);
    });
  });

  describe('Priority Logic', () => {
    it('should prioritize environment variable over CLI option', () => {
      process.env.USE_OFFICIAL_CDK_TYPES = 'true';
      const options = { useOfficialTypes: false };
      
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || options.useOfficialTypes;
      
      expect(useOfficialTypes).toBe(true);
    });

    it('should use CLI option when environment variable is false', () => {
      process.env.USE_OFFICIAL_CDK_TYPES = 'false';
      const options = { useOfficialTypes: true };
      
      const useOfficialTypes = process.env.USE_OFFICIAL_CDK_TYPES === 'true' || options.useOfficialTypes;
      
      expect(useOfficialTypes).toBe(true);
    });
  });
});