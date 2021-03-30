import {
  ensureNxProject,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('nx-oc e2e', () => {

  beforeEach(() => 
    ensureNxProject('@abgov/nx-oc', 'dist/packages/nx-oc')
  );

  describe('pipeline', () => {
    it('should create pipeline', async (done) => {
      const plugin = uniq('pipeline');
      const result = await runNxCommandAsync(
        `generate @abgov/nx-oc:pipeline ${plugin}-build ${plugin}-infra --e ${plugin}-dev`
      );
  
      expect(result.stderr).toBeFalsy();
  
      done();
    });
  });

  describe('apply-infra', () => {
    it('should run oc cli', async (done) => {
      const plugin = uniq('apply-infra');
      const result = await runNxCommandAsync(
        `generate @abgov/nx-oc:apply-infra`
      );
  
      expect(result.stdout).toContain('oc project');
  
      done();
    });
  });
});
