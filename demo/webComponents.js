import {brick as html,templateme,dfn} from 'https://webcomponenthelpers.github.io/Brick/brick-element.js'
import {todos} from './Store.js'
import {statesMixin} from '../build/impera.js'


async function with_bulma(){
    // fetching bulma -  is a bit dirty, but hey is just a demo ;)
    let response = await  fetch('https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css');
    let txt = await response.text();
    const bulma =  templateme`<style>${txt}</style>`
 
// dummy class with state mixin
class StateElement extends statesMixin([todos],HTMLElement){}


let mxn_input = html` 
    ${bulma}

    <div class="columns is-centered">
        <div class="field has-addons ">
            <div class="control">
                <input ${"#-inpt"}class="input" type="text" placeholder="Todo Text">
            </div>
            <div class="control">
                <a ${"#-btn"} class="button  is-info"> Add Todo </a>
            </div>
        </div>
    </div>
`;
/**
 * Input field, note we inherith from StateElement classs
 */
dfn("my-input", class extends mxn_input(StateElement){
        constructor(){
            super();
            this.ids.btn.onclick = this.add_todos.bind(this);
            this.onkeydown = (function (e){ if(e.which === 13) this.add_todos()}).bind(this)
        }
        add_todos(){
            if(this.ids.inpt.value !== ""){
                this.applyTransition("addTodo",this.ids.inpt.value);
                this.ids.inpt.value = "";
            }
        }
});




let mxn_todo = html`
    ${bulma}
    <style>
        #status {
            cursor:pointer;
        }
    </style>

    <div class="tags has-addons is-centered" style="margin-bottom:0rem">
        <span ${"#-status"} class="tag is-warning" onclick="this.root.toggle()">Pending</span>
        <span ${"#-text"} class="tag is-info">Todo text</span>
        <a class="tag is-delete is-light" onclick="this.root.applyTransition('removeTodo',this.root.index)"></a>
    </div>

    ${"|*index|iscomplete|txt*|"}
`;
/**
 * Todo element, this is a simple tag to change state of each single todo.
 * To change state we use ApplyTransition.
 */    
dfn("my-todo", class extends mxn_todo(StateElement){
        update_txt(val){
            this.ids.text.innerText = val;
        }
        update_iscomplete(val){
            if(val === "true"){
                this.ids.status.innerText = "Done";
                this.ids.status.classList.remove("is-warning")
                this.ids.status.classList.add("is-success")
            }
            else {
                this.ids.status.innerText = "pending";
                this.ids.status.classList.remove("is-success")
                this.ids.status.classList.add("is-warning")
            }
            
        }
        toggle(){
            this.applyTransition("toggleTodo",this.index);
        }
});

let mxn_container = html`
    ${bulma}
    <style>
        .withmargin{
           margin-top:2rem;
        }
    </style>
    <div class="container">
        <span class="subtitle is-4 has-text-info"> ImperaJs</span> <span class="subtitle is-4">Todo App</span>
        <div class ="box" style="padding:3rem">
            <slot name="head"></slot>
            <div class="withmargin" >
                <div ${"#-content"}></div>
            </div>
        </div>
    </div>
`;
/**
 * Container class that gets updated each time the todos State variable changes, this includes stateTransitions.
 * It shows a list of todos.
 */
dfn("my-container", class extends mxn_container(StateElement){
        on_todos_update(val){
            let todos_content = this.ids.content
            todos_content.innerHTML = "";
            this.todos.forEach(function(todo,index){
                let temp= document.createElement("my-todo");
                temp.index = index;
                temp.txt = todo.txt;
                temp.iscomplete = todo.isComplete;
                todos_content.appendChild(temp);
            });
        }
});

};

with_bulma();
