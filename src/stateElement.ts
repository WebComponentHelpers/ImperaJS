
// State Manager element
export enum stateBehaviour{
    NORMAL = 'NORMAL',       // has an associated event for data binding
    READONLY = 'READONLY',   // will not have data binding
}

var _statewatchdog = 0;
const _transitions_callbackMap :  Map<object,Map<object,Function>> = new Map();


export class StateTransition {
    name : string;
    callbackMap : Map<object,Function> ;
    usrDefined_transition: Function;

    constructor(NAME:string){
        this.name = NAME;
        this.callbackMap = new Map();
        this.usrDefined_transition = undefined;
    }

    updateHandler( event:CustomEvent) :void {

        //console.log('Handling event UPDATE: '+this.name);
        if(_statewatchdog >= 10000) _statewatchdog = 0;
        else _statewatchdog++;
        let sanity_check = _statewatchdog;
        
        this.usrDefined_transition(event);

        // loop over watchers callbacks
        for( let update_callback of this.callbackMap.values()){
                update_callback(event.detail.value); // FIXME this will fail
        }

        // loop over automatically added callbacks to _transitions_callbackMap
        for( let state_callbackmap of _transitions_callbackMap.values()){  // FIXME: can't we unify the above with this loop??
            for (let upd_callback of state_callbackmap.values()){
                // FIXME: shit missing value to pass to callbacks!
            }
        }

        if(sanity_check !== _statewatchdog) throw Error('State variables update is forbidden within a data update callback.');
    }

    watchHanlder( event:CustomEvent) :void {
        //console.log('Adding element to watchlist of: '+this.name);

        // add element to the watcher list
        this.callbackMap.set(event.target, event.detail.update);
    }

    detachHanlder( event:CustomEvent) :void {
        //console.log('Removing element from watchlist of: '+this.name);

        // remove element from watcher list
        this.callbackMap.delete(event.target);
    }

}

export class StateVariable extends StateTransition{
    type : string;
    default_val : any ;
    behaviour : stateBehaviour;

    constructor(NAME:string, TYPE:string, BEHAVIOUR:stateBehaviour){
        super(NAME);
        this.type = TYPE;
        this.behaviour = BEHAVIOUR;
        this.default_val = '100';                 // FIXME default value problem
        this.usrDefined_transition = this.update_value;  // FIXME: what is this shit??

        // set localstorage variable if none
        if(localStorage.getItem(this.name) === null) 
            localStorage.setItem(this.name, this.default_val);
    }


    set value(val:any){
        let push_var = val;
        
        //console.log('setting value to: '+this.name);

        if( typeof(val) === this.type ) {
            if(this.type !== 'string')  push_var = JSON.stringify(val);
            localStorage.setItem(this.name, push_var);
        } 
    }

    get value():any{
        
        //console.log('getting value of: '+this.name);

        let return_val = localStorage.getItem(this.name);
        if(this.type !== 'string')
            return_val = JSON.parse(return_val);  // FIXME: use catch/err on parse...

        return return_val;
    }
    
    update_value(event:CustomEvent):void {  // FIXME maybe returning bool: success or failure??
        if( typeof(event.detail.value) === this.type ) {
            
            this.value = event.detail.value;

        }
        else console.log('ERR: stateVariable - ' + this.name + ' forbidden value type.');
    }

}



// FIXME: 
// - this will fail in comunication with state enhanced custom elements
//   in the case each view manage its state, a CE can be then defined previously 
//   in another view and is re-used in the current view loaded lazily

export class stateElement extends HTMLElement{

    stateList: Array<StateVariable>;
    transitionsList: Array<string>;
    transitionsMap: Map<object,Function>;

    constructor(){
        super();

        this.stateList = [];
        this.transitionsList = [];
        this.transitionsMap = new Map();
    }

    connectedCallback(){
        
        // adding basic event listeners for state variables with data binding
        for (let state of this.stateList) {

            if( state.behaviour === stateBehaviour.NORMAL){
              //console.log('adding event listeners: ', 'UPDATE-' + state.name ) ;
              this.addEventListener('UPDATE-' + state.name, state.updateHandler.bind(state) );
              //console.log('adding event listeners: ', 'WATCH-' + state.name ) ;
              this.addEventListener('WATCH-' + state.name, state.watchHanlder.bind(state) );
              //console.log('adding event listeners: ', 'DETACH-' + state.name ) ;
              this.addEventListener('DETACH-' + state.name, state.detachHanlder.bind(state) );
            }
        }
    }

}



// mixin to be applied to a web-component
// FIXME: 
//  - getter and setters error handling with JSON parsing
//  - solve the fact that we don't know type of state if pass only string, maybe pass a tuple
//  - add a check if the WATCH event has been caught, so send an error if StateManager defined after custom element
//  - Problem: maybe I just want access to the stateVariable but don't want to watch.
//  - make test machinery

export let statesMixin = (baseClass, listOfStates:Array<string>) => class extends baseClass {

    constructor(){
        super();
        this._addGetterSetters();
    }

    _addGetterSetters():void{
        for( let state of listOfStates){
            
            //console.log('adding getter and setters for: ', state);

            Object.defineProperty(this, state, {
                set: (val) => { 
                    //console.log('dispatching UPDATE-'+state+' with value: ', val);
                    let event = new CustomEvent('UPDATE-'+state, { bubbles:true, detail:{'value':val} }); 
                    this.dispatchEvent(event);
                },
                get: () => { return JSON.parse(localStorage.getItem(state)); }
            });    
        }
    }
        
    connectedCallback(){
        //console.log('Im connected, running connected callback');
        if(super['connectedCallback'] !== undefined) {
            super.connectedCallback();
        }
        // watch default state variables
        for (let state of listOfStates) {
            let update = this['on_update_'+state].bind(this);
            let event = new CustomEvent('WATCH-'+state, { bubbles:true, detail:{'update':update} });
            //console.log('----> dispatching event: ', 'WATCH-'+state);
            this.dispatchEvent(event);
        }
    }
}