# ImperaJS

Tiny, Proxy based App State Management for custom-elements.

# Main Features

I know what you are thinking... Yet another framework, hurray!

This library is inspired to State Management frameworks that we all know (Redux, MobX, Effector). It tries to put together the flow, the 
"store" breakup philosophy of Effector and the syntax simplicity of MobX, while being minimalistic and having custom-elements in mind as its first
citizens. The main features are:

- It's tiny, only about 5 kB minified (and 1.9 kB g-zipped).
- It uses Proxy under the hood for a little :sparkler:
- It is meant for custom-elements.
- Supports [Lit-Element](https://www.npmjs.com/package/lit-element).
- Works with Vanilla-Js or frameworks like [Brick](https://www.npmjs.com/package/brick-element).
- Implements the usual flow: **ACTION**->**REDUCER**->**STORE** but with A LOOOOT less painful syntax.
- You can break the STORE in parts as small as you like.
- Works with async out of the box.
- Saves the state to ``localStorage`` automatically.

If you are not familiar with the ACTION->REDUCER->STORE pattern and why is a good idea, have a look at the [Redux Docs](https://redux.js.org/introduction/core-concepts) where it is very well explained.


# Demos

[Simple to-do App demo](https://webcomponenthelpers.github.io/ImperaJS/demo/litDemo.html) made with **ImperaJs** and **Lit-Element**.

While [here](https://webcomponenthelpers.github.io/ImperaJS/demo/) the same demo made with **Brick-Element** instead.


# Quick Links

- [Getting Started](#getting-started)
- [State Variables](#state-variables)
- [Local State Transitions](#local-state-transitions)
- [Global State Transitions](#global-state-transitions)
- [State Mixins](#state-mixins)
- [Usage With Lit-Element](#usage-with-lit-element)


# Getting Started

Of course... new framework, new sets of names for the same things... So let's first get the naming right:

- Here the closest thing to the Redux **STORE** we call it **StateVariable**
- The equivalent of a Redux **ACTION + REDUCER** we call it **StateTransition**

So basically the state of your App is kept by **State-Variables** (which do a little bit more than just keeping the state, but we'll see),
while a transition from one app state to another is implemented by **State-Transitions**, hope it makes sense so far... 
State-Variables and Transitions can be hooked to custom-elements, so that on StateVariable change, or on dispatch of a Transition, the custom-element 
can apply its own UI-related changes.

## Install

```bash
npm i impera-js
```

## State Variables
A StateVariable hold the state of the App, its content can be a String, Object, Number and Boolean. Its **DEFAULT**  value is passed at creation time and defines the type of the variable, the type cannot be changed later. A StateVariable is automatically stored in **localStorage**, if a value already exist it is automatically loaded. You can have a look at [a more complete example here](https://github.com/WebComponentHelpers/ImperaJS/blob/master/demo/Store.js).

```js
import {StateVariable} from 'impera-js'

// Initialization to an empty list
var todos = new StateVariable("todos",[]);

// Attach/Detach watchers
// Target is a custom-element and the callback is a function 
// that modify its UI (it will work with any object really)
todos.attachWatcher( target:HTMLElement, callback:Function )
todos.detachWatcher( target:HTMLElement )

// modifying the state is easy,
// this will fire the watchers callbacks
todos.value.push({txt:"first todo", isComplete:false})

// Note that **value** returns a proxy!
// this will also fire the watchers callbacks
let myProxy = todos.value[0]
myProxy.txt = "modified todo" 

```
The property **value** of a StateVariable returns a proxy to the content of the ``StateVariable``, whenever it is set (directly or indirectly using Array.push for example) will run the callback for all watchers.


## Local State Transitions
Transitions must be **Pure Functions**, they only compute a final state, they are defined by initial state and input data only, they reproduce always the same result for same inputs.
Here below we are talking about ``local`` state transition, i.e. related to a single ``StateVariable``, but technically there is very little difference 
with the [global](#global-state-transition) ones.

```js

// Adding a Transition to a StateVariable
todos.addTransition("addTodo",(text)=>{
    let todo = {txt : text, isComplete : false}
    todos.value.push(todo)
})


// State change via transition
// this will fire the watchers callbacks
todos.applyTransition("addTodo", "new Todo")


// Note that now this will throw, this is to make 
// sure one can only change state by defined transitions
todos.value.push(some_todo)

// this protection can be overridden
todos.allowStandaloneAssign = true
todos.value.push(some_todo) // now will not throw

```
The idea here is that once you add a transition to a StateVariable you limit its allowed change space, the framework makes sure that now you are only allowed to change the StateVariable via transitions. You can of course override this behavior with the ``allowStandaloneAssign`` property.
Note that transition owned by a state variable will bind **this** to the state variable itself, however make sure to use a named function then and NOT an arrow function as in the example.

## Global State Transition

```js
import {StateTransition} from 'impera-js'

// Global transitions definition
var removeTodo = new StateTransition("removeTodo",(index)=>{
    todos.value.splice(index,1)
    
    // any other StateVariable change can go below here
    // ....
});

// Dispatch the transition, and call watchers callbacks.
// Watcher can be attached in same way as for StateVariable
removeTodo.applyTransition( 1 )

```
A global StateTransition is a global function that is meant to apply simultaneously an overall state change, this can be made of just one variable change or multiple StateVariable changes at the same time, so that the initial and final states are always well defined, it guarantees that UI updates are made at transition completion (final state) only.


## State Mixins
The StateMixins are a way to attach custom-element callbacks to a StateVariable or a StateTransition in an easy way. The callbacks get attached and detached automatically when the custom-element is connected/disconnected from the DOM.

```js
import {statesMixin} from 'impera-js'

// Mixin applied to generic custom-element
class myTodo extends statesMixin([todos,removeTodo], HTMLElement){
    constructor(){
        super()
        
        // the element has a read-only prop connected 
        // to each StateVariable in the list above
        let myTodos = this.todos[0]
        // This property is safe to use, you cannot 
        // modify the state accidentally.
        myTodos.txt = "new todo"  // this will throw
    }
    
    // override callback that fires on "todos" changes
    on_todos_update(){
        // do something to update the UI
    }
    
    // override callback that fires on transition "removeTodo"
    on_removeTodo(){
        // do something here
    }

    onclick(){
        // the element now has a hook to all transition of 
        // states in the list.
        this.applyTransition("addTodo", "new todo")
        this.applyTransition("removeTodo", 1 )
    }
}

```
For any **StateVariable** in the list a read-only property named as the StateVariable will be added to the element. Also an **applyTransition** method to dispatch the added transitions (either of a StateVariable or of a global StateTransition) will be added. Callbacks to react on StateVariable change needs to be overwritten by the user and have a predefined naming scheme: **on_"stateVarName"\_update**. Callbacks to react to transitions are instead called **on_"stateTransitionName"**, in the latter case also the transition input data are passed.

## Usage with Lit-Element

The usage with Lit-Element is very similar to what shown above, with the exception that 
each update of any StateVariable or dispatch of Transition will request a render of the element. You can have a look at [a more complete example here](https://github.com/WebComponentHelpers/ImperaJS/blob/master/demo/litWebComponents.js), while a demo can be found [here](https://webcomponenthelpers.github.io/ImperaJS/demo/litDemo.html).

```js
import {litStatesMixin} from 'impera-js'

class myTodo extends litStatesMixin([todos,removeTodo],LitElement){
    
    static get properties() { return { index: Number } }
    
    render(){
        return html`
            <span @click="${this.toggle}">
                ${this.todos[this.index].isComplete === "true" ? "Done" : "Pending"}
            </span>
            <span class="text">${ this.todos[this.index].txt }</span>
            <a class="tag is-delete is-light" @click="${this.remove}"></a>
            </div>
        `;
    }
    toggle(){
        this.applyTransition("toggleTodo",this.index);
    }
    remove(){
        this.applyTransition('removeTodo',this.index)
    }
}

customElements.define("my-todo",myTodo);

```
Note the ``this.todos[...]``, a read only property with the name of the StateVariable has been added to the element, this is again a 
safe property to use: it cannot change the state of the app, it's just a getter. As above, also the transitions are added to the element.
