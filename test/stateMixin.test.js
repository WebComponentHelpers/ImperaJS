import {statesMixin, StateVariable, StateTransition, Message, litStatesMixin} from "../build/impera.js"
import {LitElement, html} from 'https://unpkg.com/lit-element?module';

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


            var sv_n = new StateVariable("num", 7);
            var sv_s = new StateVariable("str", "ciao");
            var sv_obj = new StateVariable("obj", {ciao:"bella", hey:[1,2,3]});
            
            sv_n.addTransition("SubTransition",()=>{
                sv_n.value = 78;
            })
            sv_n.allowStandaloneAssign = true;

            var st_count = new StateTransition("count");
            st_count.usrDefined_transition = (input)=>{
                if(input) c_tr = input.val;
                else c_tr++;
            };

        it('Init: initialize wc correctly with all property',()=>{

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
                on_count(){b_tr++}
                gotMessage_mess(input){message2 = input.message;}
            } );

            var ist = document.createElement('t-uno');

            document.ist =ist;
            chai.assert.equal(ist.num, 7, "State var properties");
            chai.assert.equal(ist.str, "ciao", "State var properties");
            chai.assert.deepEqual(ist.obj,{ciao:"bella", hey:[1,2,3]} , "State var properties");

            chai.assert.hasAllKeys(ist._transitionMap, ["count", "SubTransition"], "maps");
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

            let func = ()=>{ ist.num = 23 };
            let func2 = ()=>{ ist.obj = {hey:"dude"}; };
            let func3 = ()=>{ ist.str = "po"; };
            let func4 = ()=>{ let t = ist.obj.hey ; t.push(6); };

            chai.assert.Throw(func, "num cannot be assigned from a custom element");
            chai.assert.Throw(func2, "obj cannot be assigned from a custom element");
            chai.assert.Throw(func3, "str cannot be assigned from a custom element");
            chai.assert.deepEqual(ist.obj,{ciao:"bella", hey:[1,2,3]} , "xcheck");
            chai.assert.Throw(func4, "obj cannot be assigned from a custom element");
            
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
            // it is two because if it is stateVariable on attachment needs to run the side effects of element
            chai.assert.equal(b_tr ,2, "transition ");

            sv_n.value = 23;
            chai.assert.equal(c_n ,1, "var num fake watcher");
            // it is two because if it is stateVariable on attachment needs to run the side effects of element
            chai.assert.equal(b_n ,2, "var num: ");

            sv_s.value = "po";
            chai.assert.equal(c_s ,1, "var str fake watcher");
            // it is two because if it is stateVariable on attachment needs to run the side effects of element
            chai.assert.equal(b_s ,2, "var str");

            sv_obj.value = {hey:"dude"};
            chai.assert.equal(c_obj ,1, "var obj fake watcher");
            // it is two because if it is stateVariable on attachment needs to run the side effects of element
            chai.assert.equal(b_obj ,2, "var obj ");

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

            sv_n.value = 28;
            chai.assert.equal(c_n ,1, "var num fake watcher");
            chai.assert.equal(b_n ,0, "var num: ");

            sv_s.value = "poi";
            chai.assert.equal(c_s ,1, "var str fake watcher");
            chai.assert.equal(b_s ,0, "var str");

            sv_obj.value = {hey:"dudo"};
            chai.assert.equal(c_obj ,1, "var obj fake watcher");
            chai.assert.equal(b_obj ,0, "var obj ");

            ist.sendMessageOnChannel("mess",{message:"ciao"});
            chai.assert.equal(message,"ciao", "message is sent");
            chai.assert.equal(message2,"", "message");

        });
        describe('LitElement Mixin',()=>{
            var lista = [sv_n];
            it('Does a render update',async function(){

                sv_n.value = 1

                class MyFoo extends litStatesMixin(lista,LitElement) {    
                    render() {
                      return html`
                      <div id="num"> This is Lit element ${this.num}</div>
                      `;
                    }
                  }
                customElements.define('my-foo', MyFoo);
                let lit = document.createElement('my-foo');
                document.body.appendChild(lit);
                
                let update = await lit.updateComplete
                let div0 = lit.shadowRoot.querySelector("#num")
                chai.assert.equal(div0.innerText, "This is Lit element 1","lit element gets initialized correctly")
                sv_n.value = 6
                update = await lit.updateComplete
                div0 = lit.shadowRoot.querySelector("#num")
                chai.assert.equal(div0.innerText, "This is Lit element 6","lit element gets modified correctly")
                sv_n.applyTransition("SubTransition")
                update = await lit.updateComplete
                div0 = lit.shadowRoot.querySelector("#num")
                chai.assert.equal(div0.innerText, "This is Lit element 78","lit element respond to transitions")
                
                document.body.removeChild(lit);
            });

        });

        describe('Performance',()=>{
            it('Update of a 1000 element takes < 200mus',()=>{
                let n_cycles = 1000;
                let n_elements = 1000;

                st_count.usrDefined_transition = (input)=>{
                    if(input) c_tr = input.val;
                    else c_tr++;
                    sv_n.value = c_tr;
                };
    

                for(let i=0; i < n_elements; i++){
                    let tmp = document.createElement('t-uno');
                    document.body.appendChild(tmp);
                }

                let motherfucker = document.createElement('t-uno');
                
                b_n = 0;

                let start = performance.now();
                for(let i=0; i < n_cycles; i++){
                    motherfucker.applyTransition("count",{val:i});
                }
                let time_avg = (performance.now() - start) / n_cycles;
                console.log("Performance time per cycle in mus: ", time_avg * 1000);
                chai.assert.isBelow(time_avg * 1000 , 200, "take too much time");
                chai.assert.equal(b_n, n_cycles*n_elements, "something fishy :***");
            });
        });
    });
}