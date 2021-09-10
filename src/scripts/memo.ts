export default function (
  limit: number,
  name?: string,
): {
  memos: { [key: string]: any }
  limit: number
  set: (key: string, value: any) => void
  get: (key: string) => any
  updateProp: (
    key: string,
    prop: string,
    newData: any,
  ) => void
  delete: (key: string) => void
  all: () => any[]
} {
  return {
    memos: {},
    limit,
    set: function (key: string, value: any) {
      this.memos[key] = { value, memoAddedTime: Date.now() }
      if (
        !this.limit ||
        Object.keys(this.memos).length <= this.limit
      )
        return
      const oldest: any = Object.keys(this.memos).reduce(
        (oldest, current) =>
          this.memos[current].memoAddedTime <
          oldest.memoAddedTime
            ? {
                memoAddedTime:
                  this.memos[current].memoAddedTime,
                key: current,
              }
            : oldest,
        { memoAddedTime: Date.now() },
      )
      if (oldest.key) delete this.memos[oldest.key]
    },
    get: function (key) {
      const found = this.memos[key]
        ? this.memos[key].value
        : undefined
      if (found) delete found.memoAddedTime
      return found
    },
    updateProp: function (key: string, prop, newData) {
      const found = this.memos[key]
        ? this.memos[key].value
        : undefined
      if (found && typeof found === `object`)
        found[prop] = newData
      return found
    },
    delete: function (key) {
      delete this.memos[key]
    },
    all: function () {
      return Object.values(this.memos).map((v) => v.value)
    },
  }
}
