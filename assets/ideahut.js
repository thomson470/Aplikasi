const ideahut = () => {
  const EMAIL_REGEX =
    // eslint-disable-next-line no-control-regex
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

  /*
   * APPLY
   */
  const apply = (fx, ...args) => {
    if (isFunction(fx)) {
      return fx(...args)
    }
  }

  /*
   * DELAY
   */
  const delay = (value, callback, ...args) => {
    let timeout = setTimeout(function () {
      clearTimeout(timeout)
      apply(callback, ...args)
    }, value)
  }

  /*
   * THROW IF
   */
  const throwIf = (isTrue, message) => {
    if (true === isTrue) {
      throw new Error(message)
    }
  }

  /*
   * CALL IF
   */
  const callIf = (isTrue, fxTrue, fxFalse) => {
    if (true === isTrue) {
      if (isFunction(fxTrue)) {
        return fxTrue()
      }
    } else if (isFunction(fxFalse)) {
      return fxFalse()
    }
    return null
  }

  /*
   * RUN IF
   */
  const runIf = (isTrue, fxTrue, fxFalse) => {
    if (true === isTrue) {
      if (isFunction(fxTrue)) {
        fxTrue()
      }
    } else if (isFunction(fxFalse)) {
      fxFalse()
    }
  }

  /*
   * COPY
   */
  const copy = (object) => {
    return JSON.parse(JSON.stringify(object))
  }

  /*
   * WAIT
   * wait until condition=true
   */
  const WAIT = (retry, p) => {
    if (!p.isReady() && retry < p.retry) {
      let timeout = setTimeout(() => {
        clearTimeout(timeout)
        WAIT(retry + 1, p)
      }, p.delay)
    } else {
      if (retry < p.retry) {
        apply(p.onReady)
      } else {
        apply(p.onTimeout)
      }
    }
  }
  const wait = (p) => {
    let i = isObject(p) ? p : {}
    throwIf(!(isInteger(i.retry) && i.retry > 0), 'Invalid retry value: ' + i.retry)
    throwIf(!(isInteger(i.delay) && i.delay > 0), 'Invalid delay value: ' + i.delay)
    throwIf(!isFunction(i.isReady), 'Function isReady required')
    WAIT(0, i)
  }

  /*
   * VALIDATION
   */
  const isFunction = (o) => {
    return typeof o === 'function'
  }
  const isObject = (o) => {
    return Object.prototype.toString.apply(o) === '[object Object]'
  }
  const isDefined = (o) => {
    return typeof o !== 'undefined'
  }
  const isBoolean = (o) => {
    return typeof o === 'boolean'
  }
  const isString = (o) => {
    return typeof o === 'string'
  }
  const isNumber = (o) => {
    return typeof o === 'number'
  }
  const isInteger = (o) => {
    return Number.isInteger(o)
  }
  const isArray = (o) => {
    return Object.prototype.toString.apply(o) === '[object Array]'
  }
  const isEmail = (o) => {
    return isString(o) ? o.match(EMAIL_REGEX) : false
  }

  /*
   * UUID
   */
  const uuid = () => {
    let dt = new Date().getTime()
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = (dt + Math.random() * 16) % 16 | 0
      dt = Math.floor(dt / 16)
      return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return uuid
  }

  /*
   * MOBILE
   */
  const mobile = {
    waiter: {
      expiry: 120 * 1000, // kadaluarsa waiter.bridge -> untuk housekeeping
      bridge: {},
      watch: {},
      listener: {},
      done: {},
    },

    isConnected() {
      return isDefined(window?.webkit?.messageHandlers?.cordova_iab?.postMessage)
    },

    message(obj) {
      if (mobile.isConnected() && isObject(obj)) {
        let str = JSON.stringify(obj)
        window.webkit.messageHandlers.cordova_iab.postMessage(str)
      }
    },

    bridge(name, params) {
      if (mobile.isConnected()) {
        let bname = isString(name) ? name.trim() : ''
        throwIf('' === bname, 'Bridge name required')
        let now = new Date().getTime()
        let i = isObject(params) ? params : {}
        let v = {
          bridge: bname,
          callback: 'window.Ideahut.mobile.callback.bridge',
        }
        if (isObject(i.data)) {
          v.data = i.data
        }
        if (isFunction(i.onSuccess) || isFunction(i.onError)) {
          v.id = uuid()
          let w = {
            expiration: now + mobile.waiter.expiry,
            onSuccess: i.onSuccess,
            onError: i.onError,
            onFinish: i.onFinish,
          }
          mobile.waiter.bridge[v.id] = w
          Object.keys(mobile.waiter.bridge).forEach((id) => {
            if (mobile.waiter.bridge[id].expiration < now) {
              delete mobile.waiter.bridge[id]
            }
          })
        }
        if (isObject(i.listener) && !Object.keys(mobile.waiter.listener).length) {
          let listener = {
            exit: (data) => {
              mobile.waiter.listener = {}
              apply(i.listener.exit, data)
            },
          }
          let events = ['exit']
          Object.keys(i.listener).forEach((key) => {
            if ('exit' !== key && isFunction(i.listener[key])) {
              listener[key] = i.listener[key]
              events.push(key)
            }
          })
          mobile.waiter.listener = listener
          if (!isObject(v.data)) {
            v.data = {}
          }
          v.data._listener_ = {
            callback: 'window.Ideahut.mobile.callback.listener',
            events: events,
          }
        }
        if (isFunction(i.onDone)) {
          if (!isObject(v.data)) {
            v.data = {}
          }
          let id = uuid()
          v.data._done_id_ = id
          v.data._done_cb_ = 'window.Ideahut.mobile.callback.done'
          mobile.waiter.done[id] = {
            expiration: new Date().getTime() + mobile.waiter.expiry,
            onDone: i.onDone,
          }
          Object.keys(mobile.waiter.done).forEach((id) => {
            if (mobile.waiter.done[id].expiration < now) {
              delete mobile.waiter.done[id]
            }
          })
        }
        mobile.message(v)
      }
    },

    watch(name, params) {
      let i = isObject(params) ? params : {}
      throwIf(!isFunction(i.onWatch), 'Watch callback required')
      let v = {
        data: isObject(i.data) ? i.data : {},
      }
      v.data.onWatch = 'window.Ideahut.mobile.callback.watch'
      v.data.onStop = 'window.Ideahut.mobile.callback.stop'
      v.onSuccess = (data) => {
        let watchId = isString(data.watchId) ? data.watchId : ''
        if ('' !== watchId) {
          // register ke watch
          mobile.waiter.watch[watchId] = {
            entry: new Date().getTime(),
            onWatch: i.onWatch,
            onStop: i.onStop,
          }
          apply(i.onSuccess, data)
        } else {
          apply(i.onError, { code: 'WAT01', text: 'watchId unavailable' })
        }
      }
      v.onError = (data) => {
        apply(i.onError, data)
      }
      mobile.bridge(name, v)
    },

    callback: {
      bridge(result) {
        let request = isObject(result.request) ? result.request : {}
        let id = isString(request.id) ? request.id.trim() : ''
        if ('' !== id) {
          let waiter = mobile.waiter.bridge[id]
          delete mobile.waiter.bridge[id]
          if (isObject(waiter)) {
            apply(waiter.onFinish)
            let response = isObject(result.response) ? result.response : {}
            let data = response.data
            if (0 === response.status) {
              apply(waiter.onSuccess, data)
            } else {
              apply(waiter.onError, data)
            }
          }
        }
      },

      watch(id, data) {
        let waiter = mobile.waiter.watch[id]
        if (isObject(waiter)) {
          apply(waiter.onWatch, data)
        }
      },

      stop(id) {
        let waiter = mobile.waiter.watch[id]
        delete mobile.waiter.watch[id]
        if (isObject(waiter)) {
          apply(waiter.onStop)
        }
      },

      listener(data) {
        if (isDefined(data?.event?.type)) {
          let eventType = mobile.waiter.listener[data.event.type]
          if (isFunction(eventType)) {
            apply(eventType, data)
          }
        }
      },

      done(id, data) {
        let waiter = mobile.waiter.done[id]
        delete mobile.waiter.done[id]
        if (isObject(waiter)) {
          apply(waiter.onDone, data)
        }
      },
    },
  }

  return {
    // apply
    apply,

    // delay
    delay,

    // throwIf
    throwIf,

    // callIf
    callIf,

    // runIf
    runIf,

    // copy
    copy,

    // wait
    wait,

    // uuid
    uuid,

    // validation
    isFunction,
    isObject,
    isDefined,
    isBoolean,
    isString,
    isNumber,
    isInteger,
    isArray,
    isEmail,

    // mobile
    mobile: {
      isConnected: mobile.isConnected,
      message: mobile.message,
      bridge: mobile.bridge,
      watch: mobile.watch,
      callback: mobile.callback,
    },
  }
}
export { ideahut }
