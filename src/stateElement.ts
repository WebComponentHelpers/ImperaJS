import onChangeProxy from "./onChange.js"


var _isCallback_locked = false;
var _under_transition = false;
const _transitions_callbackMap :  Map<StateVariable, Function> = new Map();
// _transitions_callbackMap.clear();  // is this needed??  FIXME

class BaseState{
    callbackMap : Map<EventTarget,Function> 
    name : string

    constructor(NAME:string){
        this.name = NAME;
        this.callbackMap = new Map();
        if(typeof(this.name) !== "string") throw Error("Variable name must be a string.");
    }


    lock_callbacks(){
        if(_isCallback_locked) {
            this.unlock_callbacks();
            throw Error('Forbidden multiple-update during an update callback loop.');
        } 
        else  _isCallback_locked = true;
    }

    unlock_callbacks(){
        _isCallback_locked = false;
    }


    _call_watchers(input?:any){
        for( let update_callback of this.callbackMap.values()){
            if(input === undefined) update_callback(); 
            else update_callback(input);
        }
    }

    attachWatcher( target:HTMLElement, callback:Function ) :void {
        if(target === null || target === undefined )
            throw Error("Target is undefined.")
        // add element to the watcher list
        this.callbackMap.set(target, callback);
    }

    detachWatcher( target:HTMLElement) :void {
        if(target === null || target === undefined )
            throw Error("Target is undefined.")
        // remove element from watcher list
        this.callbackMap.delete(target);
    }

}

export class StateTransition extends BaseState{
    
    usrDefined_transition(input?:any){}

    applyTransition( input?:any ) :void {

        this.lock_callbacks();

        _under_transition = true;
        this.usrDefined_transition(input);
        _under_transition = false;

        // loop over watchers callbacks
        this._call_watchers(input);

        // loop over automatically added callbacks to _transitions_callbackMap
        for (let upd_callback of _transitions_callbackMap.values()){
            upd_callback();
        }

        _transitions_callbackMap.clear();
        this.unlock_callbacks();
    }

}

export class StateVariable extends BaseState{
    type : string;
    default_val : any ;
    _err_on_value :string;
    _val : any;
    _valueProxy: ProxyConstructor;
    _auto_valueProxy: ProxyConstructor;
    allowStandaloneAssign:boolean;
    transitionMap : Map<string,StateTransition>

    constructor(NAME:string, DEFAULT:any){   // FIXME DEFAULT HAS A TYPE OF TYPE
        super(NAME);
        this.type = typeof(DEFAULT);
        this.default_val = DEFAULT;
        this._err_on_value = 'Wrong type assignment to state variable: ' + this.name;
        this._valueProxy = undefined;
        this._auto_valueProxy = undefined;
        this.allowStandaloneAssign = true;
        this.transitionMap = new Map();

        // Sanity checks
        let white_list_types = ["string", "object", "number", "boolean"];
        if(!white_list_types.includes(this.type)) throw TypeError(this._err_on_value);

        // set default variable if none
        this._val = this.GET() || this.CREATE(this.default_val); 

        // proxy
        this._set_proxies()
    }

    _set_proxies(){
        if (this.type === "object" && typeof(this._val) === "object"){
            this._valueProxy = onChangeProxy( this._val, this.updateWatcherIfAllowed.bind(this) );
            this._auto_valueProxy = onChangeProxy( this._val, this._markForWatchersUpdate.bind(this) );
        }
    }

    set value(val:any){
        this._checkIsAllowed();
        this._val = val;
        this._set_proxies();    
        if(_under_transition) this._markForWatchersUpdate();
        else this.updateWatchers();
    }
    get value(){
        if(_under_transition) 
            return (this.type === "object") ? this._auto_valueProxy : this._val;
        else 
            return (this.type === "object") ? this._valueProxy : this._val;
    }

    CREATE(me:any):any{
        if( typeof(me) === this.type ) {
            let push_var = (this.type !== 'string') ? JSON.stringify(me) : me;
            localStorage.setItem(this.name, push_var);
        }
        else throw TypeError(this._err_on_value);   
        return me;
    }

    UPDATE_DATA():void{
        if( typeof(this._val) === this.type ) {
            let push_var = (this.type !== 'string') ? JSON.stringify(this._val) : this._val;
            localStorage.setItem(this.name, push_var);
        }
        else {
            if(_under_transition)  _under_transition = false;
            if(_isCallback_locked) this.unlock_callbacks();
            throw TypeError(this._err_on_value);   
        }
    }

    RESET():void{
        this.value = this.default_val ;
    }

    GET():any{
        let return_val = localStorage.getItem(this.name);
        if(return_val === null)  return return_val;
        if(this.type !== 'string'){
            return_val = JSON.parse(return_val);
            if(typeof(return_val) !== this.type ) 
                throw TypeError("State variable: "+this.name+" is corrupted, returns type "+typeof(return_val) +" expecting "+ this.type);
        }
        return return_val;
    }

    _markForWatchersUpdate(){
        this.UPDATE_DATA();
        _transitions_callbackMap.set(this, this._call_watchers.bind(this));
    }

    _checkIsAllowed(){
        if(!this.allowStandaloneAssign && !_under_transition) {
            if(_under_transition) _under_transition = false;
            throw "StateVariable " + this.name + " is not allowed assignment outside a state transition";
        }
    }
    updateWatcherIfAllowed(){
        this._checkIsAllowed();
        this.updateWatchers();
    }
    updateWatchers() :void {

        this.lock_callbacks();
               
        this.UPDATE_DATA();
    
        // loop over watchers callbacks
        this._call_watchers();

        this.unlock_callbacks();
    }
    
    addTransition(name:string, func:Function){
        let t = new StateTransition(name);
        if(typeof(func) === "function"){
            t.usrDefined_transition = func.bind(this);
            this.transitionMap.set(name,t);
            this.allowStandaloneAssign = false;
        }
    }

    applyTransition(name:string,input?:any){
        if(this.transitionMap.has(name))
            this.transitionMap.get(name).applyTransition(input);
        else throw Error(`Transition ${name} not found`);
    }
    

}

export class Message extends BaseState{
    sendMessage(input:any) :void {
        this._call_watchers(input);
    }
}


let baseMixin = (listOfComponents:Array<StateVariable|StateTransition|Message>, baseClass:any) => class extends baseClass {
    _transitionMap : Map<String,any>
    _messageMap :Map<String,any>

    constructor(){
        super()
        this._transitionMap = new Map()
        this._messageMap = new Map()
        this._extractTransitions()
        this._addGetterSetters()
    }

    _extractTransitions(){
        for (let itr=0; itr < listOfComponents.length; itr++){
            let comp = listOfComponents[itr]
            if(comp instanceof StateVariable){
                for(let t of comp.transitionMap.values()){
                    listOfComponents.push(t)
                }
            }
        }
    }

    applyTransition(name:string,input?:any){
        if(this._transitionMap.has(name))
            this._transitionMap.get(name)(input);
        else throw Error(`Transition ${name} not found`);
    }
    
    sendMessageOnChannel(name:string, payload:any){
        if(this._messageMap.has(name))
            this._messageMap.get(name)(payload);
        else throw Error(`Message channel ${name} not found`);
    }

    _addGetterSetters():void{

        for (let state_comp of listOfComponents) {
          if (state_comp instanceof StateVariable){
                // adding proxy
                if (state_comp.type === "object")
                   this[`_${state_comp.name}Proxy`] = onChangeProxy(state_comp._val, ()=>{throw `${state_comp.name} cannot be assigned from a custom element`});

                Object.defineProperty(this, state_comp.name, {
                    set: (val: any) => {
                        throw `${state_comp.name} cannot be assigned from a custom element`;
                    },
                    get: () => { return ((<StateVariable>state_comp).type === "object") ? this[`_${state_comp.name}Proxy`] : (<StateVariable>state_comp)._val; }
                });
          }
          else if(state_comp instanceof Message){
            this._messageMap.set(state_comp.name, state_comp.sendMessage.bind(state_comp));
          }
          else if(state_comp instanceof StateTransition){
                this._transitionMap.set(state_comp.name, state_comp.applyTransition.bind(state_comp));
          }
          else {
                throw TypeError("Accept only StateVariable, StateTransition or Message.");   
          }

        }
    }
        
    
    disconnectedCallback(){
        if(super['disconnectedCallback'] !== undefined) {
            super.disconnectedCallback();
        }

        for (let state_comp of listOfComponents) {
            //@ts-ignore
            state_comp.detachWatcher(this);
        }

    }
    
}



export let statesMixin = (listOfComponents:Array<StateVariable|StateTransition|Message>, baseClass:any) => class extends baseMixin(listOfComponents, baseClass) {
    
    connectedCallback(){
        if(super['connectedCallback'] !== undefined) {
            super.connectedCallback();
        }
        // watch default state variables
        for (let state_comp of listOfComponents) {
            
            if(state_comp instanceof Message){
                if(this[`gotMessage_${state_comp.name}`])
                    //@ts-ignore
                    state_comp.attachWatcher(this, this[`gotMessage_${state_comp.name}`].bind(this));
            }
            else if(state_comp instanceof StateTransition) {
                if(this[`on_${state_comp.name}`]) 
                    //@ts-ignore
                    state_comp.attachWatcher(this, this[`on_${state_comp.name}`].bind(this));
            }
            else if(this[`on_${state_comp.name}_update`]) {
                //@ts-ignore
                state_comp.attachWatcher(this, this[`on_${state_comp.name}_update`].bind(this));
                this[`on_${state_comp.name}_update`]();
            }
        }
    }
}

export let litStatesMixin = (listOfComponents:Array<StateVariable|StateTransition|Message>, baseClass:any) => class extends baseMixin(listOfComponents, baseClass) {
    connectedCallback(){
        if(super['connectedCallback'] !== undefined) {
            super.connectedCallback();
        }
        //let run_render_on_connect = false;

        // watch default state variables
        for (let state_comp of listOfComponents) {
            
            if(state_comp instanceof Message){
                if(this[`gotMessage_${state_comp.name}`])
                    //@ts-ignore
                    state_comp.attachWatcher(this, this[`gotMessage_${state_comp.name}`].bind(this));
            }
            else {
                //@ts-ignore
                state_comp.attachWatcher(this, this.requestUpdate.bind(this));
            }
        }
        //if(run_render_on_connect) this.render();
    }
}