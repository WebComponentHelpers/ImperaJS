import  "../node_modules/chai/chai.js"; 
import   "../node_modules/mocha/mocha.js"; 

// here do the asserts imports
import state_var_assert from './stateVariable.test.js';
import transitions_assert from './stateChange.test.js';

mocha.setup('bdd');

// here run asserts
state_var_assert();
transitions_assert();

mocha.checkLeaks();
mocha.run();
