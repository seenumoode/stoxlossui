let subscribers = {};
export function publish(key, data = {}) {
    if (!subscribers[key]) {
        return false;
    }
    subscribers[key].forEach(currentSubScriberCallback => {
        currentSubScriberCallback(data);
    });
}

export function subscribe(eventName, callback) {
    let index;
    if (!subscribers[eventName]) {
        subscribers[eventName] = [];
    } else {
        const cbs = subscribers[eventName];
        for (let i = 0; i < cbs.length; i++) {
            if (compareFunctionDefinition(callback, cbs[i])) {
                index = i;
                break;
            }
        }
    }
    if (!index) {
        index = subscribers[eventName].push(callback) - 1; // array.push gives new lenght, reducing 1 will give last index
    }
    return {
        unsubscribe() {
            subscribers[eventName].splice(index, 1);
        },
    };
}
function compareFunctionDefinition(fn1, fn2) {
    return getFnDefinitionInString(fn1) === getFnDefinitionInString(fn2);
}
function getFnDefinitionInString(fn) {
    const fnS = fn.toString(),
        start = fnS.indexOf("{") + 1,
        end = fnS.lastIndexOf("}");
    return fnS.substring(start, end);
}
