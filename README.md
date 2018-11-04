# StateElement

This tiny library (2Kb) uses **DOM Events** as a messanger for state change. The working filosofy si very similar to the one of Reddux or Flux (nothing new here), but tries to use the DOM capabilities as much as possible. Reddux for example had to re-implement the Event structure since it's only possible to attach listeners (or dispatch events) to DOM elements, **webcomponents** live in the DOM so they can leverage this functionality for free.

### Few Features:

 - It makes very easy to implement two-way data-bindings between components, which are as well managed via DOM events.
 - Uses localStorage as app state storage, and all change in state are immediately written to the store, so that state persistence comes for free.
 - It only updates what changes: no non-sense "all the world" update-callback like Reddux. Each element registers for the "actions" it wants to listen for and the callbacks are runned from a list of subscribers.
 - It is FAST: using DOM events allows it to be quite fast compared to virtual DOM updates (some tuning is needed but it is already faster than a lit-element).
 - For a few reasons it does not implement the fancy "time-travel" functionality as Reddux, altough I like it...
 
 
