import {StateVariable} from '../build/impera.js'

export var todos = new StateVariable("todos",[]);

todos.addTransition("addTodo",(text)=>{
    if(typeof text === "string"){
        let todo = {txt : text, isComplete : false}
        todos.value.push(todo)
    }
})

todos.addTransition("removeTodo", (index)=>{
    let _int = parseInt(index)
    todos.value.splice(_int,1)
})

todos.addTransition("toggleTodo",(index)=>{
    let todo = todos.value[index]
    todo.isComplete = todo.isComplete ? false : true
})
