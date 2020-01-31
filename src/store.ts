import {StateTree} from './stateTree.js'
import {StateVariable,variable_values} from './stateElement.js'


// this is a private map of pointer to engines
var _store_map = new Map<String,StorageEngine>();

/**
 * Static Class that allows access to all registered StorageEngines.
 * A storage engine must register using this class to be available to StateVariables.
 * A StateVariable can then use any registered StorageEngine, it will use the default 
 * if not defined otherwise. 
 */
export class Store{

    static setDefaultEngine(engine: StorageEngine){
        _store_map.set("default",engine);
        Store.addEngine(engine);
    }

    static addEngine(engine: StorageEngine){
        if(_store_map.size === 0 ) {
            Store.setDefaultEngine(engine);            
        }
        else if(_store_map.has(engine.name)) throw "Engine " + engine.name + " already in store"
        _store_map.set(engine.name,engine);
    }

    static getDefaultEngine():StorageEngine{
        var engine = _store_map.get("default");
        if(engine === undefined) throw "Default engine undefined";
        else return engine;
    }

    static getEngine(name:String){
        var engine = _store_map.get(name);
        if(engine === undefined) throw "Engine " + name + " is undefined";
        else return engine;
    }

    static getItem(path:string):StateVariable|StateTree{
        for(const engine of _store_map.values()){
            if(engine.hasItem(path)) return engine.getItem(path);
        }
        return null;
    }
    static getTree(path:string):StateTree{
        for(const engine of _store_map.values()){
            if(engine.hasItem(path)) return engine.getTree(path);
        }
        return null;
    }
    static getVar(path:string):variable_values{
        for(const engine of _store_map.values()){
            if(engine.hasItem(path)) return engine.getVar(path);
        }
        return null;
    }
    

    static whoHasItem(path:string):string {
        for(const engine of _store_map.values()){
            if(engine.hasItem(path)) return engine.name;
        }
        return "";
    }

}

/**
 * Interface that a Storage Engine must fullfill to be able to interact with StateVariables
 * and StateTrees.
 */
export interface StorageEngine {
    name :string
    registerItem:{(path:string, item:(StateTree|StateVariable)):void}
    getTree : {(path:string):StateTree}
    getVar : {(path:string):variable_values}
    getItem: {(path:string):StateTree|StateVariable}
    deleteItem : {(path:string):Boolean}
    hasItem: {(path:string):Boolean}
}


export class LocalStorageEngine implements StorageEngine{

    name:string
    errorScope:string

    /** 
    * Map of all tree and stateVariable that have been hydrated. 
    * This is used for easy access to variable pointers having their name,
    * it is necessary for data binding and the foreign keys strategy.
    * */ 
    loaded_state_map : Map<string,StateVariable|StateTree> 

    constructor(Name:string){   
        this.name = Name || "LocalStorage";
        this.loaded_state_map = new Map<string,StateVariable|StateTree>();
        this.errorScope = "StorageEngine - "+ this.name;
    }
    

    registerItem (path: string, item: StateTree | StateVariable) :void{

        if(typeof path !== "string") throw this.errorScope + " - path " + path + " must be a string";
        
        let who = Store.whoHasItem(path);
        if(who !== "") throw  this.errorScope + " - path " + path + " already exist in Engine: " + who;
        
        this.loaded_state_map.set(path, item);       
    }

    getItem (path: string) : StateTree | StateVariable{
        if(typeof path !== "string") return null;
        return this.loaded_state_map.get(path);
    }

    getTree (path: string) : StateTree {
        if(typeof path !== "string") return null;
        let item = this.loaded_state_map.get(path);
        if(item instanceof StateTree) return item;
        else throw this.errorScope + " unmatching type to path";
    }

    getVar(path:string):variable_values{
        return 7;
    }

    deleteItem (path: string) : Boolean{
        if(typeof path === "string")
            return this.loaded_state_map.delete(path);
        else return false;
    }

    hasItem(path: string) : Boolean{
        if(typeof path === "string")
            return this.loaded_state_map.has(path);
        else return false;
    }
}
