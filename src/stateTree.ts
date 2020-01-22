import {StateVariable, StateTransition} from "./stateElement"

export class StateTree {

    schema:{ [key:string]: (StateVariable | StateTree) }
    key2D:string
    items:object
    name : string

    constructor(Name:string){
        this.schema = {};
        this.key2D = "";
        this.name = Name;
    }
    Add(variable:(StateVariable | StateTree )):void{
        this.schema[variable.name] = variable;
    }
    AddList(name:string, variables:StateVariable[]){
        var tree = new StateTree(name);
        for( let v of variables){
            tree.Add(v);
        }
        this.schema[name] = tree;
    }
}