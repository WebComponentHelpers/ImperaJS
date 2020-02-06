# ImperaJS

Tiny, Proxy based, custom-elements centric App State Managment.

# Main Features

I know what you are thinking... Yet another framework, hurray!

This library is inspired to State Managment frameworks that we all know (Redux, MobX, Effector). It tries to put togheter the flow, the 
"store" breakup philosophy of Effector and the sintax simplicity of MobX, while being minimalistic and having costom-elemnts in mind as its first
citizens. The main features are:

- It's tiny, only about 5 kB minified (and 1.9 kB gzipped).
- It uses Proxy under the hood for a little :sparkler:
- It is meant for custom-elements, so you can use it with vanilla JS or any framework like [lit-element](https://www.npmjs.com/package/lit-element), [Brick](https://www.npmjs.com/package/brick-element).
- Implements the usual flow: ACTION->REDUCER->STORE but with A LOOOOT less painfull sintax.
- You can break the STORE in parts as small as you like.
- Works with async out of the box.
- It is tested.

# Getting Started

Of course... new framework, new sets of names for the same things... So let's first get the namings right:

- Here the clostest thing to the Redux **STORE** we call it **StateVariable**
- The equivalent of a Redux **ACTION + REDUCER** we call it **StateTransition**

So basically the state of your App is kept by **State-Variables** (which do a little bit more than just keeping the state, but we'll see),
while a transition from one app state to another is implemented by **State-Transitions**, hope it makes sense so far... 
State-Variables and Transitions can be hooked to custom-elements, so that on StateVarible change, or on dispatch of a Transition, the custom-element 
can apply its own UI-related changes.

### StateVariables


```js
// init
```

```js
// note is a proxy 
let myProxy = var.value.whatever
myProxy = 9  // this change the variable and run side-effects
```

```js
// Attach/Detach watchers
```

### StateTransitions


### StateMixin

