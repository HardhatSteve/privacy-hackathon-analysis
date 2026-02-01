import {makeProject} from '@motion-canvas/core';

import hook from './scenes/hook?scene';
import problem from './scenes/problem?scene';
import solution from './scenes/solution?scene';
import costComparison from './scenes/costComparison?scene';
import techHighlights from './scenes/techHighlights?scene';
import cta from './scenes/cta?scene';

export default makeProject({
  scenes: [hook, problem, solution, costComparison, techHighlights, cta],
});
