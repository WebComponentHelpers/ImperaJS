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

                chai.assert.Throw(test_function);
                chai.assert.Throw(test_function2);
                chai.assert.Throw(test_function3);
                chai.assert.Throw(test_function4);
                chai.assert.Throw(test_function5);
                chai.assert.Throw(test_function6);
                chai.assert.Throw(test_function7);
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

                chai.assert.Throw(test_function);
                chai.assert.Throw(test_function2);
                chai.assert.Throw(test_function3);

                localStorage.setItem("test_object",'\"ciao\"');
                localStorage.setItem("test_bool",'\"ciao\"');
                localStorage.setItem("test_number",'\"ciao\"');
                let test_function4 = () =>{ let ciao = test_object.value;};
                let test_function5 = () =>{ let ciao = test_bool.value;};
                let test_function6 = () =>{ let ciao = test_number.value;};
                
                chai.assert.Throw(test_function4);
                chai.assert.Throw(test_function5);
                chai.assert.Throw(test_function6);
            });

        });
        // Input output for bool, string, object and number
            // write/read (getter/setter test) proper value, write read proper type, 
            // throws when corrupted
        
        // Update_handler
            // it does lock the callback, it throws
            // it updates the variable, updates only once
            // it runs the callbacks, set ad hoc, passes the right modified value
            // that unlocks
        
        // Set_auto value willbe tested in Transitions

    });
}
