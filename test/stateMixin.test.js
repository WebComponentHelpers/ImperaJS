import {statesMixin, StateVariable, StateTransition, Message} from "../build/stateElement.js"

export default function(){
    localStorage.clear();

    describe('State Mixin',()=>{
            let c_tr =0;
            let c_n =0;
            let c_s =0;
            let c_obj =0;

            let b_tr =0;
            let b_n =0;
            let b_s =0;
            let b_obj =0;
            let message2 = "";
            let message = "";
        it('Init: initialize wc correctly with all property',()=>{

            var sv_n = new StateVariable("num", 7);
            var sv_s = new StateVariable("str", "ciao");
            var sv_obj = new StateVariable("obj", {ciao:"bella", hey:[1,2,3]});

            
            var st_count = new StateTransition("count");
            st_count.usrDefined_transition = (input)=>{
                if(input) c_tr = input.val;
                else c_tr++;
            };

            let obj = {bellapete:42};
            sv_n.attachWatcher(obj,()=>{c_n++;});
            sv_s.attachWatcher(obj,()=>{c_s++;});
            sv_obj.attachWatcher(obj,()=>{c_obj++;});

            var m_me = new Message("mess");
            m_me.attachWatcher(obj,(input)=>{message = input.message;});

            var lista = [sv_n,sv_s,sv_obj,st_count,m_me];

            customElements.define("t-uno", class t1 extends statesMixin(lista, HTMLElement){
                on_num_update(){  b_n++;   }
                on_obj_update(){b_obj++;}
                on_str_update(){b_s++;}
                on_count_update(){b_tr++}
                gotMessage_mess(input){message2 = input.message;}
            } );

            var ist = document.createElement('t-uno');

            document.ist =ist;
            chai.assert.equal(ist.num, 7, "State var properties");
            chai.assert.equal(ist.str, "ciao", "State var properties");
            chai.assert.deepEqual(ist.obj,{ciao:"bella", hey:[1,2,3]} , "State var properties");

            chai.assert.hasAllKeys(ist._transitionMap, ["count"], "maps");
            chai.assert.hasAllKeys(ist._messageMap, ["mess"], "maps");
            chai.assert.typeOf(ist.applyTransition, "function");
            chai.assert.typeOf(ist.sendMessageOnChannel, "function");

            chai.assert.containsAllKeys(sv_n.callbackMap, [obj]);
            chai.assert.equal(sv_n.callbackMap.size, 1);

        });

        it('State modification trough transition and proxy variable works',()=>{

            var ist = document.createElement('t-uno');
            
            ist.applyTransition("count");
            chai.assert.equal(c_tr ,1, "transition ");
            ist.applyTransition("count",{val:7});
            chai.assert.equal(c_tr ,7, "transition ");
            chai.assert.equal(b_tr ,0, "transition not connected shouldnot run");

            ist.num = 23;
            chai.assert.equal(c_n ,1, "var num fake watcher");
            chai.assert.equal(b_n ,0, "var num: not connected should not run");

            ist.str = "po";
            chai.assert.equal(c_s ,1, "var str fake watcher");
            chai.assert.equal(b_s ,0, "var str not connected should not run ");

            ist.obj = {hey:"dude"};
            chai.assert.equal(c_obj ,1, "var obj fake watcher");
            chai.assert.equal(b_obj ,0, "var obj not connected should not run ");

            ist.sendMessageOnChannel("mess",{message:"ciao"});
            chai.assert.equal(message,"ciao", "message is sent");
            chai.assert.equal(message2,"", "not connected mesage call back should not run");

        });

        it('On connection sets the watchers',()=>{
            c_tr =0;
            c_n =0;
            c_s =0;
            c_obj =0;

            b_tr =0;
            b_n =0;
            b_s =0;
            b_obj =0;
            message2 = "";
            message = "";

            var ist = document.createElement('t-uno');
            document.body.appendChild(ist);

            ist.applyTransition("count");
            chai.assert.equal(c_tr ,1, "transition fake");
            chai.assert.equal(b_tr ,1, "transition ");
            ist.applyTransition("count",{val:7});
            chai.assert.equal(c_tr ,7, "transition fake2");
            chai.assert.equal(b_tr ,2, "transition ");

            ist.num = 23;
            chai.assert.equal(c_n ,1, "var num fake watcher");
            chai.assert.equal(b_n ,1, "var num: ");

            ist.str = "po";
            chai.assert.equal(c_s ,1, "var str fake watcher");
            chai.assert.equal(b_s ,1, "var str");

            ist.obj = {hey:"dude"};
            chai.assert.equal(c_obj ,1, "var obj fake watcher");
            chai.assert.equal(b_obj ,1, "var obj ");

            ist.sendMessageOnChannel("mess",{message:"ciao"});
            chai.assert.equal(message,"ciao", "message is sent");
            chai.assert.equal(message2,"ciao", "message");

        });
        it('Disconnects',()=>{

            c_tr =0;
            c_n =0;
            c_s =0;
            c_obj =0;

            b_tr =0;
            b_n =0;
            b_s =0;
            b_obj =0;
            message2 = "";
            message = "";

            let ist = document.body.querySelector("t-uno");
            document.body.removeChild(ist);

            ist.applyTransition("count");
            chai.assert.equal(c_tr ,1, "transition fake");
            chai.assert.equal(b_tr ,0, "transition ");
            ist.applyTransition("count",{val:7});
            chai.assert.equal(c_tr ,7, "transition fake2");
            chai.assert.equal(b_tr ,0, "transition ");

            ist.num = 23;
            chai.assert.equal(c_n ,1, "var num fake watcher");
            chai.assert.equal(b_n ,0, "var num: ");

            ist.str = "po";
            chai.assert.equal(c_s ,1, "var str fake watcher");
            chai.assert.equal(b_s ,0, "var str");

            ist.obj = {hey:"dude"};
            chai.assert.equal(c_obj ,1, "var obj fake watcher");
            chai.assert.equal(b_obj ,0, "var obj ");

            ist.sendMessageOnChannel("mess",{message:"ciao"});
            chai.assert.equal(message,"ciao", "message is sent");
            chai.assert.equal(message2,"", "message");

        });
        describe('Performance',()=>{
            it('Update of a 1000 element takes < 77mus',()=>{
                let n_cycles = 1000;
                let n_elements = 1000;

                for(let i=0; i < n_elements; i++){
                    let tmp = document.createElement('t-uno');
                    document.body.appendChild(tmp);
                }

                let motherfucker = document.createElement('t-uno');
                
                b_n = 0;

                let start = performance.now();
                for(let i=0; i < n_cycles; i++){
                    motherfucker.num = 666;
                }
                let time_avg = (performance.now() - start) / n_cycles;
                chai.assert.isBelow(time_avg * 1000 , 77, "take too much time");
                chai.assert.equal(b_n, n_cycles*n_elements, "something fishy :***");
            });
        });
    });
}