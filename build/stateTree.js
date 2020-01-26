import { StateVariable } from "./stateElement.js";
// FIX:
// - Add a new var to loaded_state_map at creation time
/**
 * Map of all tree and stateVariable that have been hydrated.
 * This is used for easy access to variable pointers having their name,
 * it is necessary for data binding and the foreign keys strategy.
 * */
var loaded_state_map = new Map();
export class stateRegistry {
    static get(path) {
        if (typeof path === "string")
            return loaded_state_map.get(path);
        else
            return null;
    }
    static set(path, item) {
        console.log("path: ", path);
        console.log("typeof path: ", typeof path);
        if (typeof path !== "string")
            throw "StateRegistry - path " + path + " must be a string";
        if (loaded_state_map.has(path))
            throw "StateRegistry - path " + path + " already exist";
        loaded_state_map.set(path, item);
    }
    static delete(path) {
        return loaded_state_map.delete(path);
    }
}
/**
 * Container class for structure, collect and easy access your data.
 * It provides pointers to stateVariables and persist the data structure.
 */
export class StateTree {
    constructor(Name) {
        this._info = {
            tree_name: Name,
            schema: {}
        };
    }
    // Ingestion
    AddLeaf(name, value) {
        let var_name = this._info.tree_name + "." + name;
        this[name] = new StateVariable(var_name, value);
        this._info.schema[name] = "_." + name;
        stateRegistry.set(var_name, this[name]);
    }
    AddForeignAs(item, key) {
        if (item) {
            let full_path = "";
            if (item instanceof StateVariable)
                full_path = item.name;
            else
                full_path = item._info.tree_name;
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
    AddBranch(name, value, fkeys) {
        let tree_name = this._info.tree_name + "." + name;
        let new_tree = StateTree.newTree(tree_name, value, fkeys);
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
    static newTree(full_name, data, fkeys) {
        let new_tree = new StateTree(full_name);
        for (let [key, val] of Object.entries(data)) {
            if (typeof fkeys !== 'undefined' && fkeys.hasOwnProperty(key)) {
                new_tree.AddForeignAs(stateRegistry.get(fkeys[key] + "." + val), key);
            }
            else if (key.substr(-1) === "*") {
                new_tree.AddForeignAs(stateRegistry.get(val), key.substr(0, key.length - 1));
            }
            else if (key.substr(-1) === "+") {
                new_tree.AddBranch(key.substr(0, key.length - 1), val);
            }
            else {
                new_tree.AddLeaf(key, val);
            }
        }
        stateRegistry.set(full_name, new_tree);
        return new_tree;
    }
}
