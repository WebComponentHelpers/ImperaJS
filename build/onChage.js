/*MIT License

OnChange Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> , improved by Rodrigo Solís (https://github.com/sorodrigo)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
export default (object, onChange) => {
    const BLACKLIST = [
        'sort',
        'reverse',
        'splice',
        'pop',
        'unshift',
        'shift',
        'push'
    ];
    let blocked = false;
    const handler = {
        get(target, property, receiver) {
            try {
                return new Proxy(target[property], handler);
            }
            catch (err) {
                return Reflect.get(target, property, receiver);
            }
        },
        defineProperty(target, property, descriptor) {
            const res = Reflect.defineProperty(target, property, descriptor);
            if (!blocked) {
                onChange();
            }
            return res;
        },
        deleteProperty(target, property) {
            const res = resReflect.deleteProperty(target, property);
            if (!blocked) {
                onChange();
            }
            return res;
        },
        apply(target, thisArg, argumentsList) {
            if (BLACKLIST.includes(target.name)) {
                blocked = true;
                const res = Reflect.apply(target, thisArg, argumentsList);
                onChange();
                blocked = false;
                return res;
            }
            return Reflect.apply(target, thisArg, argumentsList);
        }
    };
    return new Proxy(object, handler);
};
// --------------------------------------- FINISHED onChange ------------------------------------------------------------------ //
