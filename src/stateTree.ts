import {StateVariable, StateTransition} from "./stateElement.js"

// FIX:
// - Add a new var to loaded_state_map at creation time
// - Always check type from user inputs, newTree() function for example
// - State Var need to connect to the Store, for load and save (decouple data binding from persistence)
// - Make typescript interface for the store
// - Static Tree possibility at startup time
// - create variable without knowing the type but guessing from store, need another optional argument, like "force" maybe
// - Three hydratating cases:
//      - User input --> to consider static, if try to change MUST throw, because if you run again the 
//        code you get data inconsitency. No hit to storage. No lazyload.
//      - Storage first --> Take always data from storage, if null then from user input when given. Here the root tree must always hit
//        the storage, then take a decision. Lazyload possible.
//      - Force input --> Always load input, but tree considered dynamic, can change (mostly usefull for the internal functions). No hit to storage.
//        No laziload.
// - StateTree default is lazyload
// - Hydratation pattern:
//      - if tree has property then return it, else { look in schema for pattern name, hit storage, retrive pointer to well formed var}
//      - if property is a tree, then is returned a pointer to an empty tree with only schema (lazy loading).
// - Future Storage may allow for bulk data retrival for performance tuning: look for saved pattern in the name,example we store all down tree "root.tree1",
//   want to load var "root.tree1.tree2.tree3.var1", you'll do varName.contains(saved_pattern) if yes access data using the pattern.
//   But probably better to load in bulk everything at that point.



/** 
 * Map of all tree and stateVariable that have been hydrated. 
 * This is used for easy access to variable pointers having their name,
 * it is necessary for data binding and the foreign keys strategy.
 * */ 
var loaded_state_map = new Map<string,StateVariable|StateTree> ();

export class stateRegistry{ 

    static get(path:string):(StateTree|StateVariable){
        if(typeof path === "string") return loaded_state_map.get(path);
        else return null;
    }

    static set(path:string, item:(StateTree|StateVariable)){
        console.log("path: ", path);
        console.log("typeof path: ", typeof path);

        if(typeof path !== "string") throw "StateRegistry - path " + path + " must be a string";
        
        if(loaded_state_map.has(path)) throw "StateRegistry - path " + path + " already exist";
        
        loaded_state_map.set(path, item);       
    }

    static delete(path:string):boolean{
        return loaded_state_map.delete(path);
    }
}

interface _info {
    tree_name : string
    schema:{ [key:string]: (string | string[]) }
}

interface foreignKeys {
    [key:string] : string
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
        stateRegistry.set(var_name, <StateVariable>this[name]);
    }

    AddForeignAs(item:StateVariable|StateTree, key?:string){
        if(item){
            let full_path = "";
            if(item instanceof StateVariable) full_path = item.name;
            else full_path = item._info.tree_name;

            let var_name = key || full_path.split(".").pop();
            this[var_name] = item;
            this._info.schema[var_name] = full_path;
        }
    }

    /**
     * Creates a new tree in the target one
     * @param name sub-name of the new tree
     * @param value content, must be an object of variable name:values or if foireign key name:"full_path_to_foreign_var_or_tree"
     * @param fkeys 
     */
    AddBranch(name:string, value:object, fkeys?:foreignKeys){
        let tree_name =  this._info.tree_name + "." + name;
        let new_tree = StateTree.newTree(tree_name,value,fkeys);
        this[name] = new_tree;
    }

    /**
     * StateTree builder. 
     * Syntax for ``data`` keys: if suffixed by "*" value is considered foreign key, if 
     * suffixed by "+" value object is considered as a sub-tree, else a StateVariable is added.
     * @param full_name Name of the tree, if sub tree, should include also parent tree name
     * @param data Object containing variable values, foreign keys and sub-trees. 
     * @param fkeys Overload way to define foreign key. ``fkeys`` keys that match ``data`` keys are interpreted as a foreign key, the values of this object
     * must be full path to foreign key except last bit, which is defined in ``data`` value. Usefull input method in case of
     * inputing data from a database.
     */
    static newTree(full_name:string,data:object, fkeys?:foreignKeys):StateTree{
        
        let new_tree = new StateTree(full_name);

        for(let [key,val] of Object.entries(data)){
            if(typeof fkeys !== 'undefined' &&  fkeys.hasOwnProperty(key)) {
                new_tree.AddForeignAs(stateRegistry.get( fkeys[key] + "." + val), key );
            }
            else if(key.substr(-1) === "*"){
                new_tree.AddForeignAs(stateRegistry.get( val ), key.substr(0, key.length -1));
            }
            else if(key.substr(-1) === "+"){
                new_tree.AddBranch(key.substr(0, key.length -1), val);
            }
            else {
                new_tree.AddLeaf(key,val);
            }
        }
        stateRegistry.set(full_name,new_tree);
        return new_tree;
    }

    
    // Serialize

    // Hydratate

}