// State Manager element
var stateBehaviour;
(function (stateBehaviour) {
    stateBehaviour["NORMAL"] = "NORMAL";
    stateBehaviour["READONLY"] = "READONLY";
})(stateBehaviour || (stateBehaviour = {}));
class StateVariable {
    constructor(NAME, TYPE, BEHAVIOUR) {
        this.name = NAME;
        this.type = TYPE;
        this.behaviour = BEHAVIOUR;
        this.callbackMap = new Map();
        // set localstorage variable if none
        if (localStorage.getItem(this.name) === null)
            localStorage.setItem(this.name, this.default_val);
    }
    set value(val) {
        let push_var = val;
        if (typeof (val) === this.type) {
            if (this.type !== 'string')
                push_var = JSON.stringify(val);
            localStorage.setItem(this.name, push_var);
        }
    }
    get value() {
        let return_val = localStorage.getItem(this.name);
        if (this.type !== 'string')
            return_val = JSON.parse(return_val); // FIXME: use catch/err on parse...
        return return_val;
    }
    updateHandler(event) {
        if (typeof (event.detail.value) === this.type) {
            this.value = event.detail.value;
            // loop over watchers callbacks
            for (let update_callback of this.callbackMap.values()) {
                update_callback(event.detail.value);
            }
        }
        else
            console.log('ERR: stateVariable - ' + this.name + ' forbidden value type.');
    }
    watchHanlder(event) {
        // add element to the watcher list
        this.callbackMap.set(event.target, event.detail.update);
    }
    detachHanlder(event) {
        // remove element from watcher list
        this.callbackMap.delete(event.target);
    }
}
class stateElement extends HTMLElement {
    constructor() {
        super();
        this.stateList = [];
    }
    connectedCallback() {
        // adding basic event listeners for state variables with data binding
        for (let state of this.stateList) {
            if (state.behaviour === stateBehaviour.NORMAL) {
                this.addEventListener('UPDATE-' + state.name, state.updateHandler);
                this.addEventListener('WATCH-' + state.name, state.watchHanlder);
                this.addEventListener('DETACH-' + state.name, state.detachHanlder);
            }
        }
    }
}
// mixin to be applied to a web-component
