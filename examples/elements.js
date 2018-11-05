import {stateElement, StateVariable, statesMixin, stateBehaviour} from './stateElement.js';

// states definition
let counter = new StateVariable('counter','number', stateBehaviour.NORMAL);



class StateManager extends stateElement{

    constructor(){
        super();
        this.stateList = [counter];
    }

}
 customElements.define('state-manager', StateManager);



// Custom element with state connection!

class IndicatorElement extends 	statesMixin(HTMLElement, ['counter']){

    constructor(){
        super();
        this.innerHTML = '<h1 id="hey"> we got : ' + this.counter.toString() + ' </h1> by the way if click here I set it to 7';
        this.addEventListener('click', this.onclick);
        this.h1 = this.querySelector("#hey");
    }
    
    onclick(e){
        ////console.log('onclick fired');
        this.counter = 7;
    }
    on_update_counter(val){
        ////console.log('element is updating counter');
        this.h1.innerHTML = 'we got0 : ' + val.toString() ; 
    }

}

customElements.define('indicator-element', IndicatorElement);


class customInput extends 	statesMixin( HTMLElement, ['counter']){
    constructor(){
        super();
        this.innerHTML = '<input id="hey" placeholder="write a number here and enter..."></input>'
    }
    on_update_counter(val){
        ////console.log('element is updating counter');
        let inpt = this.querySelector('#hey');
        inpt.value = val.toString() ; 
    }

    connectedCallback(){
        ////console.log('custom input connetcetd callback');
        super.connectedCallback();
        ////console.log('custom input connetcetd callback: adding now listener');
        let inpt = this.querySelector('#hey');
        inpt.addEventListener('keyup',(event)=>{
            if(event.keyCode === 13) this.counter = Number(inpt.value) ;    
        });
    }
}
customElements.define('custom-input', customInput);


class customButton extends 	statesMixin( HTMLElement, ['counter']){
    constructor(){
        super();
        this.innerHTML = '<button id="bnt">click me to increment!</button>'
    }
    on_update_counter(val){
        ////console.log('element is updating counter: do nothing');
    }

    connectedCallback(){
        super.connectedCallback();
        let bnt = this.querySelector('#bnt');
        bnt.addEventListener('click',(event)=>{
            ////console.log(typeof(this.counter));
            if(this.counter !== null) this.counter = this.counter + 1;    
        });
    }
}
customElements.define('custom-button', customButton);


class customButton2 extends 	statesMixin( HTMLElement, ['counter']){
    constructor(){
        super();
        this.innerHTML = '<button id="bnt">click me to run!</button>'
    }
    on_update_counter(val){
        ////console.log('element is updating counter: do nothing');
    }

    connectedCallback(){
        super.connectedCallback();
        let bnt = this.querySelector('#bnt');
        bnt.addEventListener('click',(event)=>{
            window.setInterval( () => {
                if(this.counter !== null) this.counter = this.counter + 1;
            }, 20);
            
        });
    }
}
customElements.define('custom-button2', customButton2);