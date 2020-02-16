import {StateTransition, StateVariable, Message} from '../build/stateElement.js';

export default function (){
    // this is a must ;)
    localStorage.clear();

    let counter_st = 0;
    let counter_gb = 0;
    let counter_st_init = 0; 

    describe('Transition',()=>{
        
        let st = new StateTransition("test");
        let st_t = new StateTransition("test_trow");
        let mess = new Message("pollo");
        let message = "ciao";

        let st_init = new StateTransition("test",(i)=>{
            if(i) counter_st_init=i;
            else counter_st_init++;
        });

        
        let test_target = document.createElement("h1");
        let test_target2 = document.createElement("h2");
        let test_target4 = document.createElement("h4");
        let test_target3 = document.createElement("h3");
        let test_target5 = undefined;
        let test_target6 = document.createElement("div");
        let test_target7 = document.createElement("div");

        let state_var = new StateVariable("test_var", "ciao");
        let state_num = new StateVariable("test_num", 765);
        let state_obj = new StateVariable("test_obj", {a:"ciao", b:7, c:[1,2,3]});

        document.st = st;
        document.vr = state_num;

        let fu5 = (a)=>{ st_t.applyTransition(); };
        let fu6 = (a)=>{ st_t.applyTransition(); };
        let fu7 = (a)=>{ message = a.message ; };

        
        mess.attachWatcher(test_target7, fu7);


        it('Attach only once and override if same target',()=>{
            
            let fu = (a)=>{ counter_st++; };
            let fu2 = (a)=>{ counter_st++; };
            let fu3 = (a)=>{ counter_gb++; };
            let fu4 = (a)=>{ counter_gb++; };

            state_obj.attachWatcher(test_target3, fu3);
            
            st.attachWatcher(test_target, fu);
            state_var.attachWatcher(test_target3, fu3);
            chai.assert.hasAllDeepKeys(st.callbackMap, test_target);
            chai.assert.equal(st.callbackMap.size, 1, "size of map");

            st.attachWatcher(test_target2, fu2);
            state_num.attachWatcher(test_target4, fu4);
            chai.assert.hasAllDeepKeys(st.callbackMap, [test_target,test_target2]);    
            chai.assert.equal(st.callbackMap.size, 2, "size of map");

            chai.assert.equal(st.callbackMap.get(test_target),fu, "check got right func ");
            st.attachWatcher(test_target, fu2);
            chai.assert.hasAllDeepKeys(st.callbackMap, [test_target,test_target2], "Override ");    
            chai.assert.equal(st.callbackMap.get(test_target),fu2, "Override ");
            chai.assert.equal(st.callbackMap.size, 2, "size of map");

        });

        it('Update Watchers: user transition, own and global updates, global map is cleared, lock',()=>{

            st.usrDefined_transition = (evt)=>{
                if(state_num.value === 123){
                    state_num.value = 321;
                    state_obj.value.c.push(8);
                }
                state_obj.value.a = "hey";
                state_var.value = "bella";
            }


            chai.assert.equal(state_var.value, "ciao", "xcheck");
            chai.assert.equal(state_num.value, 765, "xcheck");
            st.applyTransition({ciao:"nonsense"});

            chai.assert.equal(counter_st, 2, "Two watchers of Transition");
            chai.assert.equal(counter_gb, 2, "Two global update");
            chai.assert.equal(state_var.value, "bella", "user defined update works");
            chai.assert.equal(state_obj.value.a, "hey", "user defined update works on obj ");
            chai.assert.equal(state_num.value, 765, "xcheck");

            state_num.value = 123;
            st.applyTransition({ciao:"nonsense"});
            chai.assert.equal(counter_st, 4, "Two watchers of Transition");
            chai.assert.equal(counter_gb, 6, "global update + override");
            chai.assert.equal(state_var.value, "bella", "user defined update works");
            chai.assert.equal(state_num.value, 321, "xcheck");
            chai.assert.deepEqual(state_obj.value.c, [1,2,3,8], "xcheck");

            
            st.attachWatcher(test_target6,fu6);
            let func = ()=>{ st.applyTransition({ciao:"ciao"}); };
            let func2 = ()=>{ st.attachWatcher(test_target5,fu5); };

            chai.assert.Throw(func, "Forbidden multiple-update during an update callback loop");
            chai.assert.Throw(func2, "Target is undefined");

            st_init.applyTransition();
            chai.assert.equal(counter_st_init, 1, "standalone init ok");
            st_init.applyTransition(7);
            chai.assert.equal(counter_st_init, 7, "standalone init ok 2");

        });
        it('Detaches',()=>{

            let func3 = ()=>{ st.detachWatcher(test_target5); };
            chai.assert.Throw(func3, "Target is undefined")
            
            st.detachWatcher(test_target6);
            chai.assert.hasAllDeepKeys(st.callbackMap, [test_target,test_target2]);    
            chai.assert.equal(st.callbackMap.size, 2, "size of map");
        });

        it('Forbid Standalone out of transition',()=>{

            state_var.allowStandaloneAssign = false;
            st.usrDefined_transition = () =>{
                state_var.value = "kkk"
            }
            let func = () =>{ state_var.value = "jjj"}

            chai.assert.Throw(func, "StateVariable test_var is not allowed assignment outside a state transition");
            st.applyTransition()
            chai.assert.equal(state_var.value, "kkk", "Not Allowed State Var can be modified in state transition");

        });

        it('Async ',()=>{

            let order = [0];

            function promessa() {
                return new Promise(resolve => { resolve('resolved'); });
              }
              
            let set_1 = ()=>{ order.push(1);};
            st.attachWatcher( test_target3, set_1);

            st.usrDefined_transition = async (evt)=>{
                var result = await promessa();
                st_t.applyTransition();
            }
            

            st_t.usrDefined_transition = (vet)=>{ order.push(2); };

            st.applyTransition();

            setTimeout(() => { 
                try{
                    chai.assert.deepEqual(order, [0,1,2], "Async ");
                }
                catch(e){
                    let d = document.querySelector("h1");
                    d.innerHTML = "ASYNC FAILED!  <br>" + e.message ;
                    d.style = "color:red;";
                    document.querySelector("#mocha").appendChild(d);
                }
            }, 1);

        });
        
        describe('Message',()=>{
            it('Update Handler pass the message',()=>{
                let ev8 = {message:"cazzone"};

                mess.sendMessage(ev8);
                chai.assert.equal(message, "cazzone", "message doesn't work");
            });
        });
        
    });

}
