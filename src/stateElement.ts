
// State Manager element
export enum stateBehaviour{
    NORMAL = 'NORMAL',       // has an associated event for data binding
    READONLY = 'READONLY',   // will not have data binding
}


export class StateVariable {
    name : string;
    type : string;
    default_val : any ;
    behaviour : stateBehaviour;
    callbackMap : Map<object,Function> ;

    constructor(NAME:string, TYPE:string, BEHAVIOUR:stateBehaviour){
        this.name = NAME;
        this.type = TYPE;
        this.behaviour = BEHAVIOUR;
        this.callbackMap = new Map();
        this.default_val = '100';                 // FIXME default value problem

        // set localstorage variable if none
        if(localStorage.getItem(this.name) === null) 
            localStorage.setItem(this.name, this.default_val);
    }

    set value(val:any){
        let push_var = val;
        
        console.log('setting value to: '+this.name);

        if( typeof(val) === this.type ) {
            if(this.type !== 'string')  push_var = JSON.stringify(val);
            localStorage.setItem(this.name, push_var);
        } 
    }

    get value():any{
        
        console.log('getting value of: '+this.name);

        let return_val = localStorage.getItem(this.name);
        if(this.type !== 'string')
            return_val = JSON.parse(return_val);  // FIXME: use catch/err on parse...

        return return_val;
    }
    
    updateHandler( event:CustomEvent) :void {

        console.log('Handling event UPDATE: '+this.name);

        if( typeof(event.detail.value) === this.type ) {
            
            this.value = event.detail.value;

            // loop over watchers callbacks
            for( let update_callback of this.callbackMap.values()){
                update_callback(event.detail.value);
            }
        }
        else console.log('ERR: stateVariable - ' + this.name + ' forbidden value type.');
    }

    watchHanlder( event:CustomEvent) :void {
        console.log('Adding element to watchlist of: '+this.name);

        // add element to the watcher list
        this.callbackMap.set(event.target, event.detail.update);
    }

    detachHanlder( event:CustomEvent) :void {
        console.log('Removing element from watchlist of: '+this.name);

        // remove element from watcher list
        this.callbackMap.delete(event.target);
    }
}

export class stateElement extends HTMLElement{

    stateList: Array<StateVariable>;

    constructor(){
        super();

        this.stateList = [];
    }

    connectedCallback(){
        
        // adding basic event listeners for state variables with data binding
        for (let state of this.stateList) {

            if( state.behaviour === stateBehaviour.NORMAL){
              console.log('adding event listeners: ', 'UPDATE-' + state.name ) ;
              this.addEventListener('UPDATE-' + state.name, state.updateHandler.bind(state) );
              console.log('adding event listeners: ', 'WATCH-' + state.name ) ;
              this.addEventListener('WATCH-' + state.name, state.watchHanlder.bind(state) );
              console.log('adding event listeners: ', 'DETACH-' + state.name ) ;
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

export let statesMixin = (baseClass, listOfStates:Array<string>) => class extends baseClass {

    constructor(){
        super();
        this._addGetterSetters();
    }

    _addGetterSetters():void{
        for( let state of listOfStates){
            
            console.log('adding getter and setters for: ', state);

            Object.defineProperty(this, state, {
                set: (val) => { 
                    console.log('dispatching UPDATE-'+state+' with value: ', val);
                    let event = new CustomEvent('UPDATE-'+state, { bubbles:true, detail:{'value':val} }); 
                    this.dispatchEvent(event);
                },
                get: () => { return JSON.parse(localStorage.getItem(state)); }
            });    
        }
    }
        
    connectedCallback(){
        console.log('Im connected, running connected callback');
        if(super['connectedCallback'] !== undefined) {
            super.connectedCallback();
        }
        // watch default state variables
        for (let state of listOfStates) {
            let update = this['on_update_'+state].bind(this);
            let event = new CustomEvent('WATCH-'+state, { bubbles:true, detail:{'update':update} });
            console.log('----> dispatching event: ', 'WATCH-'+state);
            this.dispatchEvent(event);
        }
    }
}