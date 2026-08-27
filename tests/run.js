// Test runner for the logic layer. Run with `npm test`.
//
// These are plain assertion suites over the services and data - no React, no
// renderer, no test framework. They run under sucrase-node, which strips the
// ESM/JSX syntax the app uses so Node can require src/ directly.
//
// Each suite exports { name, run(ok) } and calls ok('what was checked') after
// each group of assertions.

require('./support/setup');

const SUITES = [require('./courses.test'), require('./personalisation.test')];

const GREEN = '[32m';
const RED = '[31m';
const DIM = '[2m';
const RESET = '[0m';

(async () => {
  let checks = 0;
  let failed = 0;

  for (const suite of SUITES) {
    console.log(`\n${DIM}${suite.name}${RESET}`);
    const ok = (label) => {
      checks += 1;
      console.log(`  ${GREEN}ok${RESET}  ${label}`);
    };
    try {
      await suite.run(ok);
    } catch (error) {
      failed += 1;
      console.error(`  ${RED}FAILED${RESET}  ${error.message}`);
      if (process.env.VERBOSE) console.error(error.stack);
    }
  }

  console.log('');
  if (failed > 0) {
    console.error(`${RED}${failed} suite${failed === 1 ? '' : 's'} failed${RESET} after ${checks} checks.`);
    process.exit(1);
  }
  console.log(`${GREEN}All ${checks} checks passed.${RESET}`);
})();
