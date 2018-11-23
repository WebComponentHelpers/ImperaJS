import {StateVariable} from '../build/stateElement.js';

export default function (){
    // this is a must ;)
    localStorage.clear();

    describe("StateVariable Test:",()=>{
        describe("Instantiation",()=>{
            
            it("Instantiated to the store,proper name and initial value",()=>{
                let test_string =  new StateVariable("test_string",'string',"ciao");
                let test_number =  new StateVariable("test_number",'number', 7);
                let test_object =  new StateVariable("test_object",'object',{ciao:"bella", hey:67, poz:["cool", 9]});
                let test_bool   =  new StateVariable("test_bool",'boolean',true);
                
                chai.assert.equal(localStorage.getItem('test_string'), 'ciao', "string not in local storage" );
                chai.assert.equal(localStorage.getItem('test_number'), '7', "number not in local storage" );
                chai.assert.equal(localStorage.getItem('test_object'), JSON.stringify({ciao:"bella", hey:67, poz:["cool", 9]}), "object not in local storage" );
                chai.assert.equal(localStorage.getItem('test_bool'), 'true', "bool not in local storage" );
            });

            it("If exist do not overide",()=>{
                let test_string2 =  new StateVariable("test_string",'string',"ciao2");
                let test_number2 =  new StateVariable("test_number",'number', 14);
                let test_object2 =  new StateVariable("test_object",'object',{ciao:"bella2", hey:67, poz:["cool", 9]});
                let test_bool2   =  new StateVariable("test_bool",'boolean',false);
                chai.assert.equal(localStorage.getItem('test_string'), 'ciao', "string overridden" );
                chai.assert.equal(localStorage.getItem('test_number'), '7', "number overridden" );
                chai.assert.equal(localStorage.getItem('test_object'), JSON.stringify({ciao:"bella", hey:67, poz:["cool", 9]}), "object overridden" );
                chai.assert.equal(localStorage.getItem('test_bool'), 'true', "bool overridden" );
            });

            it("throws for wrong init type",()=>{
                let pollo;
                let test_function = () =>{let a = new StateVariable("test_function",'function',"ciao"); };
                let test_function2 = () =>{let a = new StateVariable("test_function",'string',test_function); };
                let test_function3 = () =>{let a = new StateVariable("test_function",'bool',true); };
                let test_function6 = () =>{let a = new StateVariable("test_function",'boolean',5); };
                let test_function5 = () =>{let a = new StateVariable("test_function",'number',true); };
                let test_function4 = () =>{let a = new StateVariable("test_function",'string',8); };
                let test_function7 = () =>{let a = new StateVariable("test_function",'string',pollo); };

                chai.assert.Throw(test_function, "Wrong type assignment to state variable");
                chai.assert.Throw(test_function2,"Wrong type assignment to state variable");
                chai.assert.Throw(test_function3, "Wrong type assignment to state variable");
                chai.assert.Throw(test_function4, "Wrong type assignment to state variable");
                chai.assert.Throw(test_function5, "Wrong type assignment to state variable");
                chai.assert.Throw(test_function6, "Wrong type assignment to state variable");
                chai.assert.Throw(test_function7, "Wrong type assignment to state variable");
            });
        });
        describe('Input Output',()=>{
    
            it("Getter and Setters return proper value and type.",()=>{
                let test_string =  new StateVariable("test_string",'string',"ciao");
                let test_number =  new StateVariable("test_number",'number', 7);
                let test_object =  new StateVariable("test_object",'object',{ciao:"bella", hey:67, poz:["cool", 9]});
                let test_bool   =  new StateVariable("test_bool",'boolean',true);
                test_string.value = "pelam123";
                test_number.value = 9;
                test_object.value = {bim:"bum",bam:8};
                test_bool.value = false;

                chai.assert.equal(test_string.value, "pelam123", "String " );
                chai.assert.equal(test_number.value, 9 , "Number " );
                chai.assert.deepEqual(test_object.value,{bim:"bum",bam:8}  , "object " );
                chai.assert.equal(test_bool.value,false , "boolean " );
            });
            it("Throws when corrupted, also additional throw test of setter",()=>{
                // only number bool and object can be corrupted, strings cant because of performance cut on JSON parse
                // Also the throw of set function has been tested already in the init (few more here)
                let test_object =  new StateVariable("test_object",'object',{ciao:"bella", hey:67, poz:["cool", 9]});
                let test_bool   =  new StateVariable("test_bool",'boolean',true);
                let test_number =  new StateVariable("test_number",'number',7);

                let test_function = () =>{ test_object.value = "fuck";};
                let test_function2 = () =>{ test_bool.value = 89;};
                let test_function3 = () =>{ test_number.value = undefined;};

                chai.assert.Throw(test_function, "Wrong type assignment to state variable");
                chai.assert.Throw(test_function2,"Wrong type assignment to state variable");
                chai.assert.Throw(test_function3, "Wrong type assignment to state variable");

                localStorage.setItem("test_object",'\"ciao\"');
                localStorage.setItem("test_bool",'\"ciao\"');
                localStorage.setItem("test_number",'\"ciao\"');
                let test_function4 = () =>{ let ciao = test_object.value;};
                let test_function5 = () =>{ let ciao = test_bool.value;};
                let test_function6 = () =>{ let ciao = test_number.value;};
                
                chai.assert.Throw(test_function4, "corrupted");
                chai.assert.Throw(test_function5, "corrupted");
                chai.assert.Throw(test_function6, "corrupted");
            });

        });
        describe('Update Handler',()=>{
            it('It locks',()=>{
                let test_string =  new StateVariable("test_string",'string',"ciao");
                let test_number =  new StateVariable("test_number",'number', 7);
                let double_mod = ()=>{ let pippo = new CustomEvent("bordello",{ bubbles:true, detail:{'value':872}}); test_number.updateHandler(pippo) };
                test_string.callbackMap.set(document.body, double_mod);

                let throw_lock = ()=>{ let pippo = new CustomEvent("bordello",{ bubbles:true, detail:{'value':"ggg"}}); test_string.updateHandler(pippo)};

                chai.assert.Throw(throw_lock, "Forbidden multiple-update");
            });

            it('It updates all values and only once and unlocks',()=>{
                let test_string =  new StateVariable("test_string",'string',"ciao");
                let test_number =  new StateVariable("test_number",'number', 7);
                let test_object =  new StateVariable("test_object",'object',{ciao:"bella", hey:67, poz:["cool", 9]});
                let test_bool   =  new StateVariable("test_bool",'boolean',true);
                
                test_string.value = "hey";
                test_number.value = 123;
                test_object.value = {bla:67, ca:"ca"};
                test_bool.value = false;

                let counter = 0;
                let counter_func = ()=>{ counter++; };
                test_string.callbackMap.set(document.body, counter_func);
                test_number.callbackMap.set(document.body, counter_func);
                test_object.callbackMap.set(document.body, counter_func);
                test_bool.callbackMap.set(document.body, counter_func);
                
                let ev_n = new CustomEvent("bordello",{ bubbles:true, detail:{'value':321}});
                let ev_s = new CustomEvent("bordello",{ bubbles:true, detail:{'value':"qwerty"}});
                let ev_o = new CustomEvent("bordello",{ bubbles:true, detail:{'value':{a:1, b:2}}});
                let ev_b = new CustomEvent("bordello",{ bubbles:true, detail:{'value':true}});
                
                test_string.updateHandler(ev_s);
                chai.assert.equal(test_string.value,"qwerty", "String " );
                chai.assert.equal(counter,1,"Called once ");
                test_number.updateHandler(ev_n);
                chai.assert.equal(test_number.value,321, "number " );
                chai.assert.equal(counter,2,"Called once ");
                test_object.updateHandler(ev_o);
                chai.assert.deepEqual(test_object.value,{a:1, b:2} , "Object " );
                chai.assert.equal(counter,3,"Called once ");
                test_bool.updateHandler(ev_b);
                chai.assert.equal(test_bool.value,true, "bool " );
                chai.assert.equal(counter,4,"Called once ");
            });
        });

    });
}
