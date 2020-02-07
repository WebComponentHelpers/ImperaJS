import {brick as html,templateme,dfn} from 'https://webcomponenthelpers.github.io/Brick/brick-element.js'



async function with_bulma(){
   // fetching bulma -  is a bit dirty, but hey is just a demo ;)
   let response = await  fetch('https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css');
   let txt = await response.text();
   const bulma =  templateme`<style>${txt}</style>`



   let mxn_input = html` 
        ${bulma}

        <div class="columns is-centered">
        <div class="field has-addons ">
        <div class="control">
          <input ${"#-inpt"}class="input" type="text" placeholder="Todo Text">
        </div>
        <div class="control">
          <a ${"#-btn"} class="button  is-info">
            Add Todo
          </a>
        </div>
        </div>
        </div>
    `;

    dfn("my-input", class extends mxn_input(HTMLElement){
        constructor(){
            super();
            this.ids.btn.onclick = this.add_todos.bind(this);
        }
        add_todos(){
            //this.applyTransition("addTodo",this.ids.inpt.value);
            console.log(this.ids.inpt.value);
        }
    });


    let mxn_container = html`
        ${bulma}
        <style>
            div.box{
                margin:20% auto;
                max-width: 30rem;
            }            
            .withmargin{
                margin-top:2rem;
            }
        </style>
        <div class ="box" style="padding:3rem">
                <slot name="head"></slot>
         <div class="withmargin" >
                <slot></slot>
        </div>
        </div>
    `;
    dfn("my-container", class extends mxn_container(HTMLElement){
        on_todos_change(val){
            this.innerHTML = "";
            this.todos.forEach(function(todo,index){
                let temp= document.createElement("my-todo");
                temp.ingestData(todo);
                /*index = index;
                temp.text = todo.text
                temp.isDone = todo.isDone;*/
                this.appendChild(temp);
            });
        }
    });

    let mxn_todo = html`
        ${bulma}
        
        <div class="tags has-addons is-centered" style="margin-bottom:0rem">
            <span ${"#-status"} class="tag is-warning" onclick="this.root.toggle.bind(this.root)">Pending</span>
            <span ${"#-text"} class="tag is-info">Todo text</span>
            <a class="tag is-delete is-light"></a>
        </div>
        ${"|*index|isDone|text*|"}
    `;
    
    dfn("my-todo", class extends mxn_todo(HTMLElement){
        on_text_change(val){
            this.ids.text.innerText = val;
        }
        on_isDone_change(val){
            this.ids.innerText = (val === "true") ? "Done" : "Pending";
        }
        toggle(){
            this.applyTransition("toggleTodo",this.index);
        }
    });
}


with_bulma();