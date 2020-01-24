import {StateVariable, StateTransition} from "./stateElement.js"

// FIX:
// - Add check for variable name if already exist don't make a new one
// - Add a new tree and new var to loaded_state_map at creation time
// - do checks for types
// - add possibility to specify foreign key with syntax (maybe ! or *name*)
// - add possibility to distinguish between tree and var with (+)

/** 
 * Map of all tree and stateVariable that have been hydrated. 
 * This is used for easy access to variable pointers having their name,
 * it is necessary for data binding and the foreign keys strategy.
 * */ 
export var loaded_state_map = new Map<string,StateVariable|StateTree> ();

interface _info {
    tree_name : string
    schema:{ [key:string]: (string | string[]) }
}

/**
 * Container class for structure, collect and easy access your data. 
 * It provides pointers to stateVariables and persist the data structure.
 */
export class StateTree {
    
    [key:string] : (StateVariable | StateTree | _info |Function)
    _info : _info

    constructor(Name:string){
        this._info = { 
            tree_name : Name,
            schema : {}
        };
    }
    
    // Ingestion
    AddLeaf(name:string, value:(object|string|number)):void{
        let var_name =  this._info.tree_name + "." + name;
        this[name] = new StateVariable(var_name,value);
        this._info.schema[name] = "_." + name;
        loaded_state_map.set(var_name, <StateVariable>this[name]);
    }

    AddForeign(item:StateVariable|StateTree){
        let full_path = "";
        if(item instanceof StateVariable) full_path = item.name;
        else full_path = item._info.tree_name;

        let var_name = full_path.split(".").pop();
        this[var_name] = item;
        this._info.schema[var_name] = full_path;
        if(!loaded_state_map.has(full_path))loaded_state_map.set(full_path, item);
    }

    /**
     * Creates a new tree in the target one
     * @param name sub-name of the new tree
     * @param value content, must be an object of variable name:values or if foireign key name:"full_path_to_foreign_var_or_tree"
     * @param fkeys 
     */
    AddBranch(name:string, value:object, fkeys?:string[]){
        let tree_name =  this._info.tree_name + "." + name;
        let new_tree = StateTree.Branch(tree_name,value,fkeys);
        this[name] = new_tree;
    }

    static Branch(full_name:string,value:object, fkeys?:string[]):StateTree{
        
        let new_tree = new StateTree(full_name);

        for(let [key,val] of Object.entries(value)){
            if(typeof fkeys !== 'undefined' && fkeys.includes(key)) {
                let foreign_tree_or_var = loaded_state_map.get(val);
                if(foreign_tree_or_var){
                    new_tree[key] = foreign_tree_or_var;
                    new_tree._info.schema[key] = val;
                }
            }
            else {
                new_tree.AddLeaf(key,val);
            }
        }
        loaded_state_map.set(full_name,new_tree);
        return new_tree;
    }
    
    // Serialize

    // Hydratate

}