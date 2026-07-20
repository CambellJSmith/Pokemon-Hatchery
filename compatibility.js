(function () {
  "use strict";

  if (!Object.fromEntries) {
    Object.fromEntries = function (entries) {
      const result = {};
      for (const entry of entries) result[entry[0]] = entry[1];
      return result;
    };
  }

  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (callback, thisArg) {
      return Array.prototype.concat.apply([], this.map(callback, thisArg));
    };
  }

  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (search, replacement) {
      if (search instanceof RegExp) {
        if (!search.global) throw new TypeError("replaceAll requires a global RegExp");
        return this.replace(search, replacement);
      }
      return this.split(String(search)).join(String(replacement));
    };
  }

  if (typeof Element !== "undefined") {
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    }
    if (!Element.prototype.closest) {
      Element.prototype.closest = function (selector) {
        let node = this;
        while (node && node.nodeType === 1) {
          if (node.matches(selector)) return node;
          node = node.parentElement;
        }
        return null;
      };
    }
  }

  if (typeof NodeList !== "undefined" && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      return window.setTimeout(function () { callback(Date.now()); }, 16);
    };
  }

  if (!window.cancelAnimationFrame) window.cancelAnimationFrame = window.clearTimeout;

  if (!window.performance) window.performance = {};
  if (!window.performance.now) {
    const origin = Date.now();
    window.performance.now = function () { return Date.now() - origin; };
  }
})();
