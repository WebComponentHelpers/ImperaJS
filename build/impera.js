import onChangeProxy from "./onChange.js";
var _isCallback_locked = false;
var _under_transition = false;
const _transitions_callbackMap = new Map();
class BaseState {
    constructor(NAME) {
        this.name = NAME;
        this.callbackMap = new Map();
        if (typeof (this.name) !== "string")
            throw Error("Variable name must be a string.");
    }
    lock_callbacks() {
        if (_isCallback_locked) {
            this.unlock_callbacks();
            throw Error('Forbidden multiple-update during an update callback loop.');
        }
        else
            _isCallback_locked = true;
    }
    unlock_callbacks() {
        _isCallback_locked = false;
    }
    _call_watchers(input) {
        for (let update_callback of this.callbackMap.values()) {
            if (input === undefined)
                update_callback();
            else
                update_callback(input);
        }
    }
    /**
     * Attach a callback to be fired when this stateVariable (or Transition) changes (is dispatched).
     * @param target Element that holds the callback
     * @param callback the callback function needs to be bound to the element if using **this**
     */
    attachWatcher(target, callback) {
        if (target === null || target === undefined)
            throw Error("Target is undefined.");
        // add element to the watcher list
        this.callbackMap.set(target, callback);
    }
    /**
     * Removes the element from the watcher list
     * @param target element to be removed
     */
    detachWatcher(target) {
        if (target === null || target === undefined)
            throw Error("Target is undefined.");
        // remove element from watcher list
        this.callbackMap.delete(target);
    }
}
/**
 * A stateTransition is a global function that is meant to apply simultaneously an overall state change,
 * this can be made of just one variable change or multiple stateVariables changes at the same time, so that the initial and final
 * states are always well defined, it guarantees that UI updates are made at transition completion (final state) only.
 */
export class StateTransition extends BaseState {
    constructor(NAME, func) {
        super(NAME);
        if (typeof func === "function")
            this.usrDefined_transition = func;
    }
    /**
     * User defined transition to be overwritten.
     * @param input Any meaningfull data.
     */
    usrDefined_transition(input) { }
    /**
     * Fires the user defined transition and calls the callbacks of all watchers.
     * @param input data to be passed to the user defined transition
     */
    applyTransition(input) {
        this.lock_callbacks();
        try {
            _under_transition = true;
            this.usrDefined_transition(input);
            _under_transition = false;
            // loop over watchers callbacks of the StateTransition
            this._call_watchers(input);
            // loop over automatically added StateVariable callbacks to _transitions_callbackMap
            for (let upd_callback of _transitions_callbackMap.values()) {
                upd_callback();
            }
        }
        catch (e) {
            _transitions_callbackMap.clear();
            this.unlock_callbacks();
            throw new Error(e.message);
        }
        _transitions_callbackMap.clear();
        this.unlock_callbacks();
    }
}
/**
 * A StateVariable hold the state of the App, its content can be a String, Object, Number and Boolean. Its **DEFAULT**
 * value is passed at creation time and defines the type of the variable, the type cannot be changed later.
 * A StateVariable is automatically stored in **localStorage**.
 * @param  value - Returns a proxy to the content of the stateVariable, whenever it is set (directly or indirectly using Array.push
 * for example) will run the callback for all watchers.Proxy to the content of stateVariable
 * @param  allowStandaloneAssign - Enable/Disable assignment outside of a stateTransition (default true)
 */
export class StateVariable extends BaseState {
    constructor(NAME, DEFAULT) {
        super(NAME);
        this.type = typeof (DEFAULT);
        this.default_val = DEFAULT;
        this._err_on_value = 'Wrong type assignment to state variable: ' + this.name;
        this._valueProxy = undefined;
        this._auto_valueProxy = undefined;
        this.allowStandaloneAssign = true;
        this.transitionMap = new Map();
        // Sanity checks
        let white_list_types = ["string", "object", "number", "boolean"];
        if (!white_list_types.includes(this.type))
            throw TypeError(this._err_on_value);
        // set default variable if none
        this._val = this.GET() || this.CREATE(this.default_val);
        // proxy
        this._set_proxies();
    }
    _set_proxies() {
        if (this.type === "object" && typeof (this._val) === "object") {
            this._valueProxy = onChangeProxy(this._val, this.updateWatcherIfAllowed.bind(this));
            this._auto_valueProxy = onChangeProxy(this._val, this._markForWatchersUpdate.bind(this));
        }
    }
    set value(val) {
        this._checkIsAllowed();
        this._val = val;
        this._set_proxies();
        if (_under_transition)
            this._markForWatchersUpdate();
        else
            this.updateWatchers();
    }
    get value() {
        if (_under_transition)
            return (this.type === "object") ? this._auto_valueProxy : this._val;
        else
            return (this.type === "object") ? this._valueProxy : this._val;
    }
    CREATE(me) {
        if (typeof (me) === this.type) {
            let push_var = (this.type !== 'string') ? JSON.stringify(me) : me;
            localStorage.setItem(this.name, push_var);
        }
        else
            throw TypeError(this._err_on_value);
        return me;
    }
    UPDATE_DATA() {
        if (typeof (this._val) === this.type) {
            let push_var = (this.type !== 'string') ? JSON.stringify(this._val) : this._val;
            localStorage.setItem(this.name, push_var);
        }
        else {
            if (_under_transition)
                _under_transition = false;
            if (_isCallback_locked)
                this.unlock_callbacks();
            throw TypeError(this._err_on_value);
        }
    }
    RESET() {
        this.value = this.default_val;
    }
    GET() {
        let return_val = localStorage.getItem(this.name);
        if (return_val === null)
            return return_val;
        if (this.type !== 'string') {
            return_val = JSON.parse(return_val);
            if (typeof (return_val) !== this.type)
                throw TypeError("State variable: " + this.name + " is corrupted, returns type " + typeof (return_val) + " expecting " + this.type);
        }
        return return_val;
    }
    _markForWatchersUpdate() {
        this.UPDATE_DATA();
        _transitions_callbackMap.set(this, this._call_watchers.bind(this));
    }
    _checkIsAllowed() {
        if (!this.allowStandaloneAssign && !_under_transition) {
            if (_under_transition)
                _under_transition = false;
            throw "StateVariable " + this.name + " is not allowed assignment outside a state transition";
        }
    }
    updateWatcherIfAllowed() {
        this._checkIsAllowed();
        this.updateWatchers();
    }
    updateWatchers() {
        this.lock_callbacks();
        try {
            this.UPDATE_DATA();
            // loop over watchers callbacks
            this._call_watchers();
        }
        catch (e) {
            // make sure to unlock in case of error
            this.unlock_callbacks();
            throw new Error(e.message);
        }
        this.unlock_callbacks();
    }
    /**
     * Add a transition to this stateVariable, after that the variable can only be changed trough defined stateTransition.
     * @param name Used to identify the transition
     * @param func Definition of the variable update, **this** is bound to the variable.
     */
    addTransition(name, func) {
        let t = new StateTransition(name);
        if (typeof (func) === "function") {
            t.usrDefined_transition = func.bind(this);
            this.transitionMap.set(name, t);
            this.allowStandaloneAssign = false;
        }
    }
    /**
     * Fires one of the user defined transition related to this stateVariable.
     * @param name Identifier of the transition.
     * @param input Payload to be passed to the transition, if any.
     */
    applyTransition(name, input) {
        if (this.transitionMap.has(name))
            this.transitionMap.get(name).applyTransition(input);
        else
            throw Error(`Transition ${name} not found`);
    }
}
/**
 * A Message does not change the state of the app and is not persisted in any way, it used to exchange payloads between custom-elements.
 * A custom-element can listen for a specific message, retrieve its payload and fire a callback when this happens.
 */
export class Message extends BaseState {
    sendMessage(input) {
        this._call_watchers(input);
    }
}
let baseMixin = (listOfComponents, baseClass) => class extends baseClass {
    constructor() {
        super();
        this._transitionMap = new Map();
        this._messageMap = new Map();
        this._extractTransitions();
        this._addGetterSetters();
    }
    _extractTransitions() {
        for (let itr = 0; itr < listOfComponents.length; itr++) {
            let comp = listOfComponents[itr];
            if (comp instanceof StateVariable) {
                for (let t of comp.transitionMap.values()) {
                    listOfComponents.push(t);
                }
            }
        }
    }
    applyTransition(name, input) {
        if (this._transitionMap.has(name))
            this._transitionMap.get(name)(input);
        else
            throw Error(`Transition ${name} not found`);
    }
    sendMessageOnChannel(name, payload) {
        if (this._messageMap.has(name))
            this._messageMap.get(name)(payload);
        else
            throw Error(`Message channel ${name} not found`);
    }
    _addGetterSetters() {
        for (let state_comp of listOfComponents) {
            if (state_comp instanceof StateVariable) {
                // adding proxy
                if (state_comp.type === "object")
                    this[`_${state_comp.name}Proxy`] = onChangeProxy(state_comp._val, () => { throw `${state_comp.name} cannot be assigned from a custom element`; });
                Object.defineProperty(this, state_comp.name, {
                    set: (val) => {
                        throw `${state_comp.name} cannot be assigned from a custom element`;
                    },
                    get: () => { return (state_comp.type === "object") ? this[`_${state_comp.name}Proxy`] : state_comp._val; }
                });
            }
            else if (state_comp instanceof Message) {
                this._messageMap.set(state_comp.name, state_comp.sendMessage.bind(state_comp));
            }
            else if (state_comp instanceof StateTransition) {
                this._transitionMap.set(state_comp.name, state_comp.applyTransition.bind(state_comp));
            }
            else {
                throw TypeError("Accept only StateVariable, StateTransition or Message.");
            }
        }
    }
    disconnectedCallback() {
        if (super['disconnectedCallback'] !== undefined) {
            super.disconnectedCallback();
        }
        for (let state_comp of listOfComponents) {
            //@ts-ignore
            state_comp.detachWatcher(this);
        }
    }
};
/**
 * This is a mixin to be applied to a generic web-component. For any **stateVariables** in the list will add to the element a read-only property
 * named as the stateVariable. It will add an **applyTransition** method to dispatch the added
 * transition (either of a stateVariable or of a global stateTransition). Callbacks to react on stateVariable change needs to be overwritten by the user
 * and have a predefiend naming scheme: **on_"stateVarName"_update**. Callbacks to react to transitions are instead called **on_"stateTransitionName"**,
 * in the latter case also the transition input data are passed. For any **Message** in the list a **gotMessage_"messageName"** callback is added to react
 * to message exchange, this callback passes as input the message payload.
 * @param listOfComponents is a list of StateVariables and StateTransition to add to the web-component
 * @param baseClass The class on which the mixin is applied
 */
export var statesMixin = (listOfComponents, baseClass) => class extends baseMixin(listOfComponents, baseClass) {
    connectedCallback() {
        if (super['connectedCallback'] !== undefined) {
            super.connectedCallback();
        }
        // watch default state variables
        for (let state_comp of listOfComponents) {
            if (state_comp instanceof Message) {
                if (this[`gotMessage_${state_comp.name}`])
                    //@ts-ignore
                    state_comp.attachWatcher(this, this[`gotMessage_${state_comp.name}`].bind(this));
            }
            else if (state_comp instanceof StateTransition) {
                if (this[`on_${state_comp.name}`])
                    //@ts-ignore
                    state_comp.attachWatcher(this, this[`on_${state_comp.name}`].bind(this));
            }
            else if (this[`on_${state_comp.name}_update`]) {
                //@ts-ignore
                state_comp.attachWatcher(this, this[`on_${state_comp.name}_update`].bind(this));
                this[`on_${state_comp.name}_update`]();
            }
        }
    }
};
/**
 * This is a mixin to be applied to Lit-Element web-components. For any stateVariables in the list will add a read-only property
 * to the element named as the stateVariable. It will add an **applyTransition** method to dispatch the added
 * transition (either of a stateVariable or of a global stateTransition). For each change of a stateVariable or dispatch of
 * any of the stateTransition a render request is called. For any **Message** in the list it will add a **gotMessage_"messageName"** method to react
 * to message exchange, this method passes as input the message payload.
 * @param listOfComponents is a list of StateVariables and StateTransition to add to the web-component
 * @param baseClass The class on which the mixin is applied
 */
export let litStatesMixin = (listOfComponents, baseClass) => class extends baseMixin(listOfComponents, baseClass) {
    connectedCallback() {
        if (super['connectedCallback'] !== undefined) {
            super.connectedCallback();
        }
        for (let state_comp of listOfComponents) {
            if (state_comp instanceof Message) {
                if (this[`gotMessage_${state_comp.name}`])
                    //@ts-ignore
                    state_comp.attachWatcher(this, this[`gotMessage_${state_comp.name}`].bind(this));
            }
            else {
                //@ts-ignore
                state_comp.attachWatcher(this, this.requestUpdate.bind(this));
            }
        }
    }
};
