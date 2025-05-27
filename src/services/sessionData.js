import { publish, subscribe } from "./pubSub";
class SessionData {
    constructor() {
        if (!SessionData._instance) {
            SessionData._instance = this;
        }
        return SessionData._instance;
    }
    _data = {};
    subscriber;
    static getSessionDataInstance() {
        return this._instance ? this._instance : new SessionData();
    }
    setData = (dataObj, shouldPublish = false) => {
        if (dataObj.constructor.name !== "Object") {
            throw new Error("Ony object types are allowed");
        }
        const inpData = { ...dataObj };
        const inpKeys = Object.keys(inpData);
        for (let i = 0; i < inpKeys.length; i++) {
            if (inpData[inpKeys[i]] === undefined) {
                this._data[inpKeys[i]] = undefined;
            } else if (inpData[inpKeys[i]].constructor.name === "Array") {
                this._data[inpKeys[i]] = Array.from(inpData[inpKeys[i]]);
            } else if (inpData[inpKeys[i]].constructor.name === "Object") {
                this._data[inpKeys[i]] = Object.assign({}, inpData[inpKeys[i]]);
            } else {
                this._data[inpKeys[i]] = inpData[inpKeys[i]];
            }
            if (shouldPublish) {
                publish(inpKeys[i], inpData[inpKeys[i]]);
            }
        }
    };
    getData = key => {
        if (!key) {
            return Object.assign({}, this._data);
        }
        if (key.constructor.name === "Array") {
            let values = {};
            for (let i = 0; i < key.length; i++) {
                values[key[i]] = this._data[key[i]];
            }
            return Object.assign({}, values);
        }
        return this._data[key];
    };
    removeData = key => {
        if (this._data.hasOwnProperty(key)) {
            delete this._data[key];
        }
    };
    dropData = () => {
        this._data = {};
    };
    subscribeToSessionDataChange = (key, callback) => {
        this.subscriber = subscribe(key, callback);
        return this.subscriber;
    };
}
export default SessionData;
