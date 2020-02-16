import {todos} from './Store.js'
import {LitElement, css, html, unsafeCSS} from 'https://unpkg.com/lit-element?module';
import {litStatesMixin} from '../build/impera.js'


async function with_bulma(){
    // fetching bulma -  is a bit dirty, but hey is just a demo ;)
    let response = await  fetch('https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css');
    let txt = await response.text();
    const bulma_lit =  css`${unsafeCSS(txt)}`

/**
 * Input field, note the mixin applied to class LitElement
 */
class myInput extends litStatesMixin([todos],LitElement){
    static get styles() { return bulma_lit; }

    render(){
        return html`
        <div class="columns is-centered">
            <div class="field has-addons ">
                <div class="control">
                    <input id="inpt" class="input" type="text" placeholder="Todo Text">
                </div>
                <div class="control">
                    <a class="button  is-info" @click="${this.add_todos}"> Add Todo </a>
                </div>
            </div>
        </div>
        `;
    }

    constructor(){
        super();
        this.onkeydown = (function (e){ if(e.which === 13) this.add_todos()}).bind(this)
    }

    add_todos(){
        let inpt = this.shadowRoot.querySelector("#inpt")
        if(inpt.value !== ""){
            this.applyTransition("addTodo",inpt.value);
            inpt.value = "";
        }
    }
} 

customElements.define("my-input",myInput);

/**
 * Todo element, this is a simple tag to change state of each single todo.
 * To change state we use ApplyTransition.
 */
class myTodo extends litStatesMixin([todos],LitElement){
    static get styles() {
        return [bulma_lit, css`#status {cursor:pointer;}`];
      }
    static get properties() {
        return { 
            index: Number,
            iscomplete : Boolean,
            txt : String
         };
      }
    render(){
        return html`
            <div class="tags has-addons is-centered" style="margin-bottom:0rem">
            <span id="status" class="tag ${this.iscomplete === "true"? 'is-success' : 'is-warning'}" @click="${this.toggle}">
                ${this.iscomplete === "true" ? "Done" : "Pending"}
            </span>
            <span class="tag is-info">${this.txt}</span>
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

/**
 * Container class that gets updated each time the todos State variable changes or any transition is fired.
 * It shows a list of todos.
 */
class myContainer extends litStatesMixin([todos],LitElement){
    static get styles() {
        return [bulma_lit, css`.withmargin{margin-top:2rem;}`];
    }
    render(){
        return html`
        <div class="container">
            <span class="subtitle is-4 has-text-info"> ImperaJs</span> <span class="subtitle is-4">Todo App</span>
            <div class ="box" style="padding:3rem">
                <slot name="head"></slot>
                <div class="withmargin" >
                    <div> ${this.todos.map((todo,index)=> html`<my-todo index="${index}" txt="${todo.txt}" iscomplete="${todo.isComplete}"></my-todo>`)}</div>
                </div>
            </div>
        </div>
        `;
    }
}
customElements.define("my-container",myContainer);

};

with_bulma();
