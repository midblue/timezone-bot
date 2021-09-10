"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(limit, name) {
    return {
        memos: {},
        limit,
        set: function (key, value) {
            this.memos[key] = { value, memoAddedTime: Date.now() };
            if (!this.limit ||
                Object.keys(this.memos).length <= this.limit)
                return;
            const oldest = Object.keys(this.memos).reduce((oldest, current) => this.memos[current].memoAddedTime <
                oldest.memoAddedTime
                ? {
                    memoAddedTime: this.memos[current].memoAddedTime,
                    key: current,
                }
                : oldest, { memoAddedTime: Date.now() });
            if (oldest.key)
                delete this.memos[oldest.key];
        },
        get: function (key) {
            const found = this.memos[key]
                ? this.memos[key].value
                : undefined;
            if (found)
                delete found.memoAddedTime;
            return found;
        },
        updateProp: function (key, prop, newData) {
            const found = this.memos[key]
                ? this.memos[key].value
                : undefined;
            if (found && typeof found === `object`)
                found[prop] = newData;
            return found;
        },
        delete: function (key) {
            delete this.memos[key];
        },
        all: function () {
            return Object.values(this.memos).map((v) => v.value);
        },
    };
}
exports.default = default_1;
