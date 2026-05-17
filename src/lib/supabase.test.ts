describe('supabase singleton', () => {
  it('exports a Proxy object', () => {
    // Smoke test — verify the module can be imported and exports supabase.
    // We don't actually initialize the client because env is not mocked
    // (mocking env in jest is complex due to how Obytes pattern works).
    // The actual Supabase client will initialize on first access in the app.
    const mod = require('./supabase');
    expect(mod.supabase).toBeDefined();
    // Verify it's an object (the Proxy)
    expect(typeof mod.supabase).toBe('object');
  });
});
