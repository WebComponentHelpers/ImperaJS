import {StateTransition, StateVariable, Message} from '../build/stateElement.js';

export default function (){
    // this is a must ;)
    localStorage.clear();

    let counter_st = 0;
    let counter_gb = 0;

    describe('Transition',()=>{
        
        let st = new StateTransition("test");
        let st_t = new StateTransition("test_trow");
        let mess = new Message("pollo");
        let message = "ciao";

        let test_target = document.createElement("h1");
        let test_target2 = document.createElement("h2");
        let test_target4 = document.createElement("h4");
        let test_target3 = document.createElement("h3");
        let test_target5 = document.createElement("h5");

        let state_var = new StateVariable("test_var", "string","ciao");
        let state_num = new StateVariable("test_num", "number", 765);

        let ev5 = {detail:{'update':(a)=>{ st_t.updateHandler(); }}};
        let ev6 = {detail:{'update':(a)=>{ st_t.updateHandler(); }}};
        let ev7 = {detail:{'update':(a)=>{ message = a.message ; }}};

        ev6.target = test_target5;
        ev7.target = test_target5;
        
        mess.watchHanlder(ev7);


        it('Attach only once and override if same target',()=>{
            
            let ev = {detail:{'update':(a)=>{ counter_st++; }}};
            let ev2 = {detail:{'update':(a)=>{ counter_st++; }}};
            let ev3 = {detail:{'update':(a)=>{ counter_gb++; }}};
            let ev4 = {detail:{'update':(a)=>{ counter_gb++; }}};

            ev.target = test_target;
            ev2.target = test_target2;
            ev3.target = test_target3;
            ev4.target = test_target4;
            
            st.watchHanlder(ev);
            state_var.watchHanlder(ev3);
            chai.assert.hasAllDeepKeys(st.callbackMap, test_target);
            chai.assert.equal(st.callbackMap.size, 1, "size of map");

            st.watchHanlder(ev2);
            state_num.watchHanlder(ev4);
            chai.assert.hasAllDeepKeys(st.callbackMap, [test_target,test_target2]);    
            chai.assert.equal(st.callbackMap.size, 2, "size of map");

        });

        it('Update Handler: user transition, own and global updates, global map is cleared, lock',()=>{

            st.usrDefined_transition = (evt)=>{
                if(state_num.value === 123)
                    state_num.auto_value = 321;
                
                state_var.auto_value = "bella";
            }

            chai.assert.equal(state_var.value, "ciao", "xcheck");
            chai.assert.equal(state_num.value, 765, "xcheck");
            st.updateHandler({ciao:"nonsense"});

            chai.assert.equal(counter_st, 2, "Two watchers of Transition");
            chai.assert.equal(counter_gb, 1, "Only one global update");
            chai.assert.equal(state_var.value, "bella", "user defined update works");
            chai.assert.equal(state_num.value, 765, "xcheck");

            state_num.value = 123;
            st.updateHandler({ciao:"nonsense"});
            chai.assert.equal(counter_st, 4, "Two watchers of Transition");
            chai.assert.equal(counter_gb, 3, "Only one global update");
            chai.assert.equal(state_var.value, "bella", "user defined update works");
            chai.assert.equal(state_num.value, 321, "xcheck");

            st.watchHanlder(ev6);
            let func = ()=>{ st.updateHandler({ciao:"ciao"}); };
            let func2 = ()=>{ st.watchHanlder(ev5); };

            chai.assert.Throw(func, "Forbidden multiple-update during an update callback loop");
            chai.assert.Throw(func2, "Target is undefined");

        });
        it('Detaches',()=>{

            let func3 = ()=>{ st.detachHanlder(ev5); };
            chai.assert.Throw(func3, "Target is undefined")
            
            st.detachHanlder(ev6);
            chai.assert.hasAllDeepKeys(st.callbackMap, [test_target,test_target2]);    
            chai.assert.equal(st.callbackMap.size, 2, "size of map");
        });
        describe('Message',()=>{
            it('Update Handler pass the message',()=>{
                let ev8 = {detail:{message:"cazzone"}};

                mess.updateHandler(ev8);
                chai.assert.equal(message, "cazzone", "message doesn't work");
            });
        });
    });

}
