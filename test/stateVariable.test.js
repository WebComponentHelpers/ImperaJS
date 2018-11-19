import {StateVariable, stateBehaviour} from '../build/stateElement.js';

export default function (){
    describe("doesn't crash",()=>{
        it("bella",()=>{
            let test_state = new StateVariable("test",'string',stateBehaviour['NORMAL'],);
            chai.assert.equal(localStorage.getItem('test'), '100', "var is in local storage" );
        });
    });
}
