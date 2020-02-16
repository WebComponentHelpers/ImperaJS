import {StateVariable} from '../build/impera.js'

/**
 * List of todos, initialized empty
 */
export var todos = new StateVariable("todos",[]);

/**
 * Transition (pure function) that modify the list by adding a todo
 */
todos.addTransition("addTodo",(text)=>{
    if(typeof text === "string"){
        let todo = {txt : text, isComplete : false}
        todos.value.push(todo)
    }
})

/**
 * Transition (pure function) that modify the list by removing a todo
 */
todos.addTransition("removeTodo", (index)=>{
    let _int = parseInt(index)
    todos.value.splice(_int,1)
})

/**
 * Transition (pure function) that modify a todo by togling its completion state
 */
todos.addTransition("toggleTodo",(index)=>{
    let todo = todos.value[index]
    todo.isComplete = todo.isComplete ? false : true
})
