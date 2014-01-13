var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6181 = x == null ? null : x;
  if(p[goog.typeOf(x__6181)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6182__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6182 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6182__delegate.call(this, array, i, idxs)
    };
    G__6182.cljs$lang$maxFixedArity = 2;
    G__6182.cljs$lang$applyTo = function(arglist__6183) {
      var array = cljs.core.first(arglist__6183);
      var i = cljs.core.first(cljs.core.next(arglist__6183));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6183));
      return G__6182__delegate(array, i, idxs)
    };
    G__6182.cljs$lang$arity$variadic = G__6182__delegate;
    return G__6182
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto____6268 = this$;
      if(and__3941__auto____6268) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____6268
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2426__auto____6269 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6270 = cljs.core._invoke[goog.typeOf(x__2426__auto____6269)];
        if(or__3943__auto____6270) {
          return or__3943__auto____6270
        }else {
          var or__3943__auto____6271 = cljs.core._invoke["_"];
          if(or__3943__auto____6271) {
            return or__3943__auto____6271
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____6272 = this$;
      if(and__3941__auto____6272) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____6272
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2426__auto____6273 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6274 = cljs.core._invoke[goog.typeOf(x__2426__auto____6273)];
        if(or__3943__auto____6274) {
          return or__3943__auto____6274
        }else {
          var or__3943__auto____6275 = cljs.core._invoke["_"];
          if(or__3943__auto____6275) {
            return or__3943__auto____6275
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____6276 = this$;
      if(and__3941__auto____6276) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____6276
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2426__auto____6277 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6278 = cljs.core._invoke[goog.typeOf(x__2426__auto____6277)];
        if(or__3943__auto____6278) {
          return or__3943__auto____6278
        }else {
          var or__3943__auto____6279 = cljs.core._invoke["_"];
          if(or__3943__auto____6279) {
            return or__3943__auto____6279
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____6280 = this$;
      if(and__3941__auto____6280) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____6280
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2426__auto____6281 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6282 = cljs.core._invoke[goog.typeOf(x__2426__auto____6281)];
        if(or__3943__auto____6282) {
          return or__3943__auto____6282
        }else {
          var or__3943__auto____6283 = cljs.core._invoke["_"];
          if(or__3943__auto____6283) {
            return or__3943__auto____6283
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____6284 = this$;
      if(and__3941__auto____6284) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____6284
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2426__auto____6285 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6286 = cljs.core._invoke[goog.typeOf(x__2426__auto____6285)];
        if(or__3943__auto____6286) {
          return or__3943__auto____6286
        }else {
          var or__3943__auto____6287 = cljs.core._invoke["_"];
          if(or__3943__auto____6287) {
            return or__3943__auto____6287
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____6288 = this$;
      if(and__3941__auto____6288) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____6288
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2426__auto____6289 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6290 = cljs.core._invoke[goog.typeOf(x__2426__auto____6289)];
        if(or__3943__auto____6290) {
          return or__3943__auto____6290
        }else {
          var or__3943__auto____6291 = cljs.core._invoke["_"];
          if(or__3943__auto____6291) {
            return or__3943__auto____6291
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____6292 = this$;
      if(and__3941__auto____6292) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____6292
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2426__auto____6293 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6294 = cljs.core._invoke[goog.typeOf(x__2426__auto____6293)];
        if(or__3943__auto____6294) {
          return or__3943__auto____6294
        }else {
          var or__3943__auto____6295 = cljs.core._invoke["_"];
          if(or__3943__auto____6295) {
            return or__3943__auto____6295
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____6296 = this$;
      if(and__3941__auto____6296) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____6296
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2426__auto____6297 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6298 = cljs.core._invoke[goog.typeOf(x__2426__auto____6297)];
        if(or__3943__auto____6298) {
          return or__3943__auto____6298
        }else {
          var or__3943__auto____6299 = cljs.core._invoke["_"];
          if(or__3943__auto____6299) {
            return or__3943__auto____6299
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____6300 = this$;
      if(and__3941__auto____6300) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____6300
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2426__auto____6301 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6302 = cljs.core._invoke[goog.typeOf(x__2426__auto____6301)];
        if(or__3943__auto____6302) {
          return or__3943__auto____6302
        }else {
          var or__3943__auto____6303 = cljs.core._invoke["_"];
          if(or__3943__auto____6303) {
            return or__3943__auto____6303
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____6304 = this$;
      if(and__3941__auto____6304) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____6304
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2426__auto____6305 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6306 = cljs.core._invoke[goog.typeOf(x__2426__auto____6305)];
        if(or__3943__auto____6306) {
          return or__3943__auto____6306
        }else {
          var or__3943__auto____6307 = cljs.core._invoke["_"];
          if(or__3943__auto____6307) {
            return or__3943__auto____6307
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____6308 = this$;
      if(and__3941__auto____6308) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____6308
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2426__auto____6309 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6310 = cljs.core._invoke[goog.typeOf(x__2426__auto____6309)];
        if(or__3943__auto____6310) {
          return or__3943__auto____6310
        }else {
          var or__3943__auto____6311 = cljs.core._invoke["_"];
          if(or__3943__auto____6311) {
            return or__3943__auto____6311
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____6312 = this$;
      if(and__3941__auto____6312) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____6312
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2426__auto____6313 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6314 = cljs.core._invoke[goog.typeOf(x__2426__auto____6313)];
        if(or__3943__auto____6314) {
          return or__3943__auto____6314
        }else {
          var or__3943__auto____6315 = cljs.core._invoke["_"];
          if(or__3943__auto____6315) {
            return or__3943__auto____6315
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____6316 = this$;
      if(and__3941__auto____6316) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____6316
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2426__auto____6317 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6318 = cljs.core._invoke[goog.typeOf(x__2426__auto____6317)];
        if(or__3943__auto____6318) {
          return or__3943__auto____6318
        }else {
          var or__3943__auto____6319 = cljs.core._invoke["_"];
          if(or__3943__auto____6319) {
            return or__3943__auto____6319
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____6320 = this$;
      if(and__3941__auto____6320) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____6320
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2426__auto____6321 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6322 = cljs.core._invoke[goog.typeOf(x__2426__auto____6321)];
        if(or__3943__auto____6322) {
          return or__3943__auto____6322
        }else {
          var or__3943__auto____6323 = cljs.core._invoke["_"];
          if(or__3943__auto____6323) {
            return or__3943__auto____6323
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____6324 = this$;
      if(and__3941__auto____6324) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____6324
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2426__auto____6325 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6326 = cljs.core._invoke[goog.typeOf(x__2426__auto____6325)];
        if(or__3943__auto____6326) {
          return or__3943__auto____6326
        }else {
          var or__3943__auto____6327 = cljs.core._invoke["_"];
          if(or__3943__auto____6327) {
            return or__3943__auto____6327
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____6328 = this$;
      if(and__3941__auto____6328) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____6328
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2426__auto____6329 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6330 = cljs.core._invoke[goog.typeOf(x__2426__auto____6329)];
        if(or__3943__auto____6330) {
          return or__3943__auto____6330
        }else {
          var or__3943__auto____6331 = cljs.core._invoke["_"];
          if(or__3943__auto____6331) {
            return or__3943__auto____6331
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____6332 = this$;
      if(and__3941__auto____6332) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____6332
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2426__auto____6333 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6334 = cljs.core._invoke[goog.typeOf(x__2426__auto____6333)];
        if(or__3943__auto____6334) {
          return or__3943__auto____6334
        }else {
          var or__3943__auto____6335 = cljs.core._invoke["_"];
          if(or__3943__auto____6335) {
            return or__3943__auto____6335
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____6336 = this$;
      if(and__3941__auto____6336) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____6336
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2426__auto____6337 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6338 = cljs.core._invoke[goog.typeOf(x__2426__auto____6337)];
        if(or__3943__auto____6338) {
          return or__3943__auto____6338
        }else {
          var or__3943__auto____6339 = cljs.core._invoke["_"];
          if(or__3943__auto____6339) {
            return or__3943__auto____6339
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____6340 = this$;
      if(and__3941__auto____6340) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____6340
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2426__auto____6341 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6342 = cljs.core._invoke[goog.typeOf(x__2426__auto____6341)];
        if(or__3943__auto____6342) {
          return or__3943__auto____6342
        }else {
          var or__3943__auto____6343 = cljs.core._invoke["_"];
          if(or__3943__auto____6343) {
            return or__3943__auto____6343
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____6344 = this$;
      if(and__3941__auto____6344) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____6344
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2426__auto____6345 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6346 = cljs.core._invoke[goog.typeOf(x__2426__auto____6345)];
        if(or__3943__auto____6346) {
          return or__3943__auto____6346
        }else {
          var or__3943__auto____6347 = cljs.core._invoke["_"];
          if(or__3943__auto____6347) {
            return or__3943__auto____6347
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____6348 = this$;
      if(and__3941__auto____6348) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____6348
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2426__auto____6349 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6350 = cljs.core._invoke[goog.typeOf(x__2426__auto____6349)];
        if(or__3943__auto____6350) {
          return or__3943__auto____6350
        }else {
          var or__3943__auto____6351 = cljs.core._invoke["_"];
          if(or__3943__auto____6351) {
            return or__3943__auto____6351
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto____6356 = coll;
    if(and__3941__auto____6356) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____6356
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2426__auto____6357 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6358 = cljs.core._count[goog.typeOf(x__2426__auto____6357)];
      if(or__3943__auto____6358) {
        return or__3943__auto____6358
      }else {
        var or__3943__auto____6359 = cljs.core._count["_"];
        if(or__3943__auto____6359) {
          return or__3943__auto____6359
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto____6364 = coll;
    if(and__3941__auto____6364) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____6364
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2426__auto____6365 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6366 = cljs.core._empty[goog.typeOf(x__2426__auto____6365)];
      if(or__3943__auto____6366) {
        return or__3943__auto____6366
      }else {
        var or__3943__auto____6367 = cljs.core._empty["_"];
        if(or__3943__auto____6367) {
          return or__3943__auto____6367
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto____6372 = coll;
    if(and__3941__auto____6372) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____6372
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2426__auto____6373 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6374 = cljs.core._conj[goog.typeOf(x__2426__auto____6373)];
      if(or__3943__auto____6374) {
        return or__3943__auto____6374
      }else {
        var or__3943__auto____6375 = cljs.core._conj["_"];
        if(or__3943__auto____6375) {
          return or__3943__auto____6375
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto____6384 = coll;
      if(and__3941__auto____6384) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____6384
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2426__auto____6385 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6386 = cljs.core._nth[goog.typeOf(x__2426__auto____6385)];
        if(or__3943__auto____6386) {
          return or__3943__auto____6386
        }else {
          var or__3943__auto____6387 = cljs.core._nth["_"];
          if(or__3943__auto____6387) {
            return or__3943__auto____6387
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____6388 = coll;
      if(and__3941__auto____6388) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____6388
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2426__auto____6389 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6390 = cljs.core._nth[goog.typeOf(x__2426__auto____6389)];
        if(or__3943__auto____6390) {
          return or__3943__auto____6390
        }else {
          var or__3943__auto____6391 = cljs.core._nth["_"];
          if(or__3943__auto____6391) {
            return or__3943__auto____6391
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto____6396 = coll;
    if(and__3941__auto____6396) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____6396
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2426__auto____6397 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6398 = cljs.core._first[goog.typeOf(x__2426__auto____6397)];
      if(or__3943__auto____6398) {
        return or__3943__auto____6398
      }else {
        var or__3943__auto____6399 = cljs.core._first["_"];
        if(or__3943__auto____6399) {
          return or__3943__auto____6399
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____6404 = coll;
    if(and__3941__auto____6404) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____6404
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2426__auto____6405 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6406 = cljs.core._rest[goog.typeOf(x__2426__auto____6405)];
      if(or__3943__auto____6406) {
        return or__3943__auto____6406
      }else {
        var or__3943__auto____6407 = cljs.core._rest["_"];
        if(or__3943__auto____6407) {
          return or__3943__auto____6407
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto____6412 = coll;
    if(and__3941__auto____6412) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____6412
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2426__auto____6413 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6414 = cljs.core._next[goog.typeOf(x__2426__auto____6413)];
      if(or__3943__auto____6414) {
        return or__3943__auto____6414
      }else {
        var or__3943__auto____6415 = cljs.core._next["_"];
        if(or__3943__auto____6415) {
          return or__3943__auto____6415
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto____6424 = o;
      if(and__3941__auto____6424) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____6424
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2426__auto____6425 = o == null ? null : o;
      return function() {
        var or__3943__auto____6426 = cljs.core._lookup[goog.typeOf(x__2426__auto____6425)];
        if(or__3943__auto____6426) {
          return or__3943__auto____6426
        }else {
          var or__3943__auto____6427 = cljs.core._lookup["_"];
          if(or__3943__auto____6427) {
            return or__3943__auto____6427
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____6428 = o;
      if(and__3941__auto____6428) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____6428
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2426__auto____6429 = o == null ? null : o;
      return function() {
        var or__3943__auto____6430 = cljs.core._lookup[goog.typeOf(x__2426__auto____6429)];
        if(or__3943__auto____6430) {
          return or__3943__auto____6430
        }else {
          var or__3943__auto____6431 = cljs.core._lookup["_"];
          if(or__3943__auto____6431) {
            return or__3943__auto____6431
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto____6436 = coll;
    if(and__3941__auto____6436) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____6436
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2426__auto____6437 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6438 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2426__auto____6437)];
      if(or__3943__auto____6438) {
        return or__3943__auto____6438
      }else {
        var or__3943__auto____6439 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____6439) {
          return or__3943__auto____6439
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____6444 = coll;
    if(and__3941__auto____6444) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____6444
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2426__auto____6445 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6446 = cljs.core._assoc[goog.typeOf(x__2426__auto____6445)];
      if(or__3943__auto____6446) {
        return or__3943__auto____6446
      }else {
        var or__3943__auto____6447 = cljs.core._assoc["_"];
        if(or__3943__auto____6447) {
          return or__3943__auto____6447
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto____6452 = coll;
    if(and__3941__auto____6452) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____6452
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2426__auto____6453 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6454 = cljs.core._dissoc[goog.typeOf(x__2426__auto____6453)];
      if(or__3943__auto____6454) {
        return or__3943__auto____6454
      }else {
        var or__3943__auto____6455 = cljs.core._dissoc["_"];
        if(or__3943__auto____6455) {
          return or__3943__auto____6455
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto____6460 = coll;
    if(and__3941__auto____6460) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____6460
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2426__auto____6461 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6462 = cljs.core._key[goog.typeOf(x__2426__auto____6461)];
      if(or__3943__auto____6462) {
        return or__3943__auto____6462
      }else {
        var or__3943__auto____6463 = cljs.core._key["_"];
        if(or__3943__auto____6463) {
          return or__3943__auto____6463
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____6468 = coll;
    if(and__3941__auto____6468) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____6468
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2426__auto____6469 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6470 = cljs.core._val[goog.typeOf(x__2426__auto____6469)];
      if(or__3943__auto____6470) {
        return or__3943__auto____6470
      }else {
        var or__3943__auto____6471 = cljs.core._val["_"];
        if(or__3943__auto____6471) {
          return or__3943__auto____6471
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto____6476 = coll;
    if(and__3941__auto____6476) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____6476
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2426__auto____6477 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6478 = cljs.core._disjoin[goog.typeOf(x__2426__auto____6477)];
      if(or__3943__auto____6478) {
        return or__3943__auto____6478
      }else {
        var or__3943__auto____6479 = cljs.core._disjoin["_"];
        if(or__3943__auto____6479) {
          return or__3943__auto____6479
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto____6484 = coll;
    if(and__3941__auto____6484) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____6484
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2426__auto____6485 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6486 = cljs.core._peek[goog.typeOf(x__2426__auto____6485)];
      if(or__3943__auto____6486) {
        return or__3943__auto____6486
      }else {
        var or__3943__auto____6487 = cljs.core._peek["_"];
        if(or__3943__auto____6487) {
          return or__3943__auto____6487
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____6492 = coll;
    if(and__3941__auto____6492) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____6492
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2426__auto____6493 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6494 = cljs.core._pop[goog.typeOf(x__2426__auto____6493)];
      if(or__3943__auto____6494) {
        return or__3943__auto____6494
      }else {
        var or__3943__auto____6495 = cljs.core._pop["_"];
        if(or__3943__auto____6495) {
          return or__3943__auto____6495
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto____6500 = coll;
    if(and__3941__auto____6500) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____6500
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2426__auto____6501 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6502 = cljs.core._assoc_n[goog.typeOf(x__2426__auto____6501)];
      if(or__3943__auto____6502) {
        return or__3943__auto____6502
      }else {
        var or__3943__auto____6503 = cljs.core._assoc_n["_"];
        if(or__3943__auto____6503) {
          return or__3943__auto____6503
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto____6508 = o;
    if(and__3941__auto____6508) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____6508
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2426__auto____6509 = o == null ? null : o;
    return function() {
      var or__3943__auto____6510 = cljs.core._deref[goog.typeOf(x__2426__auto____6509)];
      if(or__3943__auto____6510) {
        return or__3943__auto____6510
      }else {
        var or__3943__auto____6511 = cljs.core._deref["_"];
        if(or__3943__auto____6511) {
          return or__3943__auto____6511
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto____6516 = o;
    if(and__3941__auto____6516) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____6516
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2426__auto____6517 = o == null ? null : o;
    return function() {
      var or__3943__auto____6518 = cljs.core._deref_with_timeout[goog.typeOf(x__2426__auto____6517)];
      if(or__3943__auto____6518) {
        return or__3943__auto____6518
      }else {
        var or__3943__auto____6519 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____6519) {
          return or__3943__auto____6519
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto____6524 = o;
    if(and__3941__auto____6524) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____6524
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2426__auto____6525 = o == null ? null : o;
    return function() {
      var or__3943__auto____6526 = cljs.core._meta[goog.typeOf(x__2426__auto____6525)];
      if(or__3943__auto____6526) {
        return or__3943__auto____6526
      }else {
        var or__3943__auto____6527 = cljs.core._meta["_"];
        if(or__3943__auto____6527) {
          return or__3943__auto____6527
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto____6532 = o;
    if(and__3941__auto____6532) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____6532
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2426__auto____6533 = o == null ? null : o;
    return function() {
      var or__3943__auto____6534 = cljs.core._with_meta[goog.typeOf(x__2426__auto____6533)];
      if(or__3943__auto____6534) {
        return or__3943__auto____6534
      }else {
        var or__3943__auto____6535 = cljs.core._with_meta["_"];
        if(or__3943__auto____6535) {
          return or__3943__auto____6535
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto____6544 = coll;
      if(and__3941__auto____6544) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____6544
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2426__auto____6545 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6546 = cljs.core._reduce[goog.typeOf(x__2426__auto____6545)];
        if(or__3943__auto____6546) {
          return or__3943__auto____6546
        }else {
          var or__3943__auto____6547 = cljs.core._reduce["_"];
          if(or__3943__auto____6547) {
            return or__3943__auto____6547
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____6548 = coll;
      if(and__3941__auto____6548) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____6548
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2426__auto____6549 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6550 = cljs.core._reduce[goog.typeOf(x__2426__auto____6549)];
        if(or__3943__auto____6550) {
          return or__3943__auto____6550
        }else {
          var or__3943__auto____6551 = cljs.core._reduce["_"];
          if(or__3943__auto____6551) {
            return or__3943__auto____6551
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto____6556 = coll;
    if(and__3941__auto____6556) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____6556
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2426__auto____6557 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6558 = cljs.core._kv_reduce[goog.typeOf(x__2426__auto____6557)];
      if(or__3943__auto____6558) {
        return or__3943__auto____6558
      }else {
        var or__3943__auto____6559 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____6559) {
          return or__3943__auto____6559
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto____6564 = o;
    if(and__3941__auto____6564) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____6564
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2426__auto____6565 = o == null ? null : o;
    return function() {
      var or__3943__auto____6566 = cljs.core._equiv[goog.typeOf(x__2426__auto____6565)];
      if(or__3943__auto____6566) {
        return or__3943__auto____6566
      }else {
        var or__3943__auto____6567 = cljs.core._equiv["_"];
        if(or__3943__auto____6567) {
          return or__3943__auto____6567
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto____6572 = o;
    if(and__3941__auto____6572) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____6572
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2426__auto____6573 = o == null ? null : o;
    return function() {
      var or__3943__auto____6574 = cljs.core._hash[goog.typeOf(x__2426__auto____6573)];
      if(or__3943__auto____6574) {
        return or__3943__auto____6574
      }else {
        var or__3943__auto____6575 = cljs.core._hash["_"];
        if(or__3943__auto____6575) {
          return or__3943__auto____6575
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto____6580 = o;
    if(and__3941__auto____6580) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____6580
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2426__auto____6581 = o == null ? null : o;
    return function() {
      var or__3943__auto____6582 = cljs.core._seq[goog.typeOf(x__2426__auto____6581)];
      if(or__3943__auto____6582) {
        return or__3943__auto____6582
      }else {
        var or__3943__auto____6583 = cljs.core._seq["_"];
        if(or__3943__auto____6583) {
          return or__3943__auto____6583
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto____6588 = coll;
    if(and__3941__auto____6588) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____6588
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2426__auto____6589 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6590 = cljs.core._rseq[goog.typeOf(x__2426__auto____6589)];
      if(or__3943__auto____6590) {
        return or__3943__auto____6590
      }else {
        var or__3943__auto____6591 = cljs.core._rseq["_"];
        if(or__3943__auto____6591) {
          return or__3943__auto____6591
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6596 = coll;
    if(and__3941__auto____6596) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____6596
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2426__auto____6597 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6598 = cljs.core._sorted_seq[goog.typeOf(x__2426__auto____6597)];
      if(or__3943__auto____6598) {
        return or__3943__auto____6598
      }else {
        var or__3943__auto____6599 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____6599) {
          return or__3943__auto____6599
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6604 = coll;
    if(and__3941__auto____6604) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____6604
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2426__auto____6605 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6606 = cljs.core._sorted_seq_from[goog.typeOf(x__2426__auto____6605)];
      if(or__3943__auto____6606) {
        return or__3943__auto____6606
      }else {
        var or__3943__auto____6607 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____6607) {
          return or__3943__auto____6607
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____6612 = coll;
    if(and__3941__auto____6612) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____6612
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2426__auto____6613 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6614 = cljs.core._entry_key[goog.typeOf(x__2426__auto____6613)];
      if(or__3943__auto____6614) {
        return or__3943__auto____6614
      }else {
        var or__3943__auto____6615 = cljs.core._entry_key["_"];
        if(or__3943__auto____6615) {
          return or__3943__auto____6615
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____6620 = coll;
    if(and__3941__auto____6620) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____6620
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2426__auto____6621 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6622 = cljs.core._comparator[goog.typeOf(x__2426__auto____6621)];
      if(or__3943__auto____6622) {
        return or__3943__auto____6622
      }else {
        var or__3943__auto____6623 = cljs.core._comparator["_"];
        if(or__3943__auto____6623) {
          return or__3943__auto____6623
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto____6628 = o;
    if(and__3941__auto____6628) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____6628
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2426__auto____6629 = o == null ? null : o;
    return function() {
      var or__3943__auto____6630 = cljs.core._pr_seq[goog.typeOf(x__2426__auto____6629)];
      if(or__3943__auto____6630) {
        return or__3943__auto____6630
      }else {
        var or__3943__auto____6631 = cljs.core._pr_seq["_"];
        if(or__3943__auto____6631) {
          return or__3943__auto____6631
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto____6636 = d;
    if(and__3941__auto____6636) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____6636
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2426__auto____6637 = d == null ? null : d;
    return function() {
      var or__3943__auto____6638 = cljs.core._realized_QMARK_[goog.typeOf(x__2426__auto____6637)];
      if(or__3943__auto____6638) {
        return or__3943__auto____6638
      }else {
        var or__3943__auto____6639 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____6639) {
          return or__3943__auto____6639
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto____6644 = this$;
    if(and__3941__auto____6644) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____6644
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2426__auto____6645 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6646 = cljs.core._notify_watches[goog.typeOf(x__2426__auto____6645)];
      if(or__3943__auto____6646) {
        return or__3943__auto____6646
      }else {
        var or__3943__auto____6647 = cljs.core._notify_watches["_"];
        if(or__3943__auto____6647) {
          return or__3943__auto____6647
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____6652 = this$;
    if(and__3941__auto____6652) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____6652
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2426__auto____6653 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6654 = cljs.core._add_watch[goog.typeOf(x__2426__auto____6653)];
      if(or__3943__auto____6654) {
        return or__3943__auto____6654
      }else {
        var or__3943__auto____6655 = cljs.core._add_watch["_"];
        if(or__3943__auto____6655) {
          return or__3943__auto____6655
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____6660 = this$;
    if(and__3941__auto____6660) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____6660
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2426__auto____6661 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6662 = cljs.core._remove_watch[goog.typeOf(x__2426__auto____6661)];
      if(or__3943__auto____6662) {
        return or__3943__auto____6662
      }else {
        var or__3943__auto____6663 = cljs.core._remove_watch["_"];
        if(or__3943__auto____6663) {
          return or__3943__auto____6663
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto____6668 = coll;
    if(and__3941__auto____6668) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____6668
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2426__auto____6669 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6670 = cljs.core._as_transient[goog.typeOf(x__2426__auto____6669)];
      if(or__3943__auto____6670) {
        return or__3943__auto____6670
      }else {
        var or__3943__auto____6671 = cljs.core._as_transient["_"];
        if(or__3943__auto____6671) {
          return or__3943__auto____6671
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto____6676 = tcoll;
    if(and__3941__auto____6676) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____6676
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2426__auto____6677 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6678 = cljs.core._conj_BANG_[goog.typeOf(x__2426__auto____6677)];
      if(or__3943__auto____6678) {
        return or__3943__auto____6678
      }else {
        var or__3943__auto____6679 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____6679) {
          return or__3943__auto____6679
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6684 = tcoll;
    if(and__3941__auto____6684) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____6684
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2426__auto____6685 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6686 = cljs.core._persistent_BANG_[goog.typeOf(x__2426__auto____6685)];
      if(or__3943__auto____6686) {
        return or__3943__auto____6686
      }else {
        var or__3943__auto____6687 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____6687) {
          return or__3943__auto____6687
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto____6692 = tcoll;
    if(and__3941__auto____6692) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____6692
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2426__auto____6693 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6694 = cljs.core._assoc_BANG_[goog.typeOf(x__2426__auto____6693)];
      if(or__3943__auto____6694) {
        return or__3943__auto____6694
      }else {
        var or__3943__auto____6695 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____6695) {
          return or__3943__auto____6695
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto____6700 = tcoll;
    if(and__3941__auto____6700) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____6700
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2426__auto____6701 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6702 = cljs.core._dissoc_BANG_[goog.typeOf(x__2426__auto____6701)];
      if(or__3943__auto____6702) {
        return or__3943__auto____6702
      }else {
        var or__3943__auto____6703 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____6703) {
          return or__3943__auto____6703
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto____6708 = tcoll;
    if(and__3941__auto____6708) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____6708
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2426__auto____6709 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6710 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2426__auto____6709)];
      if(or__3943__auto____6710) {
        return or__3943__auto____6710
      }else {
        var or__3943__auto____6711 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____6711) {
          return or__3943__auto____6711
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6716 = tcoll;
    if(and__3941__auto____6716) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____6716
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2426__auto____6717 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6718 = cljs.core._pop_BANG_[goog.typeOf(x__2426__auto____6717)];
      if(or__3943__auto____6718) {
        return or__3943__auto____6718
      }else {
        var or__3943__auto____6719 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____6719) {
          return or__3943__auto____6719
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto____6724 = tcoll;
    if(and__3941__auto____6724) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____6724
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2426__auto____6725 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6726 = cljs.core._disjoin_BANG_[goog.typeOf(x__2426__auto____6725)];
      if(or__3943__auto____6726) {
        return or__3943__auto____6726
      }else {
        var or__3943__auto____6727 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____6727) {
          return or__3943__auto____6727
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto____6732 = x;
    if(and__3941__auto____6732) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____6732
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2426__auto____6733 = x == null ? null : x;
    return function() {
      var or__3943__auto____6734 = cljs.core._compare[goog.typeOf(x__2426__auto____6733)];
      if(or__3943__auto____6734) {
        return or__3943__auto____6734
      }else {
        var or__3943__auto____6735 = cljs.core._compare["_"];
        if(or__3943__auto____6735) {
          return or__3943__auto____6735
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto____6740 = coll;
    if(and__3941__auto____6740) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____6740
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2426__auto____6741 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6742 = cljs.core._drop_first[goog.typeOf(x__2426__auto____6741)];
      if(or__3943__auto____6742) {
        return or__3943__auto____6742
      }else {
        var or__3943__auto____6743 = cljs.core._drop_first["_"];
        if(or__3943__auto____6743) {
          return or__3943__auto____6743
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto____6748 = coll;
    if(and__3941__auto____6748) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____6748
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2426__auto____6749 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6750 = cljs.core._chunked_first[goog.typeOf(x__2426__auto____6749)];
      if(or__3943__auto____6750) {
        return or__3943__auto____6750
      }else {
        var or__3943__auto____6751 = cljs.core._chunked_first["_"];
        if(or__3943__auto____6751) {
          return or__3943__auto____6751
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____6756 = coll;
    if(and__3941__auto____6756) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____6756
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2426__auto____6757 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6758 = cljs.core._chunked_rest[goog.typeOf(x__2426__auto____6757)];
      if(or__3943__auto____6758) {
        return or__3943__auto____6758
      }else {
        var or__3943__auto____6759 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____6759) {
          return or__3943__auto____6759
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto____6764 = coll;
    if(and__3941__auto____6764) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____6764
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2426__auto____6765 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6766 = cljs.core._chunked_next[goog.typeOf(x__2426__auto____6765)];
      if(or__3943__auto____6766) {
        return or__3943__auto____6766
      }else {
        var or__3943__auto____6767 = cljs.core._chunked_next["_"];
        if(or__3943__auto____6767) {
          return or__3943__auto____6767
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto____6769 = x === y;
    if(or__3943__auto____6769) {
      return or__3943__auto____6769
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6770__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6771 = y;
            var G__6772 = cljs.core.first.call(null, more);
            var G__6773 = cljs.core.next.call(null, more);
            x = G__6771;
            y = G__6772;
            more = G__6773;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6770 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6770__delegate.call(this, x, y, more)
    };
    G__6770.cljs$lang$maxFixedArity = 2;
    G__6770.cljs$lang$applyTo = function(arglist__6774) {
      var x = cljs.core.first(arglist__6774);
      var y = cljs.core.first(cljs.core.next(arglist__6774));
      var more = cljs.core.rest(cljs.core.next(arglist__6774));
      return G__6770__delegate(x, y, more)
    };
    G__6770.cljs$lang$arity$variadic = G__6770__delegate;
    return G__6770
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6775 = null;
  var G__6775__2 = function(o, k) {
    return null
  };
  var G__6775__3 = function(o, k, not_found) {
    return not_found
  };
  G__6775 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6775__2.call(this, o, k);
      case 3:
        return G__6775__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6775
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6776 = null;
  var G__6776__2 = function(_, f) {
    return f.call(null)
  };
  var G__6776__3 = function(_, f, start) {
    return start
  };
  G__6776 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6776__2.call(this, _, f);
      case 3:
        return G__6776__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6776
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6777 = null;
  var G__6777__2 = function(_, n) {
    return null
  };
  var G__6777__3 = function(_, n, not_found) {
    return not_found
  };
  G__6777 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6777__2.call(this, _, n);
      case 3:
        return G__6777__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6777
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto____6778 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3941__auto____6778) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto____6778
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6791 = cljs.core._count.call(null, cicoll);
    if(cnt__6791 === 0) {
      return f.call(null)
    }else {
      var val__6792 = cljs.core._nth.call(null, cicoll, 0);
      var n__6793 = 1;
      while(true) {
        if(n__6793 < cnt__6791) {
          var nval__6794 = f.call(null, val__6792, cljs.core._nth.call(null, cicoll, n__6793));
          if(cljs.core.reduced_QMARK_.call(null, nval__6794)) {
            return cljs.core.deref.call(null, nval__6794)
          }else {
            var G__6803 = nval__6794;
            var G__6804 = n__6793 + 1;
            val__6792 = G__6803;
            n__6793 = G__6804;
            continue
          }
        }else {
          return val__6792
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6795 = cljs.core._count.call(null, cicoll);
    var val__6796 = val;
    var n__6797 = 0;
    while(true) {
      if(n__6797 < cnt__6795) {
        var nval__6798 = f.call(null, val__6796, cljs.core._nth.call(null, cicoll, n__6797));
        if(cljs.core.reduced_QMARK_.call(null, nval__6798)) {
          return cljs.core.deref.call(null, nval__6798)
        }else {
          var G__6805 = nval__6798;
          var G__6806 = n__6797 + 1;
          val__6796 = G__6805;
          n__6797 = G__6806;
          continue
        }
      }else {
        return val__6796
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6799 = cljs.core._count.call(null, cicoll);
    var val__6800 = val;
    var n__6801 = idx;
    while(true) {
      if(n__6801 < cnt__6799) {
        var nval__6802 = f.call(null, val__6800, cljs.core._nth.call(null, cicoll, n__6801));
        if(cljs.core.reduced_QMARK_.call(null, nval__6802)) {
          return cljs.core.deref.call(null, nval__6802)
        }else {
          var G__6807 = nval__6802;
          var G__6808 = n__6801 + 1;
          val__6800 = G__6807;
          n__6801 = G__6808;
          continue
        }
      }else {
        return val__6800
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6821 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6822 = arr[0];
      var n__6823 = 1;
      while(true) {
        if(n__6823 < cnt__6821) {
          var nval__6824 = f.call(null, val__6822, arr[n__6823]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6824)) {
            return cljs.core.deref.call(null, nval__6824)
          }else {
            var G__6833 = nval__6824;
            var G__6834 = n__6823 + 1;
            val__6822 = G__6833;
            n__6823 = G__6834;
            continue
          }
        }else {
          return val__6822
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6825 = arr.length;
    var val__6826 = val;
    var n__6827 = 0;
    while(true) {
      if(n__6827 < cnt__6825) {
        var nval__6828 = f.call(null, val__6826, arr[n__6827]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6828)) {
          return cljs.core.deref.call(null, nval__6828)
        }else {
          var G__6835 = nval__6828;
          var G__6836 = n__6827 + 1;
          val__6826 = G__6835;
          n__6827 = G__6836;
          continue
        }
      }else {
        return val__6826
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6829 = arr.length;
    var val__6830 = val;
    var n__6831 = idx;
    while(true) {
      if(n__6831 < cnt__6829) {
        var nval__6832 = f.call(null, val__6830, arr[n__6831]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6832)) {
          return cljs.core.deref.call(null, nval__6832)
        }else {
          var G__6837 = nval__6832;
          var G__6838 = n__6831 + 1;
          val__6830 = G__6837;
          n__6831 = G__6838;
          continue
        }
      }else {
        return val__6830
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6839 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6840 = this;
  if(this__6840.i + 1 < this__6840.a.length) {
    return new cljs.core.IndexedSeq(this__6840.a, this__6840.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6841 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6842 = this;
  var c__6843 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6843 > 0) {
    return new cljs.core.RSeq(coll, c__6843 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6844 = this;
  var this__6845 = this;
  return cljs.core.pr_str.call(null, this__6845)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6846 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6846.a)) {
    return cljs.core.ci_reduce.call(null, this__6846.a, f, this__6846.a[this__6846.i], this__6846.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6846.a[this__6846.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6847 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6847.a)) {
    return cljs.core.ci_reduce.call(null, this__6847.a, f, start, this__6847.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6848 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6849 = this;
  return this__6849.a.length - this__6849.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6850 = this;
  return this__6850.a[this__6850.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6851 = this;
  if(this__6851.i + 1 < this__6851.a.length) {
    return new cljs.core.IndexedSeq(this__6851.a, this__6851.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6852 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6853 = this;
  var i__6854 = n + this__6853.i;
  if(i__6854 < this__6853.a.length) {
    return this__6853.a[i__6854]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6855 = this;
  var i__6856 = n + this__6855.i;
  if(i__6856 < this__6855.a.length) {
    return this__6855.a[i__6856]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6857 = null;
  var G__6857__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6857__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6857 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6857__2.call(this, array, f);
      case 3:
        return G__6857__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6857
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6858 = null;
  var G__6858__2 = function(array, k) {
    return array[k]
  };
  var G__6858__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6858 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6858__2.call(this, array, k);
      case 3:
        return G__6858__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6858
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6859 = null;
  var G__6859__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6859__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6859 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6859__2.call(this, array, n);
      case 3:
        return G__6859__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6859
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6860 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6861 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6862 = this;
  var this__6863 = this;
  return cljs.core.pr_str.call(null, this__6863)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6864 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6865 = this;
  return this__6865.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6866 = this;
  return cljs.core._nth.call(null, this__6866.ci, this__6866.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6867 = this;
  if(this__6867.i > 0) {
    return new cljs.core.RSeq(this__6867.ci, this__6867.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6868 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6869 = this;
  return new cljs.core.RSeq(this__6869.ci, this__6869.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6870 = this;
  return this__6870.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6874__6875 = coll;
      if(G__6874__6875) {
        if(function() {
          var or__3943__auto____6876 = G__6874__6875.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____6876) {
            return or__3943__auto____6876
          }else {
            return G__6874__6875.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6874__6875.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6874__6875)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6874__6875)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6881__6882 = coll;
      if(G__6881__6882) {
        if(function() {
          var or__3943__auto____6883 = G__6881__6882.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6883) {
            return or__3943__auto____6883
          }else {
            return G__6881__6882.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6881__6882.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6881__6882)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6881__6882)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6884 = cljs.core.seq.call(null, coll);
      if(s__6884 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6884)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6889__6890 = coll;
      if(G__6889__6890) {
        if(function() {
          var or__3943__auto____6891 = G__6889__6890.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6891) {
            return or__3943__auto____6891
          }else {
            return G__6889__6890.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6889__6890.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6889__6890)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6889__6890)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6892 = cljs.core.seq.call(null, coll);
      if(!(s__6892 == null)) {
        return cljs.core._rest.call(null, s__6892)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6896__6897 = coll;
      if(G__6896__6897) {
        if(function() {
          var or__3943__auto____6898 = G__6896__6897.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____6898) {
            return or__3943__auto____6898
          }else {
            return G__6896__6897.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6896__6897.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6896__6897)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6896__6897)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6900 = cljs.core.next.call(null, s);
    if(!(sn__6900 == null)) {
      var G__6901 = sn__6900;
      s = G__6901;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6902__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6903 = conj.call(null, coll, x);
          var G__6904 = cljs.core.first.call(null, xs);
          var G__6905 = cljs.core.next.call(null, xs);
          coll = G__6903;
          x = G__6904;
          xs = G__6905;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6902 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6902__delegate.call(this, coll, x, xs)
    };
    G__6902.cljs$lang$maxFixedArity = 2;
    G__6902.cljs$lang$applyTo = function(arglist__6906) {
      var coll = cljs.core.first(arglist__6906);
      var x = cljs.core.first(cljs.core.next(arglist__6906));
      var xs = cljs.core.rest(cljs.core.next(arglist__6906));
      return G__6902__delegate(coll, x, xs)
    };
    G__6902.cljs$lang$arity$variadic = G__6902__delegate;
    return G__6902
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6909 = cljs.core.seq.call(null, coll);
  var acc__6910 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6909)) {
      return acc__6910 + cljs.core._count.call(null, s__6909)
    }else {
      var G__6911 = cljs.core.next.call(null, s__6909);
      var G__6912 = acc__6910 + 1;
      s__6909 = G__6911;
      acc__6910 = G__6912;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6919__6920 = coll;
        if(G__6919__6920) {
          if(function() {
            var or__3943__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6921) {
              return or__3943__auto____6921
            }else {
              return G__6919__6920.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6919__6920)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6919__6920)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6922__6923 = coll;
        if(G__6922__6923) {
          if(function() {
            var or__3943__auto____6924 = G__6922__6923.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6924) {
              return or__3943__auto____6924
            }else {
              return G__6922__6923.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6922__6923.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6922__6923)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6922__6923)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6927__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6926 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6928 = ret__6926;
          var G__6929 = cljs.core.first.call(null, kvs);
          var G__6930 = cljs.core.second.call(null, kvs);
          var G__6931 = cljs.core.nnext.call(null, kvs);
          coll = G__6928;
          k = G__6929;
          v = G__6930;
          kvs = G__6931;
          continue
        }else {
          return ret__6926
        }
        break
      }
    };
    var G__6927 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6927__delegate.call(this, coll, k, v, kvs)
    };
    G__6927.cljs$lang$maxFixedArity = 3;
    G__6927.cljs$lang$applyTo = function(arglist__6932) {
      var coll = cljs.core.first(arglist__6932);
      var k = cljs.core.first(cljs.core.next(arglist__6932));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6932)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6932)));
      return G__6927__delegate(coll, k, v, kvs)
    };
    G__6927.cljs$lang$arity$variadic = G__6927__delegate;
    return G__6927
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6935__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6934 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6936 = ret__6934;
          var G__6937 = cljs.core.first.call(null, ks);
          var G__6938 = cljs.core.next.call(null, ks);
          coll = G__6936;
          k = G__6937;
          ks = G__6938;
          continue
        }else {
          return ret__6934
        }
        break
      }
    };
    var G__6935 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6935__delegate.call(this, coll, k, ks)
    };
    G__6935.cljs$lang$maxFixedArity = 2;
    G__6935.cljs$lang$applyTo = function(arglist__6939) {
      var coll = cljs.core.first(arglist__6939);
      var k = cljs.core.first(cljs.core.next(arglist__6939));
      var ks = cljs.core.rest(cljs.core.next(arglist__6939));
      return G__6935__delegate(coll, k, ks)
    };
    G__6935.cljs$lang$arity$variadic = G__6935__delegate;
    return G__6935
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6943__6944 = o;
    if(G__6943__6944) {
      if(function() {
        var or__3943__auto____6945 = G__6943__6944.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____6945) {
          return or__3943__auto____6945
        }else {
          return G__6943__6944.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6943__6944.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6943__6944)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6943__6944)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6948__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6947 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6949 = ret__6947;
          var G__6950 = cljs.core.first.call(null, ks);
          var G__6951 = cljs.core.next.call(null, ks);
          coll = G__6949;
          k = G__6950;
          ks = G__6951;
          continue
        }else {
          return ret__6947
        }
        break
      }
    };
    var G__6948 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6948__delegate.call(this, coll, k, ks)
    };
    G__6948.cljs$lang$maxFixedArity = 2;
    G__6948.cljs$lang$applyTo = function(arglist__6952) {
      var coll = cljs.core.first(arglist__6952);
      var k = cljs.core.first(cljs.core.next(arglist__6952));
      var ks = cljs.core.rest(cljs.core.next(arglist__6952));
      return G__6948__delegate(coll, k, ks)
    };
    G__6948.cljs$lang$arity$variadic = G__6948__delegate;
    return G__6948
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6954 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6954;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6954
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6956 = cljs.core.string_hash_cache[k];
  if(!(h__6956 == null)) {
    return h__6956
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto____6958 = goog.isString(o);
      if(and__3941__auto____6958) {
        return check_cache
      }else {
        return and__3941__auto____6958
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6962__6963 = x;
    if(G__6962__6963) {
      if(function() {
        var or__3943__auto____6964 = G__6962__6963.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____6964) {
          return or__3943__auto____6964
        }else {
          return G__6962__6963.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6962__6963.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6962__6963)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6962__6963)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6968__6969 = x;
    if(G__6968__6969) {
      if(function() {
        var or__3943__auto____6970 = G__6968__6969.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____6970) {
          return or__3943__auto____6970
        }else {
          return G__6968__6969.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6968__6969.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6968__6969)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6968__6969)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6974__6975 = x;
  if(G__6974__6975) {
    if(function() {
      var or__3943__auto____6976 = G__6974__6975.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____6976) {
        return or__3943__auto____6976
      }else {
        return G__6974__6975.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6974__6975.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6974__6975)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6974__6975)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6980__6981 = x;
  if(G__6980__6981) {
    if(function() {
      var or__3943__auto____6982 = G__6980__6981.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____6982) {
        return or__3943__auto____6982
      }else {
        return G__6980__6981.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6980__6981.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6980__6981)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6980__6981)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6986__6987 = x;
  if(G__6986__6987) {
    if(function() {
      var or__3943__auto____6988 = G__6986__6987.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____6988) {
        return or__3943__auto____6988
      }else {
        return G__6986__6987.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6986__6987.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6986__6987)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6986__6987)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6992__6993 = x;
  if(G__6992__6993) {
    if(function() {
      var or__3943__auto____6994 = G__6992__6993.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____6994) {
        return or__3943__auto____6994
      }else {
        return G__6992__6993.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6992__6993.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6992__6993)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6992__6993)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6998__6999 = x;
  if(G__6998__6999) {
    if(function() {
      var or__3943__auto____7000 = G__6998__6999.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____7000) {
        return or__3943__auto____7000
      }else {
        return G__6998__6999.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6998__6999.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6998__6999)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6998__6999)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7004__7005 = x;
    if(G__7004__7005) {
      if(function() {
        var or__3943__auto____7006 = G__7004__7005.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____7006) {
          return or__3943__auto____7006
        }else {
          return G__7004__7005.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7004__7005.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7004__7005)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7004__7005)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7010__7011 = x;
  if(G__7010__7011) {
    if(function() {
      var or__3943__auto____7012 = G__7010__7011.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____7012) {
        return or__3943__auto____7012
      }else {
        return G__7010__7011.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7010__7011.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7010__7011)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7010__7011)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7016__7017 = x;
  if(G__7016__7017) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____7018 = null;
      if(cljs.core.truth_(or__3943__auto____7018)) {
        return or__3943__auto____7018
      }else {
        return G__7016__7017.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7016__7017.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7016__7017)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7016__7017)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7019__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7019 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7019__delegate.call(this, keyvals)
    };
    G__7019.cljs$lang$maxFixedArity = 0;
    G__7019.cljs$lang$applyTo = function(arglist__7020) {
      var keyvals = cljs.core.seq(arglist__7020);
      return G__7019__delegate(keyvals)
    };
    G__7019.cljs$lang$arity$variadic = G__7019__delegate;
    return G__7019
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7022 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7022.push(key)
  });
  return keys__7022
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7026 = i;
  var j__7027 = j;
  var len__7028 = len;
  while(true) {
    if(len__7028 === 0) {
      return to
    }else {
      to[j__7027] = from[i__7026];
      var G__7029 = i__7026 + 1;
      var G__7030 = j__7027 + 1;
      var G__7031 = len__7028 - 1;
      i__7026 = G__7029;
      j__7027 = G__7030;
      len__7028 = G__7031;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7035 = i + (len - 1);
  var j__7036 = j + (len - 1);
  var len__7037 = len;
  while(true) {
    if(len__7037 === 0) {
      return to
    }else {
      to[j__7036] = from[i__7035];
      var G__7038 = i__7035 - 1;
      var G__7039 = j__7036 - 1;
      var G__7040 = len__7037 - 1;
      i__7035 = G__7038;
      j__7036 = G__7039;
      len__7037 = G__7040;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7044__7045 = s;
    if(G__7044__7045) {
      if(function() {
        var or__3943__auto____7046 = G__7044__7045.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____7046) {
          return or__3943__auto____7046
        }else {
          return G__7044__7045.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7044__7045.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7044__7045)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7044__7045)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7050__7051 = s;
  if(G__7050__7051) {
    if(function() {
      var or__3943__auto____7052 = G__7050__7051.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____7052) {
        return or__3943__auto____7052
      }else {
        return G__7050__7051.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7050__7051.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7050__7051)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7050__7051)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto____7055 = goog.isString(x);
  if(and__3941__auto____7055) {
    return!function() {
      var or__3943__auto____7056 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____7056) {
        return or__3943__auto____7056
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____7055
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____7058 = goog.isString(x);
  if(and__3941__auto____7058) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____7058
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____7060 = goog.isString(x);
  if(and__3941__auto____7060) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____7060
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____7065 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____7065) {
    return or__3943__auto____7065
  }else {
    var G__7066__7067 = f;
    if(G__7066__7067) {
      if(function() {
        var or__3943__auto____7068 = G__7066__7067.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____7068) {
          return or__3943__auto____7068
        }else {
          return G__7066__7067.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7066__7067.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7066__7067)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7066__7067)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____7070 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____7070) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____7070
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3941__auto____7073 = coll;
    if(cljs.core.truth_(and__3941__auto____7073)) {
      var and__3941__auto____7074 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____7074) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____7074
      }
    }else {
      return and__3941__auto____7073
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7083__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7079 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7080 = more;
        while(true) {
          var x__7081 = cljs.core.first.call(null, xs__7080);
          var etc__7082 = cljs.core.next.call(null, xs__7080);
          if(cljs.core.truth_(xs__7080)) {
            if(cljs.core.contains_QMARK_.call(null, s__7079, x__7081)) {
              return false
            }else {
              var G__7084 = cljs.core.conj.call(null, s__7079, x__7081);
              var G__7085 = etc__7082;
              s__7079 = G__7084;
              xs__7080 = G__7085;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7083 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7083__delegate.call(this, x, y, more)
    };
    G__7083.cljs$lang$maxFixedArity = 2;
    G__7083.cljs$lang$applyTo = function(arglist__7086) {
      var x = cljs.core.first(arglist__7086);
      var y = cljs.core.first(cljs.core.next(arglist__7086));
      var more = cljs.core.rest(cljs.core.next(arglist__7086));
      return G__7083__delegate(x, y, more)
    };
    G__7083.cljs$lang$arity$variadic = G__7083__delegate;
    return G__7083
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7090__7091 = x;
            if(G__7090__7091) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____7092 = null;
                if(cljs.core.truth_(or__3943__auto____7092)) {
                  return or__3943__auto____7092
                }else {
                  return G__7090__7091.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7090__7091.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7090__7091)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7090__7091)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7097 = cljs.core.count.call(null, xs);
    var yl__7098 = cljs.core.count.call(null, ys);
    if(xl__7097 < yl__7098) {
      return-1
    }else {
      if(xl__7097 > yl__7098) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7097, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7099 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____7100 = d__7099 === 0;
        if(and__3941__auto____7100) {
          return n + 1 < len
        }else {
          return and__3941__auto____7100
        }
      }()) {
        var G__7101 = xs;
        var G__7102 = ys;
        var G__7103 = len;
        var G__7104 = n + 1;
        xs = G__7101;
        ys = G__7102;
        len = G__7103;
        n = G__7104;
        continue
      }else {
        return d__7099
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7106 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7106)) {
        return r__7106
      }else {
        if(cljs.core.truth_(r__7106)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7108 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7108, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7108)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto____7114 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____7114) {
      var s__7115 = temp__4090__auto____7114;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7115), cljs.core.next.call(null, s__7115))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7116 = val;
    var coll__7117 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7117) {
        var nval__7118 = f.call(null, val__7116, cljs.core.first.call(null, coll__7117));
        if(cljs.core.reduced_QMARK_.call(null, nval__7118)) {
          return cljs.core.deref.call(null, nval__7118)
        }else {
          var G__7119 = nval__7118;
          var G__7120 = cljs.core.next.call(null, coll__7117);
          val__7116 = G__7119;
          coll__7117 = G__7120;
          continue
        }
      }else {
        return val__7116
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7122 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7122);
  return cljs.core.vec.call(null, a__7122)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7129__7130 = coll;
      if(G__7129__7130) {
        if(function() {
          var or__3943__auto____7131 = G__7129__7130.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7131) {
            return or__3943__auto____7131
          }else {
            return G__7129__7130.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7129__7130.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7129__7130)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7129__7130)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7132__7133 = coll;
      if(G__7132__7133) {
        if(function() {
          var or__3943__auto____7134 = G__7132__7133.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7134) {
            return or__3943__auto____7134
          }else {
            return G__7132__7133.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7132__7133.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7132__7133)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7132__7133)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7135 = this;
  return this__7135.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7136__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7136 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7136__delegate.call(this, x, y, more)
    };
    G__7136.cljs$lang$maxFixedArity = 2;
    G__7136.cljs$lang$applyTo = function(arglist__7137) {
      var x = cljs.core.first(arglist__7137);
      var y = cljs.core.first(cljs.core.next(arglist__7137));
      var more = cljs.core.rest(cljs.core.next(arglist__7137));
      return G__7136__delegate(x, y, more)
    };
    G__7136.cljs$lang$arity$variadic = G__7136__delegate;
    return G__7136
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7138__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7138 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7138__delegate.call(this, x, y, more)
    };
    G__7138.cljs$lang$maxFixedArity = 2;
    G__7138.cljs$lang$applyTo = function(arglist__7139) {
      var x = cljs.core.first(arglist__7139);
      var y = cljs.core.first(cljs.core.next(arglist__7139));
      var more = cljs.core.rest(cljs.core.next(arglist__7139));
      return G__7138__delegate(x, y, more)
    };
    G__7138.cljs$lang$arity$variadic = G__7138__delegate;
    return G__7138
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7140__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7140 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7140__delegate.call(this, x, y, more)
    };
    G__7140.cljs$lang$maxFixedArity = 2;
    G__7140.cljs$lang$applyTo = function(arglist__7141) {
      var x = cljs.core.first(arglist__7141);
      var y = cljs.core.first(cljs.core.next(arglist__7141));
      var more = cljs.core.rest(cljs.core.next(arglist__7141));
      return G__7140__delegate(x, y, more)
    };
    G__7140.cljs$lang$arity$variadic = G__7140__delegate;
    return G__7140
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7142__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7142 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7142__delegate.call(this, x, y, more)
    };
    G__7142.cljs$lang$maxFixedArity = 2;
    G__7142.cljs$lang$applyTo = function(arglist__7143) {
      var x = cljs.core.first(arglist__7143);
      var y = cljs.core.first(cljs.core.next(arglist__7143));
      var more = cljs.core.rest(cljs.core.next(arglist__7143));
      return G__7142__delegate(x, y, more)
    };
    G__7142.cljs$lang$arity$variadic = G__7142__delegate;
    return G__7142
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7144__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7145 = y;
            var G__7146 = cljs.core.first.call(null, more);
            var G__7147 = cljs.core.next.call(null, more);
            x = G__7145;
            y = G__7146;
            more = G__7147;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7144 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7144__delegate.call(this, x, y, more)
    };
    G__7144.cljs$lang$maxFixedArity = 2;
    G__7144.cljs$lang$applyTo = function(arglist__7148) {
      var x = cljs.core.first(arglist__7148);
      var y = cljs.core.first(cljs.core.next(arglist__7148));
      var more = cljs.core.rest(cljs.core.next(arglist__7148));
      return G__7144__delegate(x, y, more)
    };
    G__7144.cljs$lang$arity$variadic = G__7144__delegate;
    return G__7144
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7149__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7150 = y;
            var G__7151 = cljs.core.first.call(null, more);
            var G__7152 = cljs.core.next.call(null, more);
            x = G__7150;
            y = G__7151;
            more = G__7152;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7149 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7149__delegate.call(this, x, y, more)
    };
    G__7149.cljs$lang$maxFixedArity = 2;
    G__7149.cljs$lang$applyTo = function(arglist__7153) {
      var x = cljs.core.first(arglist__7153);
      var y = cljs.core.first(cljs.core.next(arglist__7153));
      var more = cljs.core.rest(cljs.core.next(arglist__7153));
      return G__7149__delegate(x, y, more)
    };
    G__7149.cljs$lang$arity$variadic = G__7149__delegate;
    return G__7149
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7154__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7155 = y;
            var G__7156 = cljs.core.first.call(null, more);
            var G__7157 = cljs.core.next.call(null, more);
            x = G__7155;
            y = G__7156;
            more = G__7157;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7154 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7154__delegate.call(this, x, y, more)
    };
    G__7154.cljs$lang$maxFixedArity = 2;
    G__7154.cljs$lang$applyTo = function(arglist__7158) {
      var x = cljs.core.first(arglist__7158);
      var y = cljs.core.first(cljs.core.next(arglist__7158));
      var more = cljs.core.rest(cljs.core.next(arglist__7158));
      return G__7154__delegate(x, y, more)
    };
    G__7154.cljs$lang$arity$variadic = G__7154__delegate;
    return G__7154
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7159__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7160 = y;
            var G__7161 = cljs.core.first.call(null, more);
            var G__7162 = cljs.core.next.call(null, more);
            x = G__7160;
            y = G__7161;
            more = G__7162;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7159__delegate.call(this, x, y, more)
    };
    G__7159.cljs$lang$maxFixedArity = 2;
    G__7159.cljs$lang$applyTo = function(arglist__7163) {
      var x = cljs.core.first(arglist__7163);
      var y = cljs.core.first(cljs.core.next(arglist__7163));
      var more = cljs.core.rest(cljs.core.next(arglist__7163));
      return G__7159__delegate(x, y, more)
    };
    G__7159.cljs$lang$arity$variadic = G__7159__delegate;
    return G__7159
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7164__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7164 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7164__delegate.call(this, x, y, more)
    };
    G__7164.cljs$lang$maxFixedArity = 2;
    G__7164.cljs$lang$applyTo = function(arglist__7165) {
      var x = cljs.core.first(arglist__7165);
      var y = cljs.core.first(cljs.core.next(arglist__7165));
      var more = cljs.core.rest(cljs.core.next(arglist__7165));
      return G__7164__delegate(x, y, more)
    };
    G__7164.cljs$lang$arity$variadic = G__7164__delegate;
    return G__7164
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7166__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7166 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7166__delegate.call(this, x, y, more)
    };
    G__7166.cljs$lang$maxFixedArity = 2;
    G__7166.cljs$lang$applyTo = function(arglist__7167) {
      var x = cljs.core.first(arglist__7167);
      var y = cljs.core.first(cljs.core.next(arglist__7167));
      var more = cljs.core.rest(cljs.core.next(arglist__7167));
      return G__7166__delegate(x, y, more)
    };
    G__7166.cljs$lang$arity$variadic = G__7166__delegate;
    return G__7166
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7169 = n % d;
  return cljs.core.fix.call(null, (n - rem__7169) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7171 = cljs.core.quot.call(null, n, d);
  return n - d * q__7171
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7174 = v - (v >> 1 & 1431655765);
  var v__7175 = (v__7174 & 858993459) + (v__7174 >> 2 & 858993459);
  return(v__7175 + (v__7175 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7176__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7177 = y;
            var G__7178 = cljs.core.first.call(null, more);
            var G__7179 = cljs.core.next.call(null, more);
            x = G__7177;
            y = G__7178;
            more = G__7179;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7176 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7176__delegate.call(this, x, y, more)
    };
    G__7176.cljs$lang$maxFixedArity = 2;
    G__7176.cljs$lang$applyTo = function(arglist__7180) {
      var x = cljs.core.first(arglist__7180);
      var y = cljs.core.first(cljs.core.next(arglist__7180));
      var more = cljs.core.rest(cljs.core.next(arglist__7180));
      return G__7176__delegate(x, y, more)
    };
    G__7176.cljs$lang$arity$variadic = G__7176__delegate;
    return G__7176
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7184 = n;
  var xs__7185 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____7186 = xs__7185;
      if(and__3941__auto____7186) {
        return n__7184 > 0
      }else {
        return and__3941__auto____7186
      }
    }())) {
      var G__7187 = n__7184 - 1;
      var G__7188 = cljs.core.next.call(null, xs__7185);
      n__7184 = G__7187;
      xs__7185 = G__7188;
      continue
    }else {
      return xs__7185
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7189__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7190 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7191 = cljs.core.next.call(null, more);
            sb = G__7190;
            more = G__7191;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7189 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7189__delegate.call(this, x, ys)
    };
    G__7189.cljs$lang$maxFixedArity = 1;
    G__7189.cljs$lang$applyTo = function(arglist__7192) {
      var x = cljs.core.first(arglist__7192);
      var ys = cljs.core.rest(arglist__7192);
      return G__7189__delegate(x, ys)
    };
    G__7189.cljs$lang$arity$variadic = G__7189__delegate;
    return G__7189
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7193__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7194 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7195 = cljs.core.next.call(null, more);
            sb = G__7194;
            more = G__7195;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7193 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7193__delegate.call(this, x, ys)
    };
    G__7193.cljs$lang$maxFixedArity = 1;
    G__7193.cljs$lang$applyTo = function(arglist__7196) {
      var x = cljs.core.first(arglist__7196);
      var ys = cljs.core.rest(arglist__7196);
      return G__7193__delegate(x, ys)
    };
    G__7193.cljs$lang$arity$variadic = G__7193__delegate;
    return G__7193
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7197) {
    var fmt = cljs.core.first(arglist__7197);
    var args = cljs.core.rest(arglist__7197);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7200 = cljs.core.seq.call(null, x);
    var ys__7201 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7200 == null) {
        return ys__7201 == null
      }else {
        if(ys__7201 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7200), cljs.core.first.call(null, ys__7201))) {
            var G__7202 = cljs.core.next.call(null, xs__7200);
            var G__7203 = cljs.core.next.call(null, ys__7201);
            xs__7200 = G__7202;
            ys__7201 = G__7203;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7204_SHARP_, p2__7205_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7204_SHARP_, cljs.core.hash.call(null, p2__7205_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7209 = 0;
  var s__7210 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7210) {
      var e__7211 = cljs.core.first.call(null, s__7210);
      var G__7212 = (h__7209 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7211)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7211)))) % 4503599627370496;
      var G__7213 = cljs.core.next.call(null, s__7210);
      h__7209 = G__7212;
      s__7210 = G__7213;
      continue
    }else {
      return h__7209
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7217 = 0;
  var s__7218 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7218) {
      var e__7219 = cljs.core.first.call(null, s__7218);
      var G__7220 = (h__7217 + cljs.core.hash.call(null, e__7219)) % 4503599627370496;
      var G__7221 = cljs.core.next.call(null, s__7218);
      h__7217 = G__7220;
      s__7218 = G__7221;
      continue
    }else {
      return h__7217
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7242__7243 = cljs.core.seq.call(null, fn_map);
  if(G__7242__7243) {
    var G__7245__7247 = cljs.core.first.call(null, G__7242__7243);
    var vec__7246__7248 = G__7245__7247;
    var key_name__7249 = cljs.core.nth.call(null, vec__7246__7248, 0, null);
    var f__7250 = cljs.core.nth.call(null, vec__7246__7248, 1, null);
    var G__7242__7251 = G__7242__7243;
    var G__7245__7252 = G__7245__7247;
    var G__7242__7253 = G__7242__7251;
    while(true) {
      var vec__7254__7255 = G__7245__7252;
      var key_name__7256 = cljs.core.nth.call(null, vec__7254__7255, 0, null);
      var f__7257 = cljs.core.nth.call(null, vec__7254__7255, 1, null);
      var G__7242__7258 = G__7242__7253;
      var str_name__7259 = cljs.core.name.call(null, key_name__7256);
      obj[str_name__7259] = f__7257;
      var temp__4092__auto____7260 = cljs.core.next.call(null, G__7242__7258);
      if(temp__4092__auto____7260) {
        var G__7242__7261 = temp__4092__auto____7260;
        var G__7262 = cljs.core.first.call(null, G__7242__7261);
        var G__7263 = G__7242__7261;
        G__7245__7252 = G__7262;
        G__7242__7253 = G__7263;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7264 = this;
  var h__2255__auto____7265 = this__7264.__hash;
  if(!(h__2255__auto____7265 == null)) {
    return h__2255__auto____7265
  }else {
    var h__2255__auto____7266 = cljs.core.hash_coll.call(null, coll);
    this__7264.__hash = h__2255__auto____7266;
    return h__2255__auto____7266
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7267 = this;
  if(this__7267.count === 1) {
    return null
  }else {
    return this__7267.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7268 = this;
  return new cljs.core.List(this__7268.meta, o, coll, this__7268.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7269 = this;
  var this__7270 = this;
  return cljs.core.pr_str.call(null, this__7270)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7271 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7272 = this;
  return this__7272.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7273 = this;
  return this__7273.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7274 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7275 = this;
  return this__7275.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7276 = this;
  if(this__7276.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7276.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7277 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7278 = this;
  return new cljs.core.List(meta, this__7278.first, this__7278.rest, this__7278.count, this__7278.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7279 = this;
  return this__7279.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7280 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7281 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7282 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7283 = this;
  return new cljs.core.List(this__7283.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7284 = this;
  var this__7285 = this;
  return cljs.core.pr_str.call(null, this__7285)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7286 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7287 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7288 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7289 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7290 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7291 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7292 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7293 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7294 = this;
  return this__7294.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7295 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7299__7300 = coll;
  if(G__7299__7300) {
    if(function() {
      var or__3943__auto____7301 = G__7299__7300.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____7301) {
        return or__3943__auto____7301
      }else {
        return G__7299__7300.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7299__7300.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7299__7300)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7299__7300)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7302__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7302 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7302__delegate.call(this, x, y, z, items)
    };
    G__7302.cljs$lang$maxFixedArity = 3;
    G__7302.cljs$lang$applyTo = function(arglist__7303) {
      var x = cljs.core.first(arglist__7303);
      var y = cljs.core.first(cljs.core.next(arglist__7303));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7303)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7303)));
      return G__7302__delegate(x, y, z, items)
    };
    G__7302.cljs$lang$arity$variadic = G__7302__delegate;
    return G__7302
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7304 = this;
  var h__2255__auto____7305 = this__7304.__hash;
  if(!(h__2255__auto____7305 == null)) {
    return h__2255__auto____7305
  }else {
    var h__2255__auto____7306 = cljs.core.hash_coll.call(null, coll);
    this__7304.__hash = h__2255__auto____7306;
    return h__2255__auto____7306
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7307 = this;
  if(this__7307.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7307.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7308 = this;
  return new cljs.core.Cons(null, o, coll, this__7308.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7309 = this;
  var this__7310 = this;
  return cljs.core.pr_str.call(null, this__7310)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7311 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7312 = this;
  return this__7312.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7313 = this;
  if(this__7313.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7313.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7314 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7315 = this;
  return new cljs.core.Cons(meta, this__7315.first, this__7315.rest, this__7315.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7316 = this;
  return this__7316.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7317 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7317.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____7322 = coll == null;
    if(or__3943__auto____7322) {
      return or__3943__auto____7322
    }else {
      var G__7323__7324 = coll;
      if(G__7323__7324) {
        if(function() {
          var or__3943__auto____7325 = G__7323__7324.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____7325) {
            return or__3943__auto____7325
          }else {
            return G__7323__7324.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7323__7324.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7323__7324)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7323__7324)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7329__7330 = x;
  if(G__7329__7330) {
    if(function() {
      var or__3943__auto____7331 = G__7329__7330.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____7331) {
        return or__3943__auto____7331
      }else {
        return G__7329__7330.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7329__7330.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7329__7330)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7329__7330)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7332 = null;
  var G__7332__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7332__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7332 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7332__2.call(this, string, f);
      case 3:
        return G__7332__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7332
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7333 = null;
  var G__7333__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7333__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7333 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7333__2.call(this, string, k);
      case 3:
        return G__7333__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7333
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7334 = null;
  var G__7334__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7334__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7334 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7334__2.call(this, string, n);
      case 3:
        return G__7334__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7334
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7346 = null;
  var G__7346__2 = function(this_sym7337, coll) {
    var this__7339 = this;
    var this_sym7337__7340 = this;
    var ___7341 = this_sym7337__7340;
    if(coll == null) {
      return null
    }else {
      var strobj__7342 = coll.strobj;
      if(strobj__7342 == null) {
        return cljs.core._lookup.call(null, coll, this__7339.k, null)
      }else {
        return strobj__7342[this__7339.k]
      }
    }
  };
  var G__7346__3 = function(this_sym7338, coll, not_found) {
    var this__7339 = this;
    var this_sym7338__7343 = this;
    var ___7344 = this_sym7338__7343;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7339.k, not_found)
    }
  };
  G__7346 = function(this_sym7338, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7346__2.call(this, this_sym7338, coll);
      case 3:
        return G__7346__3.call(this, this_sym7338, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7346
}();
cljs.core.Keyword.prototype.apply = function(this_sym7335, args7336) {
  var this__7345 = this;
  return this_sym7335.call.apply(this_sym7335, [this_sym7335].concat(args7336.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7355 = null;
  var G__7355__2 = function(this_sym7349, coll) {
    var this_sym7349__7351 = this;
    var this__7352 = this_sym7349__7351;
    return cljs.core._lookup.call(null, coll, this__7352.toString(), null)
  };
  var G__7355__3 = function(this_sym7350, coll, not_found) {
    var this_sym7350__7353 = this;
    var this__7354 = this_sym7350__7353;
    return cljs.core._lookup.call(null, coll, this__7354.toString(), not_found)
  };
  G__7355 = function(this_sym7350, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7355__2.call(this, this_sym7350, coll);
      case 3:
        return G__7355__3.call(this, this_sym7350, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7355
}();
String.prototype.apply = function(this_sym7347, args7348) {
  return this_sym7347.call.apply(this_sym7347, [this_sym7347].concat(args7348.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7357 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7357
  }else {
    lazy_seq.x = x__7357.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7358 = this;
  var h__2255__auto____7359 = this__7358.__hash;
  if(!(h__2255__auto____7359 == null)) {
    return h__2255__auto____7359
  }else {
    var h__2255__auto____7360 = cljs.core.hash_coll.call(null, coll);
    this__7358.__hash = h__2255__auto____7360;
    return h__2255__auto____7360
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7361 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7362 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7363 = this;
  var this__7364 = this;
  return cljs.core.pr_str.call(null, this__7364)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7365 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7366 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7367 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7368 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7369 = this;
  return new cljs.core.LazySeq(meta, this__7369.realized, this__7369.x, this__7369.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7370 = this;
  return this__7370.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7371 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7371.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7372 = this;
  return this__7372.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7373 = this;
  var ___7374 = this;
  this__7373.buf[this__7373.end] = o;
  return this__7373.end = this__7373.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7375 = this;
  var ___7376 = this;
  var ret__7377 = new cljs.core.ArrayChunk(this__7375.buf, 0, this__7375.end);
  this__7375.buf = null;
  return ret__7377
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7378 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7378.arr[this__7378.off], this__7378.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7379 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7379.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7380 = this;
  if(this__7380.off === this__7380.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7380.arr, this__7380.off + 1, this__7380.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7381 = this;
  return this__7381.arr[this__7381.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7382 = this;
  if(function() {
    var and__3941__auto____7383 = i >= 0;
    if(and__3941__auto____7383) {
      return i < this__7382.end - this__7382.off
    }else {
      return and__3941__auto____7383
    }
  }()) {
    return this__7382.arr[this__7382.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7384 = this;
  return this__7384.end - this__7384.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7385 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7386 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7387 = this;
  return cljs.core._nth.call(null, this__7387.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7388 = this;
  if(cljs.core._count.call(null, this__7388.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7388.chunk), this__7388.more, this__7388.meta)
  }else {
    if(this__7388.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7388.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7389 = this;
  if(this__7389.more == null) {
    return null
  }else {
    return this__7389.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7390 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7391 = this;
  return new cljs.core.ChunkedCons(this__7391.chunk, this__7391.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7392 = this;
  return this__7392.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7393 = this;
  return this__7393.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7394 = this;
  if(this__7394.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7394.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7398__7399 = s;
    if(G__7398__7399) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____7400 = null;
        if(cljs.core.truth_(or__3943__auto____7400)) {
          return or__3943__auto____7400
        }else {
          return G__7398__7399.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7398__7399.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7398__7399)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7398__7399)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7403 = [];
  var s__7404 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7404)) {
      ary__7403.push(cljs.core.first.call(null, s__7404));
      var G__7405 = cljs.core.next.call(null, s__7404);
      s__7404 = G__7405;
      continue
    }else {
      return ary__7403
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7409 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7410 = 0;
  var xs__7411 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7411) {
      ret__7409[i__7410] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7411));
      var G__7412 = i__7410 + 1;
      var G__7413 = cljs.core.next.call(null, xs__7411);
      i__7410 = G__7412;
      xs__7411 = G__7413;
      continue
    }else {
    }
    break
  }
  return ret__7409
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7421 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7422 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7423 = 0;
      var s__7424 = s__7422;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7425 = s__7424;
          if(and__3941__auto____7425) {
            return i__7423 < size
          }else {
            return and__3941__auto____7425
          }
        }())) {
          a__7421[i__7423] = cljs.core.first.call(null, s__7424);
          var G__7428 = i__7423 + 1;
          var G__7429 = cljs.core.next.call(null, s__7424);
          i__7423 = G__7428;
          s__7424 = G__7429;
          continue
        }else {
          return a__7421
        }
        break
      }
    }else {
      var n__2590__auto____7426 = size;
      var i__7427 = 0;
      while(true) {
        if(i__7427 < n__2590__auto____7426) {
          a__7421[i__7427] = init_val_or_seq;
          var G__7430 = i__7427 + 1;
          i__7427 = G__7430;
          continue
        }else {
        }
        break
      }
      return a__7421
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7438 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7439 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7440 = 0;
      var s__7441 = s__7439;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7442 = s__7441;
          if(and__3941__auto____7442) {
            return i__7440 < size
          }else {
            return and__3941__auto____7442
          }
        }())) {
          a__7438[i__7440] = cljs.core.first.call(null, s__7441);
          var G__7445 = i__7440 + 1;
          var G__7446 = cljs.core.next.call(null, s__7441);
          i__7440 = G__7445;
          s__7441 = G__7446;
          continue
        }else {
          return a__7438
        }
        break
      }
    }else {
      var n__2590__auto____7443 = size;
      var i__7444 = 0;
      while(true) {
        if(i__7444 < n__2590__auto____7443) {
          a__7438[i__7444] = init_val_or_seq;
          var G__7447 = i__7444 + 1;
          i__7444 = G__7447;
          continue
        }else {
        }
        break
      }
      return a__7438
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7455 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7456 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7457 = 0;
      var s__7458 = s__7456;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7459 = s__7458;
          if(and__3941__auto____7459) {
            return i__7457 < size
          }else {
            return and__3941__auto____7459
          }
        }())) {
          a__7455[i__7457] = cljs.core.first.call(null, s__7458);
          var G__7462 = i__7457 + 1;
          var G__7463 = cljs.core.next.call(null, s__7458);
          i__7457 = G__7462;
          s__7458 = G__7463;
          continue
        }else {
          return a__7455
        }
        break
      }
    }else {
      var n__2590__auto____7460 = size;
      var i__7461 = 0;
      while(true) {
        if(i__7461 < n__2590__auto____7460) {
          a__7455[i__7461] = init_val_or_seq;
          var G__7464 = i__7461 + 1;
          i__7461 = G__7464;
          continue
        }else {
        }
        break
      }
      return a__7455
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7469 = s;
    var i__7470 = n;
    var sum__7471 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____7472 = i__7470 > 0;
        if(and__3941__auto____7472) {
          return cljs.core.seq.call(null, s__7469)
        }else {
          return and__3941__auto____7472
        }
      }())) {
        var G__7473 = cljs.core.next.call(null, s__7469);
        var G__7474 = i__7470 - 1;
        var G__7475 = sum__7471 + 1;
        s__7469 = G__7473;
        i__7470 = G__7474;
        sum__7471 = G__7475;
        continue
      }else {
        return sum__7471
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7480 = cljs.core.seq.call(null, x);
      if(s__7480) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7480)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7480), concat.call(null, cljs.core.chunk_rest.call(null, s__7480), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7480), concat.call(null, cljs.core.rest.call(null, s__7480), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7484__delegate = function(x, y, zs) {
      var cat__7483 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7482 = cljs.core.seq.call(null, xys);
          if(xys__7482) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7482)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7482), cat.call(null, cljs.core.chunk_rest.call(null, xys__7482), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7482), cat.call(null, cljs.core.rest.call(null, xys__7482), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7483.call(null, concat.call(null, x, y), zs)
    };
    var G__7484 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7484__delegate.call(this, x, y, zs)
    };
    G__7484.cljs$lang$maxFixedArity = 2;
    G__7484.cljs$lang$applyTo = function(arglist__7485) {
      var x = cljs.core.first(arglist__7485);
      var y = cljs.core.first(cljs.core.next(arglist__7485));
      var zs = cljs.core.rest(cljs.core.next(arglist__7485));
      return G__7484__delegate(x, y, zs)
    };
    G__7484.cljs$lang$arity$variadic = G__7484__delegate;
    return G__7484
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7486__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7486 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7486__delegate.call(this, a, b, c, d, more)
    };
    G__7486.cljs$lang$maxFixedArity = 4;
    G__7486.cljs$lang$applyTo = function(arglist__7487) {
      var a = cljs.core.first(arglist__7487);
      var b = cljs.core.first(cljs.core.next(arglist__7487));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7487)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7487))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7487))));
      return G__7486__delegate(a, b, c, d, more)
    };
    G__7486.cljs$lang$arity$variadic = G__7486__delegate;
    return G__7486
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7529 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7530 = cljs.core._first.call(null, args__7529);
    var args__7531 = cljs.core._rest.call(null, args__7529);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7530)
      }else {
        return f.call(null, a__7530)
      }
    }else {
      var b__7532 = cljs.core._first.call(null, args__7531);
      var args__7533 = cljs.core._rest.call(null, args__7531);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7530, b__7532)
        }else {
          return f.call(null, a__7530, b__7532)
        }
      }else {
        var c__7534 = cljs.core._first.call(null, args__7533);
        var args__7535 = cljs.core._rest.call(null, args__7533);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7530, b__7532, c__7534)
          }else {
            return f.call(null, a__7530, b__7532, c__7534)
          }
        }else {
          var d__7536 = cljs.core._first.call(null, args__7535);
          var args__7537 = cljs.core._rest.call(null, args__7535);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7530, b__7532, c__7534, d__7536)
            }else {
              return f.call(null, a__7530, b__7532, c__7534, d__7536)
            }
          }else {
            var e__7538 = cljs.core._first.call(null, args__7537);
            var args__7539 = cljs.core._rest.call(null, args__7537);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7530, b__7532, c__7534, d__7536, e__7538)
              }else {
                return f.call(null, a__7530, b__7532, c__7534, d__7536, e__7538)
              }
            }else {
              var f__7540 = cljs.core._first.call(null, args__7539);
              var args__7541 = cljs.core._rest.call(null, args__7539);
              if(argc === 6) {
                if(f__7540.cljs$lang$arity$6) {
                  return f__7540.cljs$lang$arity$6(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540)
                }else {
                  return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540)
                }
              }else {
                var g__7542 = cljs.core._first.call(null, args__7541);
                var args__7543 = cljs.core._rest.call(null, args__7541);
                if(argc === 7) {
                  if(f__7540.cljs$lang$arity$7) {
                    return f__7540.cljs$lang$arity$7(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542)
                  }else {
                    return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542)
                  }
                }else {
                  var h__7544 = cljs.core._first.call(null, args__7543);
                  var args__7545 = cljs.core._rest.call(null, args__7543);
                  if(argc === 8) {
                    if(f__7540.cljs$lang$arity$8) {
                      return f__7540.cljs$lang$arity$8(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544)
                    }else {
                      return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544)
                    }
                  }else {
                    var i__7546 = cljs.core._first.call(null, args__7545);
                    var args__7547 = cljs.core._rest.call(null, args__7545);
                    if(argc === 9) {
                      if(f__7540.cljs$lang$arity$9) {
                        return f__7540.cljs$lang$arity$9(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546)
                      }else {
                        return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546)
                      }
                    }else {
                      var j__7548 = cljs.core._first.call(null, args__7547);
                      var args__7549 = cljs.core._rest.call(null, args__7547);
                      if(argc === 10) {
                        if(f__7540.cljs$lang$arity$10) {
                          return f__7540.cljs$lang$arity$10(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548)
                        }else {
                          return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548)
                        }
                      }else {
                        var k__7550 = cljs.core._first.call(null, args__7549);
                        var args__7551 = cljs.core._rest.call(null, args__7549);
                        if(argc === 11) {
                          if(f__7540.cljs$lang$arity$11) {
                            return f__7540.cljs$lang$arity$11(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550)
                          }else {
                            return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550)
                          }
                        }else {
                          var l__7552 = cljs.core._first.call(null, args__7551);
                          var args__7553 = cljs.core._rest.call(null, args__7551);
                          if(argc === 12) {
                            if(f__7540.cljs$lang$arity$12) {
                              return f__7540.cljs$lang$arity$12(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552)
                            }else {
                              return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552)
                            }
                          }else {
                            var m__7554 = cljs.core._first.call(null, args__7553);
                            var args__7555 = cljs.core._rest.call(null, args__7553);
                            if(argc === 13) {
                              if(f__7540.cljs$lang$arity$13) {
                                return f__7540.cljs$lang$arity$13(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554)
                              }else {
                                return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554)
                              }
                            }else {
                              var n__7556 = cljs.core._first.call(null, args__7555);
                              var args__7557 = cljs.core._rest.call(null, args__7555);
                              if(argc === 14) {
                                if(f__7540.cljs$lang$arity$14) {
                                  return f__7540.cljs$lang$arity$14(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556)
                                }else {
                                  return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556)
                                }
                              }else {
                                var o__7558 = cljs.core._first.call(null, args__7557);
                                var args__7559 = cljs.core._rest.call(null, args__7557);
                                if(argc === 15) {
                                  if(f__7540.cljs$lang$arity$15) {
                                    return f__7540.cljs$lang$arity$15(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558)
                                  }else {
                                    return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558)
                                  }
                                }else {
                                  var p__7560 = cljs.core._first.call(null, args__7559);
                                  var args__7561 = cljs.core._rest.call(null, args__7559);
                                  if(argc === 16) {
                                    if(f__7540.cljs$lang$arity$16) {
                                      return f__7540.cljs$lang$arity$16(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560)
                                    }else {
                                      return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560)
                                    }
                                  }else {
                                    var q__7562 = cljs.core._first.call(null, args__7561);
                                    var args__7563 = cljs.core._rest.call(null, args__7561);
                                    if(argc === 17) {
                                      if(f__7540.cljs$lang$arity$17) {
                                        return f__7540.cljs$lang$arity$17(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562)
                                      }else {
                                        return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562)
                                      }
                                    }else {
                                      var r__7564 = cljs.core._first.call(null, args__7563);
                                      var args__7565 = cljs.core._rest.call(null, args__7563);
                                      if(argc === 18) {
                                        if(f__7540.cljs$lang$arity$18) {
                                          return f__7540.cljs$lang$arity$18(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562, r__7564)
                                        }else {
                                          return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562, r__7564)
                                        }
                                      }else {
                                        var s__7566 = cljs.core._first.call(null, args__7565);
                                        var args__7567 = cljs.core._rest.call(null, args__7565);
                                        if(argc === 19) {
                                          if(f__7540.cljs$lang$arity$19) {
                                            return f__7540.cljs$lang$arity$19(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562, r__7564, s__7566)
                                          }else {
                                            return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562, r__7564, s__7566)
                                          }
                                        }else {
                                          var t__7568 = cljs.core._first.call(null, args__7567);
                                          var args__7569 = cljs.core._rest.call(null, args__7567);
                                          if(argc === 20) {
                                            if(f__7540.cljs$lang$arity$20) {
                                              return f__7540.cljs$lang$arity$20(a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562, r__7564, s__7566, t__7568)
                                            }else {
                                              return f__7540.call(null, a__7530, b__7532, c__7534, d__7536, e__7538, f__7540, g__7542, h__7544, i__7546, j__7548, k__7550, l__7552, m__7554, n__7556, o__7558, p__7560, q__7562, r__7564, s__7566, t__7568)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7584 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7585 = cljs.core.bounded_count.call(null, args, fixed_arity__7584 + 1);
      if(bc__7585 <= fixed_arity__7584) {
        return cljs.core.apply_to.call(null, f, bc__7585, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7586 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7587 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7588 = cljs.core.bounded_count.call(null, arglist__7586, fixed_arity__7587 + 1);
      if(bc__7588 <= fixed_arity__7587) {
        return cljs.core.apply_to.call(null, f, bc__7588, arglist__7586)
      }else {
        return f.cljs$lang$applyTo(arglist__7586)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7586))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7589 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7590 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7591 = cljs.core.bounded_count.call(null, arglist__7589, fixed_arity__7590 + 1);
      if(bc__7591 <= fixed_arity__7590) {
        return cljs.core.apply_to.call(null, f, bc__7591, arglist__7589)
      }else {
        return f.cljs$lang$applyTo(arglist__7589)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7589))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7592 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7593 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7594 = cljs.core.bounded_count.call(null, arglist__7592, fixed_arity__7593 + 1);
      if(bc__7594 <= fixed_arity__7593) {
        return cljs.core.apply_to.call(null, f, bc__7594, arglist__7592)
      }else {
        return f.cljs$lang$applyTo(arglist__7592)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7592))
    }
  };
  var apply__6 = function() {
    var G__7598__delegate = function(f, a, b, c, d, args) {
      var arglist__7595 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7596 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7597 = cljs.core.bounded_count.call(null, arglist__7595, fixed_arity__7596 + 1);
        if(bc__7597 <= fixed_arity__7596) {
          return cljs.core.apply_to.call(null, f, bc__7597, arglist__7595)
        }else {
          return f.cljs$lang$applyTo(arglist__7595)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7595))
      }
    };
    var G__7598 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7598__delegate.call(this, f, a, b, c, d, args)
    };
    G__7598.cljs$lang$maxFixedArity = 5;
    G__7598.cljs$lang$applyTo = function(arglist__7599) {
      var f = cljs.core.first(arglist__7599);
      var a = cljs.core.first(cljs.core.next(arglist__7599));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7599)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7599))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7599)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7599)))));
      return G__7598__delegate(f, a, b, c, d, args)
    };
    G__7598.cljs$lang$arity$variadic = G__7598__delegate;
    return G__7598
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7600) {
    var obj = cljs.core.first(arglist__7600);
    var f = cljs.core.first(cljs.core.next(arglist__7600));
    var args = cljs.core.rest(cljs.core.next(arglist__7600));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7601__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7601 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7601__delegate.call(this, x, y, more)
    };
    G__7601.cljs$lang$maxFixedArity = 2;
    G__7601.cljs$lang$applyTo = function(arglist__7602) {
      var x = cljs.core.first(arglist__7602);
      var y = cljs.core.first(cljs.core.next(arglist__7602));
      var more = cljs.core.rest(cljs.core.next(arglist__7602));
      return G__7601__delegate(x, y, more)
    };
    G__7601.cljs$lang$arity$variadic = G__7601__delegate;
    return G__7601
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7603 = pred;
        var G__7604 = cljs.core.next.call(null, coll);
        pred = G__7603;
        coll = G__7604;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto____7606 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____7606)) {
        return or__3943__auto____7606
      }else {
        var G__7607 = pred;
        var G__7608 = cljs.core.next.call(null, coll);
        pred = G__7607;
        coll = G__7608;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7609 = null;
    var G__7609__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7609__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7609__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7609__3 = function() {
      var G__7610__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7610 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7610__delegate.call(this, x, y, zs)
      };
      G__7610.cljs$lang$maxFixedArity = 2;
      G__7610.cljs$lang$applyTo = function(arglist__7611) {
        var x = cljs.core.first(arglist__7611);
        var y = cljs.core.first(cljs.core.next(arglist__7611));
        var zs = cljs.core.rest(cljs.core.next(arglist__7611));
        return G__7610__delegate(x, y, zs)
      };
      G__7610.cljs$lang$arity$variadic = G__7610__delegate;
      return G__7610
    }();
    G__7609 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7609__0.call(this);
        case 1:
          return G__7609__1.call(this, x);
        case 2:
          return G__7609__2.call(this, x, y);
        default:
          return G__7609__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7609.cljs$lang$maxFixedArity = 2;
    G__7609.cljs$lang$applyTo = G__7609__3.cljs$lang$applyTo;
    return G__7609
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7612__delegate = function(args) {
      return x
    };
    var G__7612 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7612__delegate.call(this, args)
    };
    G__7612.cljs$lang$maxFixedArity = 0;
    G__7612.cljs$lang$applyTo = function(arglist__7613) {
      var args = cljs.core.seq(arglist__7613);
      return G__7612__delegate(args)
    };
    G__7612.cljs$lang$arity$variadic = G__7612__delegate;
    return G__7612
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7620 = null;
      var G__7620__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7620__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7620__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7620__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7620__4 = function() {
        var G__7621__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7621 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7621__delegate.call(this, x, y, z, args)
        };
        G__7621.cljs$lang$maxFixedArity = 3;
        G__7621.cljs$lang$applyTo = function(arglist__7622) {
          var x = cljs.core.first(arglist__7622);
          var y = cljs.core.first(cljs.core.next(arglist__7622));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7622)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7622)));
          return G__7621__delegate(x, y, z, args)
        };
        G__7621.cljs$lang$arity$variadic = G__7621__delegate;
        return G__7621
      }();
      G__7620 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7620__0.call(this);
          case 1:
            return G__7620__1.call(this, x);
          case 2:
            return G__7620__2.call(this, x, y);
          case 3:
            return G__7620__3.call(this, x, y, z);
          default:
            return G__7620__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7620.cljs$lang$maxFixedArity = 3;
      G__7620.cljs$lang$applyTo = G__7620__4.cljs$lang$applyTo;
      return G__7620
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7623 = null;
      var G__7623__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7623__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7623__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7623__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7623__4 = function() {
        var G__7624__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7624 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7624__delegate.call(this, x, y, z, args)
        };
        G__7624.cljs$lang$maxFixedArity = 3;
        G__7624.cljs$lang$applyTo = function(arglist__7625) {
          var x = cljs.core.first(arglist__7625);
          var y = cljs.core.first(cljs.core.next(arglist__7625));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7625)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7625)));
          return G__7624__delegate(x, y, z, args)
        };
        G__7624.cljs$lang$arity$variadic = G__7624__delegate;
        return G__7624
      }();
      G__7623 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7623__0.call(this);
          case 1:
            return G__7623__1.call(this, x);
          case 2:
            return G__7623__2.call(this, x, y);
          case 3:
            return G__7623__3.call(this, x, y, z);
          default:
            return G__7623__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7623.cljs$lang$maxFixedArity = 3;
      G__7623.cljs$lang$applyTo = G__7623__4.cljs$lang$applyTo;
      return G__7623
    }()
  };
  var comp__4 = function() {
    var G__7626__delegate = function(f1, f2, f3, fs) {
      var fs__7617 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7627__delegate = function(args) {
          var ret__7618 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7617), args);
          var fs__7619 = cljs.core.next.call(null, fs__7617);
          while(true) {
            if(fs__7619) {
              var G__7628 = cljs.core.first.call(null, fs__7619).call(null, ret__7618);
              var G__7629 = cljs.core.next.call(null, fs__7619);
              ret__7618 = G__7628;
              fs__7619 = G__7629;
              continue
            }else {
              return ret__7618
            }
            break
          }
        };
        var G__7627 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7627__delegate.call(this, args)
        };
        G__7627.cljs$lang$maxFixedArity = 0;
        G__7627.cljs$lang$applyTo = function(arglist__7630) {
          var args = cljs.core.seq(arglist__7630);
          return G__7627__delegate(args)
        };
        G__7627.cljs$lang$arity$variadic = G__7627__delegate;
        return G__7627
      }()
    };
    var G__7626 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7626__delegate.call(this, f1, f2, f3, fs)
    };
    G__7626.cljs$lang$maxFixedArity = 3;
    G__7626.cljs$lang$applyTo = function(arglist__7631) {
      var f1 = cljs.core.first(arglist__7631);
      var f2 = cljs.core.first(cljs.core.next(arglist__7631));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7631)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7631)));
      return G__7626__delegate(f1, f2, f3, fs)
    };
    G__7626.cljs$lang$arity$variadic = G__7626__delegate;
    return G__7626
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7632__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7632 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7632__delegate.call(this, args)
      };
      G__7632.cljs$lang$maxFixedArity = 0;
      G__7632.cljs$lang$applyTo = function(arglist__7633) {
        var args = cljs.core.seq(arglist__7633);
        return G__7632__delegate(args)
      };
      G__7632.cljs$lang$arity$variadic = G__7632__delegate;
      return G__7632
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7634__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7634 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7634__delegate.call(this, args)
      };
      G__7634.cljs$lang$maxFixedArity = 0;
      G__7634.cljs$lang$applyTo = function(arglist__7635) {
        var args = cljs.core.seq(arglist__7635);
        return G__7634__delegate(args)
      };
      G__7634.cljs$lang$arity$variadic = G__7634__delegate;
      return G__7634
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7636__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7636 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7636__delegate.call(this, args)
      };
      G__7636.cljs$lang$maxFixedArity = 0;
      G__7636.cljs$lang$applyTo = function(arglist__7637) {
        var args = cljs.core.seq(arglist__7637);
        return G__7636__delegate(args)
      };
      G__7636.cljs$lang$arity$variadic = G__7636__delegate;
      return G__7636
    }()
  };
  var partial__5 = function() {
    var G__7638__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7639__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7639 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7639__delegate.call(this, args)
        };
        G__7639.cljs$lang$maxFixedArity = 0;
        G__7639.cljs$lang$applyTo = function(arglist__7640) {
          var args = cljs.core.seq(arglist__7640);
          return G__7639__delegate(args)
        };
        G__7639.cljs$lang$arity$variadic = G__7639__delegate;
        return G__7639
      }()
    };
    var G__7638 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7638__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7638.cljs$lang$maxFixedArity = 4;
    G__7638.cljs$lang$applyTo = function(arglist__7641) {
      var f = cljs.core.first(arglist__7641);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7641));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7641)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7641))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7641))));
      return G__7638__delegate(f, arg1, arg2, arg3, more)
    };
    G__7638.cljs$lang$arity$variadic = G__7638__delegate;
    return G__7638
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7642 = null;
      var G__7642__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7642__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7642__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7642__4 = function() {
        var G__7643__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7643 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7643__delegate.call(this, a, b, c, ds)
        };
        G__7643.cljs$lang$maxFixedArity = 3;
        G__7643.cljs$lang$applyTo = function(arglist__7644) {
          var a = cljs.core.first(arglist__7644);
          var b = cljs.core.first(cljs.core.next(arglist__7644));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7644)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7644)));
          return G__7643__delegate(a, b, c, ds)
        };
        G__7643.cljs$lang$arity$variadic = G__7643__delegate;
        return G__7643
      }();
      G__7642 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7642__1.call(this, a);
          case 2:
            return G__7642__2.call(this, a, b);
          case 3:
            return G__7642__3.call(this, a, b, c);
          default:
            return G__7642__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7642.cljs$lang$maxFixedArity = 3;
      G__7642.cljs$lang$applyTo = G__7642__4.cljs$lang$applyTo;
      return G__7642
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7645 = null;
      var G__7645__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7645__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7645__4 = function() {
        var G__7646__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7646 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7646__delegate.call(this, a, b, c, ds)
        };
        G__7646.cljs$lang$maxFixedArity = 3;
        G__7646.cljs$lang$applyTo = function(arglist__7647) {
          var a = cljs.core.first(arglist__7647);
          var b = cljs.core.first(cljs.core.next(arglist__7647));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7647)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7647)));
          return G__7646__delegate(a, b, c, ds)
        };
        G__7646.cljs$lang$arity$variadic = G__7646__delegate;
        return G__7646
      }();
      G__7645 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7645__2.call(this, a, b);
          case 3:
            return G__7645__3.call(this, a, b, c);
          default:
            return G__7645__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7645.cljs$lang$maxFixedArity = 3;
      G__7645.cljs$lang$applyTo = G__7645__4.cljs$lang$applyTo;
      return G__7645
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7648 = null;
      var G__7648__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7648__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7648__4 = function() {
        var G__7649__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7649 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7649__delegate.call(this, a, b, c, ds)
        };
        G__7649.cljs$lang$maxFixedArity = 3;
        G__7649.cljs$lang$applyTo = function(arglist__7650) {
          var a = cljs.core.first(arglist__7650);
          var b = cljs.core.first(cljs.core.next(arglist__7650));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7650)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7650)));
          return G__7649__delegate(a, b, c, ds)
        };
        G__7649.cljs$lang$arity$variadic = G__7649__delegate;
        return G__7649
      }();
      G__7648 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7648__2.call(this, a, b);
          case 3:
            return G__7648__3.call(this, a, b, c);
          default:
            return G__7648__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7648.cljs$lang$maxFixedArity = 3;
      G__7648.cljs$lang$applyTo = G__7648__4.cljs$lang$applyTo;
      return G__7648
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7666 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7674 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7674) {
        var s__7675 = temp__4092__auto____7674;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7675)) {
          var c__7676 = cljs.core.chunk_first.call(null, s__7675);
          var size__7677 = cljs.core.count.call(null, c__7676);
          var b__7678 = cljs.core.chunk_buffer.call(null, size__7677);
          var n__2590__auto____7679 = size__7677;
          var i__7680 = 0;
          while(true) {
            if(i__7680 < n__2590__auto____7679) {
              cljs.core.chunk_append.call(null, b__7678, f.call(null, idx + i__7680, cljs.core._nth.call(null, c__7676, i__7680)));
              var G__7681 = i__7680 + 1;
              i__7680 = G__7681;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7678), mapi.call(null, idx + size__7677, cljs.core.chunk_rest.call(null, s__7675)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7675)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7675)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7666.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7691 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7691) {
      var s__7692 = temp__4092__auto____7691;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7692)) {
        var c__7693 = cljs.core.chunk_first.call(null, s__7692);
        var size__7694 = cljs.core.count.call(null, c__7693);
        var b__7695 = cljs.core.chunk_buffer.call(null, size__7694);
        var n__2590__auto____7696 = size__7694;
        var i__7697 = 0;
        while(true) {
          if(i__7697 < n__2590__auto____7696) {
            var x__7698 = f.call(null, cljs.core._nth.call(null, c__7693, i__7697));
            if(x__7698 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7695, x__7698)
            }
            var G__7700 = i__7697 + 1;
            i__7697 = G__7700;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7695), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7692)))
      }else {
        var x__7699 = f.call(null, cljs.core.first.call(null, s__7692));
        if(x__7699 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7692))
        }else {
          return cljs.core.cons.call(null, x__7699, keep.call(null, f, cljs.core.rest.call(null, s__7692)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7726 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7736 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7736) {
        var s__7737 = temp__4092__auto____7736;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7737)) {
          var c__7738 = cljs.core.chunk_first.call(null, s__7737);
          var size__7739 = cljs.core.count.call(null, c__7738);
          var b__7740 = cljs.core.chunk_buffer.call(null, size__7739);
          var n__2590__auto____7741 = size__7739;
          var i__7742 = 0;
          while(true) {
            if(i__7742 < n__2590__auto____7741) {
              var x__7743 = f.call(null, idx + i__7742, cljs.core._nth.call(null, c__7738, i__7742));
              if(x__7743 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7740, x__7743)
              }
              var G__7745 = i__7742 + 1;
              i__7742 = G__7745;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7740), keepi.call(null, idx + size__7739, cljs.core.chunk_rest.call(null, s__7737)))
        }else {
          var x__7744 = f.call(null, idx, cljs.core.first.call(null, s__7737));
          if(x__7744 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7737))
          }else {
            return cljs.core.cons.call(null, x__7744, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7737)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7726.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7831 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7831)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____7831
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7832 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7832)) {
            var and__3941__auto____7833 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7833)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____7833
            }
          }else {
            return and__3941__auto____7832
          }
        }())
      };
      var ep1__4 = function() {
        var G__7902__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7834 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7834)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____7834
            }
          }())
        };
        var G__7902 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7902__delegate.call(this, x, y, z, args)
        };
        G__7902.cljs$lang$maxFixedArity = 3;
        G__7902.cljs$lang$applyTo = function(arglist__7903) {
          var x = cljs.core.first(arglist__7903);
          var y = cljs.core.first(cljs.core.next(arglist__7903));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7903)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7903)));
          return G__7902__delegate(x, y, z, args)
        };
        G__7902.cljs$lang$arity$variadic = G__7902__delegate;
        return G__7902
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7846 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7846)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____7846
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7847 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7847)) {
            var and__3941__auto____7848 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7848)) {
              var and__3941__auto____7849 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7849)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____7849
              }
            }else {
              return and__3941__auto____7848
            }
          }else {
            return and__3941__auto____7847
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7850 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7850)) {
            var and__3941__auto____7851 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7851)) {
              var and__3941__auto____7852 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____7852)) {
                var and__3941__auto____7853 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____7853)) {
                  var and__3941__auto____7854 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7854)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____7854
                  }
                }else {
                  return and__3941__auto____7853
                }
              }else {
                return and__3941__auto____7852
              }
            }else {
              return and__3941__auto____7851
            }
          }else {
            return and__3941__auto____7850
          }
        }())
      };
      var ep2__4 = function() {
        var G__7904__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7855 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7855)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7701_SHARP_) {
                var and__3941__auto____7856 = p1.call(null, p1__7701_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7856)) {
                  return p2.call(null, p1__7701_SHARP_)
                }else {
                  return and__3941__auto____7856
                }
              }, args)
            }else {
              return and__3941__auto____7855
            }
          }())
        };
        var G__7904 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7904__delegate.call(this, x, y, z, args)
        };
        G__7904.cljs$lang$maxFixedArity = 3;
        G__7904.cljs$lang$applyTo = function(arglist__7905) {
          var x = cljs.core.first(arglist__7905);
          var y = cljs.core.first(cljs.core.next(arglist__7905));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7905)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7905)));
          return G__7904__delegate(x, y, z, args)
        };
        G__7904.cljs$lang$arity$variadic = G__7904__delegate;
        return G__7904
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7875 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7875)) {
            var and__3941__auto____7876 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7876)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____7876
            }
          }else {
            return and__3941__auto____7875
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7877 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7877)) {
            var and__3941__auto____7878 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7878)) {
              var and__3941__auto____7879 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7879)) {
                var and__3941__auto____7880 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7880)) {
                  var and__3941__auto____7881 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7881)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____7881
                  }
                }else {
                  return and__3941__auto____7880
                }
              }else {
                return and__3941__auto____7879
              }
            }else {
              return and__3941__auto____7878
            }
          }else {
            return and__3941__auto____7877
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7882 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7882)) {
            var and__3941__auto____7883 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7883)) {
              var and__3941__auto____7884 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7884)) {
                var and__3941__auto____7885 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7885)) {
                  var and__3941__auto____7886 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7886)) {
                    var and__3941__auto____7887 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____7887)) {
                      var and__3941__auto____7888 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____7888)) {
                        var and__3941__auto____7889 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____7889)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____7889
                        }
                      }else {
                        return and__3941__auto____7888
                      }
                    }else {
                      return and__3941__auto____7887
                    }
                  }else {
                    return and__3941__auto____7886
                  }
                }else {
                  return and__3941__auto____7885
                }
              }else {
                return and__3941__auto____7884
              }
            }else {
              return and__3941__auto____7883
            }
          }else {
            return and__3941__auto____7882
          }
        }())
      };
      var ep3__4 = function() {
        var G__7906__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7890 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7890)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7702_SHARP_) {
                var and__3941__auto____7891 = p1.call(null, p1__7702_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7891)) {
                  var and__3941__auto____7892 = p2.call(null, p1__7702_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____7892)) {
                    return p3.call(null, p1__7702_SHARP_)
                  }else {
                    return and__3941__auto____7892
                  }
                }else {
                  return and__3941__auto____7891
                }
              }, args)
            }else {
              return and__3941__auto____7890
            }
          }())
        };
        var G__7906 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7906__delegate.call(this, x, y, z, args)
        };
        G__7906.cljs$lang$maxFixedArity = 3;
        G__7906.cljs$lang$applyTo = function(arglist__7907) {
          var x = cljs.core.first(arglist__7907);
          var y = cljs.core.first(cljs.core.next(arglist__7907));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7907)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7907)));
          return G__7906__delegate(x, y, z, args)
        };
        G__7906.cljs$lang$arity$variadic = G__7906__delegate;
        return G__7906
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7908__delegate = function(p1, p2, p3, ps) {
      var ps__7893 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7703_SHARP_) {
            return p1__7703_SHARP_.call(null, x)
          }, ps__7893)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7704_SHARP_) {
            var and__3941__auto____7898 = p1__7704_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7898)) {
              return p1__7704_SHARP_.call(null, y)
            }else {
              return and__3941__auto____7898
            }
          }, ps__7893)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7705_SHARP_) {
            var and__3941__auto____7899 = p1__7705_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7899)) {
              var and__3941__auto____7900 = p1__7705_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____7900)) {
                return p1__7705_SHARP_.call(null, z)
              }else {
                return and__3941__auto____7900
              }
            }else {
              return and__3941__auto____7899
            }
          }, ps__7893)
        };
        var epn__4 = function() {
          var G__7909__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____7901 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____7901)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7706_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7706_SHARP_, args)
                }, ps__7893)
              }else {
                return and__3941__auto____7901
              }
            }())
          };
          var G__7909 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7909__delegate.call(this, x, y, z, args)
          };
          G__7909.cljs$lang$maxFixedArity = 3;
          G__7909.cljs$lang$applyTo = function(arglist__7910) {
            var x = cljs.core.first(arglist__7910);
            var y = cljs.core.first(cljs.core.next(arglist__7910));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7910)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7910)));
            return G__7909__delegate(x, y, z, args)
          };
          G__7909.cljs$lang$arity$variadic = G__7909__delegate;
          return G__7909
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7908 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7908__delegate.call(this, p1, p2, p3, ps)
    };
    G__7908.cljs$lang$maxFixedArity = 3;
    G__7908.cljs$lang$applyTo = function(arglist__7911) {
      var p1 = cljs.core.first(arglist__7911);
      var p2 = cljs.core.first(cljs.core.next(arglist__7911));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7911)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7911)));
      return G__7908__delegate(p1, p2, p3, ps)
    };
    G__7908.cljs$lang$arity$variadic = G__7908__delegate;
    return G__7908
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto____7992 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7992)) {
          return or__3943__auto____7992
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____7993 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7993)) {
          return or__3943__auto____7993
        }else {
          var or__3943__auto____7994 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7994)) {
            return or__3943__auto____7994
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8063__delegate = function(x, y, z, args) {
          var or__3943__auto____7995 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7995)) {
            return or__3943__auto____7995
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8063 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8063__delegate.call(this, x, y, z, args)
        };
        G__8063.cljs$lang$maxFixedArity = 3;
        G__8063.cljs$lang$applyTo = function(arglist__8064) {
          var x = cljs.core.first(arglist__8064);
          var y = cljs.core.first(cljs.core.next(arglist__8064));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8064)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8064)));
          return G__8063__delegate(x, y, z, args)
        };
        G__8063.cljs$lang$arity$variadic = G__8063__delegate;
        return G__8063
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto____8007 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____8007)) {
          return or__3943__auto____8007
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____8008 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____8008)) {
          return or__3943__auto____8008
        }else {
          var or__3943__auto____8009 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____8009)) {
            return or__3943__auto____8009
          }else {
            var or__3943__auto____8010 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____8010)) {
              return or__3943__auto____8010
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____8011 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____8011)) {
          return or__3943__auto____8011
        }else {
          var or__3943__auto____8012 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____8012)) {
            return or__3943__auto____8012
          }else {
            var or__3943__auto____8013 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____8013)) {
              return or__3943__auto____8013
            }else {
              var or__3943__auto____8014 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____8014)) {
                return or__3943__auto____8014
              }else {
                var or__3943__auto____8015 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____8015)) {
                  return or__3943__auto____8015
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8065__delegate = function(x, y, z, args) {
          var or__3943__auto____8016 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____8016)) {
            return or__3943__auto____8016
          }else {
            return cljs.core.some.call(null, function(p1__7746_SHARP_) {
              var or__3943__auto____8017 = p1.call(null, p1__7746_SHARP_);
              if(cljs.core.truth_(or__3943__auto____8017)) {
                return or__3943__auto____8017
              }else {
                return p2.call(null, p1__7746_SHARP_)
              }
            }, args)
          }
        };
        var G__8065 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8065__delegate.call(this, x, y, z, args)
        };
        G__8065.cljs$lang$maxFixedArity = 3;
        G__8065.cljs$lang$applyTo = function(arglist__8066) {
          var x = cljs.core.first(arglist__8066);
          var y = cljs.core.first(cljs.core.next(arglist__8066));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8066)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8066)));
          return G__8065__delegate(x, y, z, args)
        };
        G__8065.cljs$lang$arity$variadic = G__8065__delegate;
        return G__8065
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto____8036 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____8036)) {
          return or__3943__auto____8036
        }else {
          var or__3943__auto____8037 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____8037)) {
            return or__3943__auto____8037
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____8038 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____8038)) {
          return or__3943__auto____8038
        }else {
          var or__3943__auto____8039 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____8039)) {
            return or__3943__auto____8039
          }else {
            var or__3943__auto____8040 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____8040)) {
              return or__3943__auto____8040
            }else {
              var or__3943__auto____8041 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____8041)) {
                return or__3943__auto____8041
              }else {
                var or__3943__auto____8042 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____8042)) {
                  return or__3943__auto____8042
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____8043 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____8043)) {
          return or__3943__auto____8043
        }else {
          var or__3943__auto____8044 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____8044)) {
            return or__3943__auto____8044
          }else {
            var or__3943__auto____8045 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____8045)) {
              return or__3943__auto____8045
            }else {
              var or__3943__auto____8046 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____8046)) {
                return or__3943__auto____8046
              }else {
                var or__3943__auto____8047 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____8047)) {
                  return or__3943__auto____8047
                }else {
                  var or__3943__auto____8048 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____8048)) {
                    return or__3943__auto____8048
                  }else {
                    var or__3943__auto____8049 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____8049)) {
                      return or__3943__auto____8049
                    }else {
                      var or__3943__auto____8050 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____8050)) {
                        return or__3943__auto____8050
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8067__delegate = function(x, y, z, args) {
          var or__3943__auto____8051 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____8051)) {
            return or__3943__auto____8051
          }else {
            return cljs.core.some.call(null, function(p1__7747_SHARP_) {
              var or__3943__auto____8052 = p1.call(null, p1__7747_SHARP_);
              if(cljs.core.truth_(or__3943__auto____8052)) {
                return or__3943__auto____8052
              }else {
                var or__3943__auto____8053 = p2.call(null, p1__7747_SHARP_);
                if(cljs.core.truth_(or__3943__auto____8053)) {
                  return or__3943__auto____8053
                }else {
                  return p3.call(null, p1__7747_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8067 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8067__delegate.call(this, x, y, z, args)
        };
        G__8067.cljs$lang$maxFixedArity = 3;
        G__8067.cljs$lang$applyTo = function(arglist__8068) {
          var x = cljs.core.first(arglist__8068);
          var y = cljs.core.first(cljs.core.next(arglist__8068));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8068)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8068)));
          return G__8067__delegate(x, y, z, args)
        };
        G__8067.cljs$lang$arity$variadic = G__8067__delegate;
        return G__8067
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8069__delegate = function(p1, p2, p3, ps) {
      var ps__8054 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7748_SHARP_) {
            return p1__7748_SHARP_.call(null, x)
          }, ps__8054)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7749_SHARP_) {
            var or__3943__auto____8059 = p1__7749_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____8059)) {
              return or__3943__auto____8059
            }else {
              return p1__7749_SHARP_.call(null, y)
            }
          }, ps__8054)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7750_SHARP_) {
            var or__3943__auto____8060 = p1__7750_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____8060)) {
              return or__3943__auto____8060
            }else {
              var or__3943__auto____8061 = p1__7750_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____8061)) {
                return or__3943__auto____8061
              }else {
                return p1__7750_SHARP_.call(null, z)
              }
            }
          }, ps__8054)
        };
        var spn__4 = function() {
          var G__8070__delegate = function(x, y, z, args) {
            var or__3943__auto____8062 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____8062)) {
              return or__3943__auto____8062
            }else {
              return cljs.core.some.call(null, function(p1__7751_SHARP_) {
                return cljs.core.some.call(null, p1__7751_SHARP_, args)
              }, ps__8054)
            }
          };
          var G__8070 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8070__delegate.call(this, x, y, z, args)
          };
          G__8070.cljs$lang$maxFixedArity = 3;
          G__8070.cljs$lang$applyTo = function(arglist__8071) {
            var x = cljs.core.first(arglist__8071);
            var y = cljs.core.first(cljs.core.next(arglist__8071));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8071)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8071)));
            return G__8070__delegate(x, y, z, args)
          };
          G__8070.cljs$lang$arity$variadic = G__8070__delegate;
          return G__8070
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8069 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8069__delegate.call(this, p1, p2, p3, ps)
    };
    G__8069.cljs$lang$maxFixedArity = 3;
    G__8069.cljs$lang$applyTo = function(arglist__8072) {
      var p1 = cljs.core.first(arglist__8072);
      var p2 = cljs.core.first(cljs.core.next(arglist__8072));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8072)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8072)));
      return G__8069__delegate(p1, p2, p3, ps)
    };
    G__8069.cljs$lang$arity$variadic = G__8069__delegate;
    return G__8069
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8091 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8091) {
        var s__8092 = temp__4092__auto____8091;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8092)) {
          var c__8093 = cljs.core.chunk_first.call(null, s__8092);
          var size__8094 = cljs.core.count.call(null, c__8093);
          var b__8095 = cljs.core.chunk_buffer.call(null, size__8094);
          var n__2590__auto____8096 = size__8094;
          var i__8097 = 0;
          while(true) {
            if(i__8097 < n__2590__auto____8096) {
              cljs.core.chunk_append.call(null, b__8095, f.call(null, cljs.core._nth.call(null, c__8093, i__8097)));
              var G__8109 = i__8097 + 1;
              i__8097 = G__8109;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8095), map.call(null, f, cljs.core.chunk_rest.call(null, s__8092)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8092)), map.call(null, f, cljs.core.rest.call(null, s__8092)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8098 = cljs.core.seq.call(null, c1);
      var s2__8099 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8100 = s1__8098;
        if(and__3941__auto____8100) {
          return s2__8099
        }else {
          return and__3941__auto____8100
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8098), cljs.core.first.call(null, s2__8099)), map.call(null, f, cljs.core.rest.call(null, s1__8098), cljs.core.rest.call(null, s2__8099)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8101 = cljs.core.seq.call(null, c1);
      var s2__8102 = cljs.core.seq.call(null, c2);
      var s3__8103 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____8104 = s1__8101;
        if(and__3941__auto____8104) {
          var and__3941__auto____8105 = s2__8102;
          if(and__3941__auto____8105) {
            return s3__8103
          }else {
            return and__3941__auto____8105
          }
        }else {
          return and__3941__auto____8104
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8101), cljs.core.first.call(null, s2__8102), cljs.core.first.call(null, s3__8103)), map.call(null, f, cljs.core.rest.call(null, s1__8101), cljs.core.rest.call(null, s2__8102), cljs.core.rest.call(null, s3__8103)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8110__delegate = function(f, c1, c2, c3, colls) {
      var step__8108 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8107 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8107)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8107), step.call(null, map.call(null, cljs.core.rest, ss__8107)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7912_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7912_SHARP_)
      }, step__8108.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8110 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8110__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8110.cljs$lang$maxFixedArity = 4;
    G__8110.cljs$lang$applyTo = function(arglist__8111) {
      var f = cljs.core.first(arglist__8111);
      var c1 = cljs.core.first(cljs.core.next(arglist__8111));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8111)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8111))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8111))));
      return G__8110__delegate(f, c1, c2, c3, colls)
    };
    G__8110.cljs$lang$arity$variadic = G__8110__delegate;
    return G__8110
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto____8114 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8114) {
        var s__8115 = temp__4092__auto____8114;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8115), take.call(null, n - 1, cljs.core.rest.call(null, s__8115)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8121 = function(n, coll) {
    while(true) {
      var s__8119 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8120 = n > 0;
        if(and__3941__auto____8120) {
          return s__8119
        }else {
          return and__3941__auto____8120
        }
      }())) {
        var G__8122 = n - 1;
        var G__8123 = cljs.core.rest.call(null, s__8119);
        n = G__8122;
        coll = G__8123;
        continue
      }else {
        return s__8119
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8121.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8126 = cljs.core.seq.call(null, coll);
  var lead__8127 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8127) {
      var G__8128 = cljs.core.next.call(null, s__8126);
      var G__8129 = cljs.core.next.call(null, lead__8127);
      s__8126 = G__8128;
      lead__8127 = G__8129;
      continue
    }else {
      return s__8126
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8135 = function(pred, coll) {
    while(true) {
      var s__8133 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8134 = s__8133;
        if(and__3941__auto____8134) {
          return pred.call(null, cljs.core.first.call(null, s__8133))
        }else {
          return and__3941__auto____8134
        }
      }())) {
        var G__8136 = pred;
        var G__8137 = cljs.core.rest.call(null, s__8133);
        pred = G__8136;
        coll = G__8137;
        continue
      }else {
        return s__8133
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8135.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8140 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8140) {
      var s__8141 = temp__4092__auto____8140;
      return cljs.core.concat.call(null, s__8141, cycle.call(null, s__8141))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8146 = cljs.core.seq.call(null, c1);
      var s2__8147 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8148 = s1__8146;
        if(and__3941__auto____8148) {
          return s2__8147
        }else {
          return and__3941__auto____8148
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8146), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8147), interleave.call(null, cljs.core.rest.call(null, s1__8146), cljs.core.rest.call(null, s2__8147))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8150__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8149 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8149)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8149), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8149)))
        }else {
          return null
        }
      }, null)
    };
    var G__8150 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8150__delegate.call(this, c1, c2, colls)
    };
    G__8150.cljs$lang$maxFixedArity = 2;
    G__8150.cljs$lang$applyTo = function(arglist__8151) {
      var c1 = cljs.core.first(arglist__8151);
      var c2 = cljs.core.first(cljs.core.next(arglist__8151));
      var colls = cljs.core.rest(cljs.core.next(arglist__8151));
      return G__8150__delegate(c1, c2, colls)
    };
    G__8150.cljs$lang$arity$variadic = G__8150__delegate;
    return G__8150
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8161 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____8159 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____8159) {
        var coll__8160 = temp__4090__auto____8159;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8160), cat.call(null, cljs.core.rest.call(null, coll__8160), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8161.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8162__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8162 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8162__delegate.call(this, f, coll, colls)
    };
    G__8162.cljs$lang$maxFixedArity = 2;
    G__8162.cljs$lang$applyTo = function(arglist__8163) {
      var f = cljs.core.first(arglist__8163);
      var coll = cljs.core.first(cljs.core.next(arglist__8163));
      var colls = cljs.core.rest(cljs.core.next(arglist__8163));
      return G__8162__delegate(f, coll, colls)
    };
    G__8162.cljs$lang$arity$variadic = G__8162__delegate;
    return G__8162
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8173 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8173) {
      var s__8174 = temp__4092__auto____8173;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8174)) {
        var c__8175 = cljs.core.chunk_first.call(null, s__8174);
        var size__8176 = cljs.core.count.call(null, c__8175);
        var b__8177 = cljs.core.chunk_buffer.call(null, size__8176);
        var n__2590__auto____8178 = size__8176;
        var i__8179 = 0;
        while(true) {
          if(i__8179 < n__2590__auto____8178) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8175, i__8179)))) {
              cljs.core.chunk_append.call(null, b__8177, cljs.core._nth.call(null, c__8175, i__8179))
            }else {
            }
            var G__8182 = i__8179 + 1;
            i__8179 = G__8182;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8177), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8174)))
      }else {
        var f__8180 = cljs.core.first.call(null, s__8174);
        var r__8181 = cljs.core.rest.call(null, s__8174);
        if(cljs.core.truth_(pred.call(null, f__8180))) {
          return cljs.core.cons.call(null, f__8180, filter.call(null, pred, r__8181))
        }else {
          return filter.call(null, pred, r__8181)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8185 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8185.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8183_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8183_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8189__8190 = to;
    if(G__8189__8190) {
      if(function() {
        var or__3943__auto____8191 = G__8189__8190.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____8191) {
          return or__3943__auto____8191
        }else {
          return G__8189__8190.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8189__8190.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8189__8190)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8189__8190)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8192__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8192 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8192__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8192.cljs$lang$maxFixedArity = 4;
    G__8192.cljs$lang$applyTo = function(arglist__8193) {
      var f = cljs.core.first(arglist__8193);
      var c1 = cljs.core.first(cljs.core.next(arglist__8193));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8193)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8193))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8193))));
      return G__8192__delegate(f, c1, c2, c3, colls)
    };
    G__8192.cljs$lang$arity$variadic = G__8192__delegate;
    return G__8192
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8200 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8200) {
        var s__8201 = temp__4092__auto____8200;
        var p__8202 = cljs.core.take.call(null, n, s__8201);
        if(n === cljs.core.count.call(null, p__8202)) {
          return cljs.core.cons.call(null, p__8202, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8201)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8203 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8203) {
        var s__8204 = temp__4092__auto____8203;
        var p__8205 = cljs.core.take.call(null, n, s__8204);
        if(n === cljs.core.count.call(null, p__8205)) {
          return cljs.core.cons.call(null, p__8205, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8204)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8205, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8210 = cljs.core.lookup_sentinel;
    var m__8211 = m;
    var ks__8212 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8212) {
        var m__8213 = cljs.core._lookup.call(null, m__8211, cljs.core.first.call(null, ks__8212), sentinel__8210);
        if(sentinel__8210 === m__8213) {
          return not_found
        }else {
          var G__8214 = sentinel__8210;
          var G__8215 = m__8213;
          var G__8216 = cljs.core.next.call(null, ks__8212);
          sentinel__8210 = G__8214;
          m__8211 = G__8215;
          ks__8212 = G__8216;
          continue
        }
      }else {
        return m__8211
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8217, v) {
  var vec__8222__8223 = p__8217;
  var k__8224 = cljs.core.nth.call(null, vec__8222__8223, 0, null);
  var ks__8225 = cljs.core.nthnext.call(null, vec__8222__8223, 1);
  if(cljs.core.truth_(ks__8225)) {
    return cljs.core.assoc.call(null, m, k__8224, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8224, null), ks__8225, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8224, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8226, f, args) {
    var vec__8231__8232 = p__8226;
    var k__8233 = cljs.core.nth.call(null, vec__8231__8232, 0, null);
    var ks__8234 = cljs.core.nthnext.call(null, vec__8231__8232, 1);
    if(cljs.core.truth_(ks__8234)) {
      return cljs.core.assoc.call(null, m, k__8233, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8233, null), ks__8234, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8233, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8233, null), args))
    }
  };
  var update_in = function(m, p__8226, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8226, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8235) {
    var m = cljs.core.first(arglist__8235);
    var p__8226 = cljs.core.first(cljs.core.next(arglist__8235));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8235)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8235)));
    return update_in__delegate(m, p__8226, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8238 = this;
  var h__2255__auto____8239 = this__8238.__hash;
  if(!(h__2255__auto____8239 == null)) {
    return h__2255__auto____8239
  }else {
    var h__2255__auto____8240 = cljs.core.hash_coll.call(null, coll);
    this__8238.__hash = h__2255__auto____8240;
    return h__2255__auto____8240
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8241 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8242 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8243 = this;
  var new_array__8244 = this__8243.array.slice();
  new_array__8244[k] = v;
  return new cljs.core.Vector(this__8243.meta, new_array__8244, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8275 = null;
  var G__8275__2 = function(this_sym8245, k) {
    var this__8247 = this;
    var this_sym8245__8248 = this;
    var coll__8249 = this_sym8245__8248;
    return coll__8249.cljs$core$ILookup$_lookup$arity$2(coll__8249, k)
  };
  var G__8275__3 = function(this_sym8246, k, not_found) {
    var this__8247 = this;
    var this_sym8246__8250 = this;
    var coll__8251 = this_sym8246__8250;
    return coll__8251.cljs$core$ILookup$_lookup$arity$3(coll__8251, k, not_found)
  };
  G__8275 = function(this_sym8246, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8275__2.call(this, this_sym8246, k);
      case 3:
        return G__8275__3.call(this, this_sym8246, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8275
}();
cljs.core.Vector.prototype.apply = function(this_sym8236, args8237) {
  var this__8252 = this;
  return this_sym8236.call.apply(this_sym8236, [this_sym8236].concat(args8237.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8253 = this;
  var new_array__8254 = this__8253.array.slice();
  new_array__8254.push(o);
  return new cljs.core.Vector(this__8253.meta, new_array__8254, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8255 = this;
  var this__8256 = this;
  return cljs.core.pr_str.call(null, this__8256)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8257 = this;
  return cljs.core.ci_reduce.call(null, this__8257.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8258 = this;
  return cljs.core.ci_reduce.call(null, this__8258.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8259 = this;
  if(this__8259.array.length > 0) {
    var vector_seq__8260 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8259.array.length) {
          return cljs.core.cons.call(null, this__8259.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8260.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8261 = this;
  return this__8261.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8262 = this;
  var count__8263 = this__8262.array.length;
  if(count__8263 > 0) {
    return this__8262.array[count__8263 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8264 = this;
  if(this__8264.array.length > 0) {
    var new_array__8265 = this__8264.array.slice();
    new_array__8265.pop();
    return new cljs.core.Vector(this__8264.meta, new_array__8265, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8266 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8267 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8268 = this;
  return new cljs.core.Vector(meta, this__8268.array, this__8268.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8269 = this;
  return this__8269.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8270 = this;
  if(function() {
    var and__3941__auto____8271 = 0 <= n;
    if(and__3941__auto____8271) {
      return n < this__8270.array.length
    }else {
      return and__3941__auto____8271
    }
  }()) {
    return this__8270.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8272 = this;
  if(function() {
    var and__3941__auto____8273 = 0 <= n;
    if(and__3941__auto____8273) {
      return n < this__8272.array.length
    }else {
      return and__3941__auto____8273
    }
  }()) {
    return this__8272.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8274 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8274.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2373__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8277 = pv.cnt;
  if(cnt__8277 < 32) {
    return 0
  }else {
    return cnt__8277 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8283 = level;
  var ret__8284 = node;
  while(true) {
    if(ll__8283 === 0) {
      return ret__8284
    }else {
      var embed__8285 = ret__8284;
      var r__8286 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8287 = cljs.core.pv_aset.call(null, r__8286, 0, embed__8285);
      var G__8288 = ll__8283 - 5;
      var G__8289 = r__8286;
      ll__8283 = G__8288;
      ret__8284 = G__8289;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8295 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8296 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8295, subidx__8296, tailnode);
    return ret__8295
  }else {
    var child__8297 = cljs.core.pv_aget.call(null, parent, subidx__8296);
    if(!(child__8297 == null)) {
      var node_to_insert__8298 = push_tail.call(null, pv, level - 5, child__8297, tailnode);
      cljs.core.pv_aset.call(null, ret__8295, subidx__8296, node_to_insert__8298);
      return ret__8295
    }else {
      var node_to_insert__8299 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8295, subidx__8296, node_to_insert__8299);
      return ret__8295
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____8303 = 0 <= i;
    if(and__3941__auto____8303) {
      return i < pv.cnt
    }else {
      return and__3941__auto____8303
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8304 = pv.root;
      var level__8305 = pv.shift;
      while(true) {
        if(level__8305 > 0) {
          var G__8306 = cljs.core.pv_aget.call(null, node__8304, i >>> level__8305 & 31);
          var G__8307 = level__8305 - 5;
          node__8304 = G__8306;
          level__8305 = G__8307;
          continue
        }else {
          return node__8304.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8310 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8310, i & 31, val);
    return ret__8310
  }else {
    var subidx__8311 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8310, subidx__8311, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8311), i, val));
    return ret__8310
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8317 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8318 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8317));
    if(function() {
      var and__3941__auto____8319 = new_child__8318 == null;
      if(and__3941__auto____8319) {
        return subidx__8317 === 0
      }else {
        return and__3941__auto____8319
      }
    }()) {
      return null
    }else {
      var ret__8320 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8320, subidx__8317, new_child__8318);
      return ret__8320
    }
  }else {
    if(subidx__8317 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8321 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8321, subidx__8317, null);
        return ret__8321
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8324 = this;
  return new cljs.core.TransientVector(this__8324.cnt, this__8324.shift, cljs.core.tv_editable_root.call(null, this__8324.root), cljs.core.tv_editable_tail.call(null, this__8324.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8325 = this;
  var h__2255__auto____8326 = this__8325.__hash;
  if(!(h__2255__auto____8326 == null)) {
    return h__2255__auto____8326
  }else {
    var h__2255__auto____8327 = cljs.core.hash_coll.call(null, coll);
    this__8325.__hash = h__2255__auto____8327;
    return h__2255__auto____8327
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8328 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8329 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8330 = this;
  if(function() {
    var and__3941__auto____8331 = 0 <= k;
    if(and__3941__auto____8331) {
      return k < this__8330.cnt
    }else {
      return and__3941__auto____8331
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8332 = this__8330.tail.slice();
      new_tail__8332[k & 31] = v;
      return new cljs.core.PersistentVector(this__8330.meta, this__8330.cnt, this__8330.shift, this__8330.root, new_tail__8332, null)
    }else {
      return new cljs.core.PersistentVector(this__8330.meta, this__8330.cnt, this__8330.shift, cljs.core.do_assoc.call(null, coll, this__8330.shift, this__8330.root, k, v), this__8330.tail, null)
    }
  }else {
    if(k === this__8330.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8330.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8380 = null;
  var G__8380__2 = function(this_sym8333, k) {
    var this__8335 = this;
    var this_sym8333__8336 = this;
    var coll__8337 = this_sym8333__8336;
    return coll__8337.cljs$core$ILookup$_lookup$arity$2(coll__8337, k)
  };
  var G__8380__3 = function(this_sym8334, k, not_found) {
    var this__8335 = this;
    var this_sym8334__8338 = this;
    var coll__8339 = this_sym8334__8338;
    return coll__8339.cljs$core$ILookup$_lookup$arity$3(coll__8339, k, not_found)
  };
  G__8380 = function(this_sym8334, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8380__2.call(this, this_sym8334, k);
      case 3:
        return G__8380__3.call(this, this_sym8334, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8380
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8322, args8323) {
  var this__8340 = this;
  return this_sym8322.call.apply(this_sym8322, [this_sym8322].concat(args8323.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8341 = this;
  var step_init__8342 = [0, init];
  var i__8343 = 0;
  while(true) {
    if(i__8343 < this__8341.cnt) {
      var arr__8344 = cljs.core.array_for.call(null, v, i__8343);
      var len__8345 = arr__8344.length;
      var init__8349 = function() {
        var j__8346 = 0;
        var init__8347 = step_init__8342[1];
        while(true) {
          if(j__8346 < len__8345) {
            var init__8348 = f.call(null, init__8347, j__8346 + i__8343, arr__8344[j__8346]);
            if(cljs.core.reduced_QMARK_.call(null, init__8348)) {
              return init__8348
            }else {
              var G__8381 = j__8346 + 1;
              var G__8382 = init__8348;
              j__8346 = G__8381;
              init__8347 = G__8382;
              continue
            }
          }else {
            step_init__8342[0] = len__8345;
            step_init__8342[1] = init__8347;
            return init__8347
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8349)) {
        return cljs.core.deref.call(null, init__8349)
      }else {
        var G__8383 = i__8343 + step_init__8342[0];
        i__8343 = G__8383;
        continue
      }
    }else {
      return step_init__8342[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8350 = this;
  if(this__8350.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8351 = this__8350.tail.slice();
    new_tail__8351.push(o);
    return new cljs.core.PersistentVector(this__8350.meta, this__8350.cnt + 1, this__8350.shift, this__8350.root, new_tail__8351, null)
  }else {
    var root_overflow_QMARK___8352 = this__8350.cnt >>> 5 > 1 << this__8350.shift;
    var new_shift__8353 = root_overflow_QMARK___8352 ? this__8350.shift + 5 : this__8350.shift;
    var new_root__8355 = root_overflow_QMARK___8352 ? function() {
      var n_r__8354 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8354, 0, this__8350.root);
      cljs.core.pv_aset.call(null, n_r__8354, 1, cljs.core.new_path.call(null, null, this__8350.shift, new cljs.core.VectorNode(null, this__8350.tail)));
      return n_r__8354
    }() : cljs.core.push_tail.call(null, coll, this__8350.shift, this__8350.root, new cljs.core.VectorNode(null, this__8350.tail));
    return new cljs.core.PersistentVector(this__8350.meta, this__8350.cnt + 1, new_shift__8353, new_root__8355, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8356 = this;
  if(this__8356.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8356.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8357 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8358 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8359 = this;
  var this__8360 = this;
  return cljs.core.pr_str.call(null, this__8360)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8361 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8362 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8363 = this;
  if(this__8363.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8364 = this;
  return this__8364.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8365 = this;
  if(this__8365.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8365.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8366 = this;
  if(this__8366.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8366.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8366.meta)
    }else {
      if(1 < this__8366.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8366.meta, this__8366.cnt - 1, this__8366.shift, this__8366.root, this__8366.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8367 = cljs.core.array_for.call(null, coll, this__8366.cnt - 2);
          var nr__8368 = cljs.core.pop_tail.call(null, coll, this__8366.shift, this__8366.root);
          var new_root__8369 = nr__8368 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8368;
          var cnt_1__8370 = this__8366.cnt - 1;
          if(function() {
            var and__3941__auto____8371 = 5 < this__8366.shift;
            if(and__3941__auto____8371) {
              return cljs.core.pv_aget.call(null, new_root__8369, 1) == null
            }else {
              return and__3941__auto____8371
            }
          }()) {
            return new cljs.core.PersistentVector(this__8366.meta, cnt_1__8370, this__8366.shift - 5, cljs.core.pv_aget.call(null, new_root__8369, 0), new_tail__8367, null)
          }else {
            return new cljs.core.PersistentVector(this__8366.meta, cnt_1__8370, this__8366.shift, new_root__8369, new_tail__8367, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8372 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8373 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8374 = this;
  return new cljs.core.PersistentVector(meta, this__8374.cnt, this__8374.shift, this__8374.root, this__8374.tail, this__8374.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8375 = this;
  return this__8375.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8376 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8377 = this;
  if(function() {
    var and__3941__auto____8378 = 0 <= n;
    if(and__3941__auto____8378) {
      return n < this__8377.cnt
    }else {
      return and__3941__auto____8378
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8379 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8379.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8384 = xs.length;
  var xs__8385 = no_clone === true ? xs : xs.slice();
  if(l__8384 < 32) {
    return new cljs.core.PersistentVector(null, l__8384, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8385, null)
  }else {
    var node__8386 = xs__8385.slice(0, 32);
    var v__8387 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8386, null);
    var i__8388 = 32;
    var out__8389 = cljs.core._as_transient.call(null, v__8387);
    while(true) {
      if(i__8388 < l__8384) {
        var G__8390 = i__8388 + 1;
        var G__8391 = cljs.core.conj_BANG_.call(null, out__8389, xs__8385[i__8388]);
        i__8388 = G__8390;
        out__8389 = G__8391;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8389)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8392) {
    var args = cljs.core.seq(arglist__8392);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8393 = this;
  if(this__8393.off + 1 < this__8393.node.length) {
    var s__8394 = cljs.core.chunked_seq.call(null, this__8393.vec, this__8393.node, this__8393.i, this__8393.off + 1);
    if(s__8394 == null) {
      return null
    }else {
      return s__8394
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8395 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8396 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8397 = this;
  return this__8397.node[this__8397.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8398 = this;
  if(this__8398.off + 1 < this__8398.node.length) {
    var s__8399 = cljs.core.chunked_seq.call(null, this__8398.vec, this__8398.node, this__8398.i, this__8398.off + 1);
    if(s__8399 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8399
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8400 = this;
  var l__8401 = this__8400.node.length;
  var s__8402 = this__8400.i + l__8401 < cljs.core._count.call(null, this__8400.vec) ? cljs.core.chunked_seq.call(null, this__8400.vec, this__8400.i + l__8401, 0) : null;
  if(s__8402 == null) {
    return null
  }else {
    return s__8402
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8403 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8404 = this;
  return cljs.core.chunked_seq.call(null, this__8404.vec, this__8404.node, this__8404.i, this__8404.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8405 = this;
  return this__8405.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8406 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8406.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8407 = this;
  return cljs.core.array_chunk.call(null, this__8407.node, this__8407.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8408 = this;
  var l__8409 = this__8408.node.length;
  var s__8410 = this__8408.i + l__8409 < cljs.core._count.call(null, this__8408.vec) ? cljs.core.chunked_seq.call(null, this__8408.vec, this__8408.i + l__8409, 0) : null;
  if(s__8410 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8410
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8413 = this;
  var h__2255__auto____8414 = this__8413.__hash;
  if(!(h__2255__auto____8414 == null)) {
    return h__2255__auto____8414
  }else {
    var h__2255__auto____8415 = cljs.core.hash_coll.call(null, coll);
    this__8413.__hash = h__2255__auto____8415;
    return h__2255__auto____8415
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8416 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8417 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8418 = this;
  var v_pos__8419 = this__8418.start + key;
  return new cljs.core.Subvec(this__8418.meta, cljs.core._assoc.call(null, this__8418.v, v_pos__8419, val), this__8418.start, this__8418.end > v_pos__8419 + 1 ? this__8418.end : v_pos__8419 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8445 = null;
  var G__8445__2 = function(this_sym8420, k) {
    var this__8422 = this;
    var this_sym8420__8423 = this;
    var coll__8424 = this_sym8420__8423;
    return coll__8424.cljs$core$ILookup$_lookup$arity$2(coll__8424, k)
  };
  var G__8445__3 = function(this_sym8421, k, not_found) {
    var this__8422 = this;
    var this_sym8421__8425 = this;
    var coll__8426 = this_sym8421__8425;
    return coll__8426.cljs$core$ILookup$_lookup$arity$3(coll__8426, k, not_found)
  };
  G__8445 = function(this_sym8421, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8445__2.call(this, this_sym8421, k);
      case 3:
        return G__8445__3.call(this, this_sym8421, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8445
}();
cljs.core.Subvec.prototype.apply = function(this_sym8411, args8412) {
  var this__8427 = this;
  return this_sym8411.call.apply(this_sym8411, [this_sym8411].concat(args8412.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8428 = this;
  return new cljs.core.Subvec(this__8428.meta, cljs.core._assoc_n.call(null, this__8428.v, this__8428.end, o), this__8428.start, this__8428.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8429 = this;
  var this__8430 = this;
  return cljs.core.pr_str.call(null, this__8430)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8431 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8432 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8433 = this;
  var subvec_seq__8434 = function subvec_seq(i) {
    if(i === this__8433.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8433.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8434.call(null, this__8433.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8435 = this;
  return this__8435.end - this__8435.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8436 = this;
  return cljs.core._nth.call(null, this__8436.v, this__8436.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8437 = this;
  if(this__8437.start === this__8437.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8437.meta, this__8437.v, this__8437.start, this__8437.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8438 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8439 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8440 = this;
  return new cljs.core.Subvec(meta, this__8440.v, this__8440.start, this__8440.end, this__8440.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8441 = this;
  return this__8441.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8442 = this;
  return cljs.core._nth.call(null, this__8442.v, this__8442.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8443 = this;
  return cljs.core._nth.call(null, this__8443.v, this__8443.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8444 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8444.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8447 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8447, 0, tl.length);
  return ret__8447
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8451 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8452 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8451, subidx__8452, level === 5 ? tail_node : function() {
    var child__8453 = cljs.core.pv_aget.call(null, ret__8451, subidx__8452);
    if(!(child__8453 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8453, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8451
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8458 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8459 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8460 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8458, subidx__8459));
    if(function() {
      var and__3941__auto____8461 = new_child__8460 == null;
      if(and__3941__auto____8461) {
        return subidx__8459 === 0
      }else {
        return and__3941__auto____8461
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8458, subidx__8459, new_child__8460);
      return node__8458
    }
  }else {
    if(subidx__8459 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8458, subidx__8459, null);
        return node__8458
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____8466 = 0 <= i;
    if(and__3941__auto____8466) {
      return i < tv.cnt
    }else {
      return and__3941__auto____8466
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8467 = tv.root;
      var node__8468 = root__8467;
      var level__8469 = tv.shift;
      while(true) {
        if(level__8469 > 0) {
          var G__8470 = cljs.core.tv_ensure_editable.call(null, root__8467.edit, cljs.core.pv_aget.call(null, node__8468, i >>> level__8469 & 31));
          var G__8471 = level__8469 - 5;
          node__8468 = G__8470;
          level__8469 = G__8471;
          continue
        }else {
          return node__8468.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8511 = null;
  var G__8511__2 = function(this_sym8474, k) {
    var this__8476 = this;
    var this_sym8474__8477 = this;
    var coll__8478 = this_sym8474__8477;
    return coll__8478.cljs$core$ILookup$_lookup$arity$2(coll__8478, k)
  };
  var G__8511__3 = function(this_sym8475, k, not_found) {
    var this__8476 = this;
    var this_sym8475__8479 = this;
    var coll__8480 = this_sym8475__8479;
    return coll__8480.cljs$core$ILookup$_lookup$arity$3(coll__8480, k, not_found)
  };
  G__8511 = function(this_sym8475, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8511__2.call(this, this_sym8475, k);
      case 3:
        return G__8511__3.call(this, this_sym8475, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8511
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8472, args8473) {
  var this__8481 = this;
  return this_sym8472.call.apply(this_sym8472, [this_sym8472].concat(args8473.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8482 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8483 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8484 = this;
  if(this__8484.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8485 = this;
  if(function() {
    var and__3941__auto____8486 = 0 <= n;
    if(and__3941__auto____8486) {
      return n < this__8485.cnt
    }else {
      return and__3941__auto____8486
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8487 = this;
  if(this__8487.root.edit) {
    return this__8487.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8488 = this;
  if(this__8488.root.edit) {
    if(function() {
      var and__3941__auto____8489 = 0 <= n;
      if(and__3941__auto____8489) {
        return n < this__8488.cnt
      }else {
        return and__3941__auto____8489
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8488.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8494 = function go(level, node) {
          var node__8492 = cljs.core.tv_ensure_editable.call(null, this__8488.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8492, n & 31, val);
            return node__8492
          }else {
            var subidx__8493 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8492, subidx__8493, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8492, subidx__8493)));
            return node__8492
          }
        }.call(null, this__8488.shift, this__8488.root);
        this__8488.root = new_root__8494;
        return tcoll
      }
    }else {
      if(n === this__8488.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8488.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8495 = this;
  if(this__8495.root.edit) {
    if(this__8495.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8495.cnt) {
        this__8495.cnt = 0;
        return tcoll
      }else {
        if((this__8495.cnt - 1 & 31) > 0) {
          this__8495.cnt = this__8495.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8496 = cljs.core.editable_array_for.call(null, tcoll, this__8495.cnt - 2);
            var new_root__8498 = function() {
              var nr__8497 = cljs.core.tv_pop_tail.call(null, tcoll, this__8495.shift, this__8495.root);
              if(!(nr__8497 == null)) {
                return nr__8497
              }else {
                return new cljs.core.VectorNode(this__8495.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____8499 = 5 < this__8495.shift;
              if(and__3941__auto____8499) {
                return cljs.core.pv_aget.call(null, new_root__8498, 1) == null
              }else {
                return and__3941__auto____8499
              }
            }()) {
              var new_root__8500 = cljs.core.tv_ensure_editable.call(null, this__8495.root.edit, cljs.core.pv_aget.call(null, new_root__8498, 0));
              this__8495.root = new_root__8500;
              this__8495.shift = this__8495.shift - 5;
              this__8495.cnt = this__8495.cnt - 1;
              this__8495.tail = new_tail__8496;
              return tcoll
            }else {
              this__8495.root = new_root__8498;
              this__8495.cnt = this__8495.cnt - 1;
              this__8495.tail = new_tail__8496;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8501 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8502 = this;
  if(this__8502.root.edit) {
    if(this__8502.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8502.tail[this__8502.cnt & 31] = o;
      this__8502.cnt = this__8502.cnt + 1;
      return tcoll
    }else {
      var tail_node__8503 = new cljs.core.VectorNode(this__8502.root.edit, this__8502.tail);
      var new_tail__8504 = cljs.core.make_array.call(null, 32);
      new_tail__8504[0] = o;
      this__8502.tail = new_tail__8504;
      if(this__8502.cnt >>> 5 > 1 << this__8502.shift) {
        var new_root_array__8505 = cljs.core.make_array.call(null, 32);
        var new_shift__8506 = this__8502.shift + 5;
        new_root_array__8505[0] = this__8502.root;
        new_root_array__8505[1] = cljs.core.new_path.call(null, this__8502.root.edit, this__8502.shift, tail_node__8503);
        this__8502.root = new cljs.core.VectorNode(this__8502.root.edit, new_root_array__8505);
        this__8502.shift = new_shift__8506;
        this__8502.cnt = this__8502.cnt + 1;
        return tcoll
      }else {
        var new_root__8507 = cljs.core.tv_push_tail.call(null, tcoll, this__8502.shift, this__8502.root, tail_node__8503);
        this__8502.root = new_root__8507;
        this__8502.cnt = this__8502.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8508 = this;
  if(this__8508.root.edit) {
    this__8508.root.edit = null;
    var len__8509 = this__8508.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8510 = cljs.core.make_array.call(null, len__8509);
    cljs.core.array_copy.call(null, this__8508.tail, 0, trimmed_tail__8510, 0, len__8509);
    return new cljs.core.PersistentVector(null, this__8508.cnt, this__8508.shift, this__8508.root, trimmed_tail__8510, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8512 = this;
  var h__2255__auto____8513 = this__8512.__hash;
  if(!(h__2255__auto____8513 == null)) {
    return h__2255__auto____8513
  }else {
    var h__2255__auto____8514 = cljs.core.hash_coll.call(null, coll);
    this__8512.__hash = h__2255__auto____8514;
    return h__2255__auto____8514
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8515 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8516 = this;
  var this__8517 = this;
  return cljs.core.pr_str.call(null, this__8517)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8518 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8519 = this;
  return cljs.core._first.call(null, this__8519.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8520 = this;
  var temp__4090__auto____8521 = cljs.core.next.call(null, this__8520.front);
  if(temp__4090__auto____8521) {
    var f1__8522 = temp__4090__auto____8521;
    return new cljs.core.PersistentQueueSeq(this__8520.meta, f1__8522, this__8520.rear, null)
  }else {
    if(this__8520.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8520.meta, this__8520.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8523 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8524 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8524.front, this__8524.rear, this__8524.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8525 = this;
  return this__8525.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8526 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8526.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8527 = this;
  var h__2255__auto____8528 = this__8527.__hash;
  if(!(h__2255__auto____8528 == null)) {
    return h__2255__auto____8528
  }else {
    var h__2255__auto____8529 = cljs.core.hash_coll.call(null, coll);
    this__8527.__hash = h__2255__auto____8529;
    return h__2255__auto____8529
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8530 = this;
  if(cljs.core.truth_(this__8530.front)) {
    return new cljs.core.PersistentQueue(this__8530.meta, this__8530.count + 1, this__8530.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____8531 = this__8530.rear;
      if(cljs.core.truth_(or__3943__auto____8531)) {
        return or__3943__auto____8531
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8530.meta, this__8530.count + 1, cljs.core.conj.call(null, this__8530.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8532 = this;
  var this__8533 = this;
  return cljs.core.pr_str.call(null, this__8533)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8534 = this;
  var rear__8535 = cljs.core.seq.call(null, this__8534.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____8536 = this__8534.front;
    if(cljs.core.truth_(or__3943__auto____8536)) {
      return or__3943__auto____8536
    }else {
      return rear__8535
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8534.front, cljs.core.seq.call(null, rear__8535), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8537 = this;
  return this__8537.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8538 = this;
  return cljs.core._first.call(null, this__8538.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8539 = this;
  if(cljs.core.truth_(this__8539.front)) {
    var temp__4090__auto____8540 = cljs.core.next.call(null, this__8539.front);
    if(temp__4090__auto____8540) {
      var f1__8541 = temp__4090__auto____8540;
      return new cljs.core.PersistentQueue(this__8539.meta, this__8539.count - 1, f1__8541, this__8539.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8539.meta, this__8539.count - 1, cljs.core.seq.call(null, this__8539.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8542 = this;
  return cljs.core.first.call(null, this__8542.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8543 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8544 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8545 = this;
  return new cljs.core.PersistentQueue(meta, this__8545.count, this__8545.front, this__8545.rear, this__8545.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8546 = this;
  return this__8546.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8547 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8548 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8551 = array.length;
  var i__8552 = 0;
  while(true) {
    if(i__8552 < len__8551) {
      if(k === array[i__8552]) {
        return i__8552
      }else {
        var G__8553 = i__8552 + incr;
        i__8552 = G__8553;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8556 = cljs.core.hash.call(null, a);
  var b__8557 = cljs.core.hash.call(null, b);
  if(a__8556 < b__8557) {
    return-1
  }else {
    if(a__8556 > b__8557) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8565 = m.keys;
  var len__8566 = ks__8565.length;
  var so__8567 = m.strobj;
  var out__8568 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8569 = 0;
  var out__8570 = cljs.core.transient$.call(null, out__8568);
  while(true) {
    if(i__8569 < len__8566) {
      var k__8571 = ks__8565[i__8569];
      var G__8572 = i__8569 + 1;
      var G__8573 = cljs.core.assoc_BANG_.call(null, out__8570, k__8571, so__8567[k__8571]);
      i__8569 = G__8572;
      out__8570 = G__8573;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8570, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8579 = {};
  var l__8580 = ks.length;
  var i__8581 = 0;
  while(true) {
    if(i__8581 < l__8580) {
      var k__8582 = ks[i__8581];
      new_obj__8579[k__8582] = obj[k__8582];
      var G__8583 = i__8581 + 1;
      i__8581 = G__8583;
      continue
    }else {
    }
    break
  }
  return new_obj__8579
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8586 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8587 = this;
  var h__2255__auto____8588 = this__8587.__hash;
  if(!(h__2255__auto____8588 == null)) {
    return h__2255__auto____8588
  }else {
    var h__2255__auto____8589 = cljs.core.hash_imap.call(null, coll);
    this__8587.__hash = h__2255__auto____8589;
    return h__2255__auto____8589
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8590 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8591 = this;
  if(function() {
    var and__3941__auto____8592 = goog.isString(k);
    if(and__3941__auto____8592) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8591.keys) == null)
    }else {
      return and__3941__auto____8592
    }
  }()) {
    return this__8591.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8593 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____8594 = this__8593.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____8594) {
        return or__3943__auto____8594
      }else {
        return this__8593.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8593.keys) == null)) {
        var new_strobj__8595 = cljs.core.obj_clone.call(null, this__8593.strobj, this__8593.keys);
        new_strobj__8595[k] = v;
        return new cljs.core.ObjMap(this__8593.meta, this__8593.keys, new_strobj__8595, this__8593.update_count + 1, null)
      }else {
        var new_strobj__8596 = cljs.core.obj_clone.call(null, this__8593.strobj, this__8593.keys);
        var new_keys__8597 = this__8593.keys.slice();
        new_strobj__8596[k] = v;
        new_keys__8597.push(k);
        return new cljs.core.ObjMap(this__8593.meta, new_keys__8597, new_strobj__8596, this__8593.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8598 = this;
  if(function() {
    var and__3941__auto____8599 = goog.isString(k);
    if(and__3941__auto____8599) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8598.keys) == null)
    }else {
      return and__3941__auto____8599
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8621 = null;
  var G__8621__2 = function(this_sym8600, k) {
    var this__8602 = this;
    var this_sym8600__8603 = this;
    var coll__8604 = this_sym8600__8603;
    return coll__8604.cljs$core$ILookup$_lookup$arity$2(coll__8604, k)
  };
  var G__8621__3 = function(this_sym8601, k, not_found) {
    var this__8602 = this;
    var this_sym8601__8605 = this;
    var coll__8606 = this_sym8601__8605;
    return coll__8606.cljs$core$ILookup$_lookup$arity$3(coll__8606, k, not_found)
  };
  G__8621 = function(this_sym8601, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8621__2.call(this, this_sym8601, k);
      case 3:
        return G__8621__3.call(this, this_sym8601, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8621
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8584, args8585) {
  var this__8607 = this;
  return this_sym8584.call.apply(this_sym8584, [this_sym8584].concat(args8585.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8608 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8609 = this;
  var this__8610 = this;
  return cljs.core.pr_str.call(null, this__8610)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8611 = this;
  if(this__8611.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8574_SHARP_) {
      return cljs.core.vector.call(null, p1__8574_SHARP_, this__8611.strobj[p1__8574_SHARP_])
    }, this__8611.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8612 = this;
  return this__8612.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8613 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8614 = this;
  return new cljs.core.ObjMap(meta, this__8614.keys, this__8614.strobj, this__8614.update_count, this__8614.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8615 = this;
  return this__8615.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8616 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8616.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8617 = this;
  if(function() {
    var and__3941__auto____8618 = goog.isString(k);
    if(and__3941__auto____8618) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8617.keys) == null)
    }else {
      return and__3941__auto____8618
    }
  }()) {
    var new_keys__8619 = this__8617.keys.slice();
    var new_strobj__8620 = cljs.core.obj_clone.call(null, this__8617.strobj, this__8617.keys);
    new_keys__8619.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8619), 1);
    cljs.core.js_delete.call(null, new_strobj__8620, k);
    return new cljs.core.ObjMap(this__8617.meta, new_keys__8619, new_strobj__8620, this__8617.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8625 = this;
  var h__2255__auto____8626 = this__8625.__hash;
  if(!(h__2255__auto____8626 == null)) {
    return h__2255__auto____8626
  }else {
    var h__2255__auto____8627 = cljs.core.hash_imap.call(null, coll);
    this__8625.__hash = h__2255__auto____8627;
    return h__2255__auto____8627
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8628 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8629 = this;
  var bucket__8630 = this__8629.hashobj[cljs.core.hash.call(null, k)];
  var i__8631 = cljs.core.truth_(bucket__8630) ? cljs.core.scan_array.call(null, 2, k, bucket__8630) : null;
  if(cljs.core.truth_(i__8631)) {
    return bucket__8630[i__8631 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8632 = this;
  var h__8633 = cljs.core.hash.call(null, k);
  var bucket__8634 = this__8632.hashobj[h__8633];
  if(cljs.core.truth_(bucket__8634)) {
    var new_bucket__8635 = bucket__8634.slice();
    var new_hashobj__8636 = goog.object.clone(this__8632.hashobj);
    new_hashobj__8636[h__8633] = new_bucket__8635;
    var temp__4090__auto____8637 = cljs.core.scan_array.call(null, 2, k, new_bucket__8635);
    if(cljs.core.truth_(temp__4090__auto____8637)) {
      var i__8638 = temp__4090__auto____8637;
      new_bucket__8635[i__8638 + 1] = v;
      return new cljs.core.HashMap(this__8632.meta, this__8632.count, new_hashobj__8636, null)
    }else {
      new_bucket__8635.push(k, v);
      return new cljs.core.HashMap(this__8632.meta, this__8632.count + 1, new_hashobj__8636, null)
    }
  }else {
    var new_hashobj__8639 = goog.object.clone(this__8632.hashobj);
    new_hashobj__8639[h__8633] = [k, v];
    return new cljs.core.HashMap(this__8632.meta, this__8632.count + 1, new_hashobj__8639, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8640 = this;
  var bucket__8641 = this__8640.hashobj[cljs.core.hash.call(null, k)];
  var i__8642 = cljs.core.truth_(bucket__8641) ? cljs.core.scan_array.call(null, 2, k, bucket__8641) : null;
  if(cljs.core.truth_(i__8642)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8667 = null;
  var G__8667__2 = function(this_sym8643, k) {
    var this__8645 = this;
    var this_sym8643__8646 = this;
    var coll__8647 = this_sym8643__8646;
    return coll__8647.cljs$core$ILookup$_lookup$arity$2(coll__8647, k)
  };
  var G__8667__3 = function(this_sym8644, k, not_found) {
    var this__8645 = this;
    var this_sym8644__8648 = this;
    var coll__8649 = this_sym8644__8648;
    return coll__8649.cljs$core$ILookup$_lookup$arity$3(coll__8649, k, not_found)
  };
  G__8667 = function(this_sym8644, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8667__2.call(this, this_sym8644, k);
      case 3:
        return G__8667__3.call(this, this_sym8644, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8667
}();
cljs.core.HashMap.prototype.apply = function(this_sym8623, args8624) {
  var this__8650 = this;
  return this_sym8623.call.apply(this_sym8623, [this_sym8623].concat(args8624.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8651 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8652 = this;
  var this__8653 = this;
  return cljs.core.pr_str.call(null, this__8653)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8654 = this;
  if(this__8654.count > 0) {
    var hashes__8655 = cljs.core.js_keys.call(null, this__8654.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8622_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8654.hashobj[p1__8622_SHARP_]))
    }, hashes__8655)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8656 = this;
  return this__8656.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8657 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8658 = this;
  return new cljs.core.HashMap(meta, this__8658.count, this__8658.hashobj, this__8658.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8659 = this;
  return this__8659.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8660 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8660.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8661 = this;
  var h__8662 = cljs.core.hash.call(null, k);
  var bucket__8663 = this__8661.hashobj[h__8662];
  var i__8664 = cljs.core.truth_(bucket__8663) ? cljs.core.scan_array.call(null, 2, k, bucket__8663) : null;
  if(cljs.core.not.call(null, i__8664)) {
    return coll
  }else {
    var new_hashobj__8665 = goog.object.clone(this__8661.hashobj);
    if(3 > bucket__8663.length) {
      cljs.core.js_delete.call(null, new_hashobj__8665, h__8662)
    }else {
      var new_bucket__8666 = bucket__8663.slice();
      new_bucket__8666.splice(i__8664, 2);
      new_hashobj__8665[h__8662] = new_bucket__8666
    }
    return new cljs.core.HashMap(this__8661.meta, this__8661.count - 1, new_hashobj__8665, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8668 = ks.length;
  var i__8669 = 0;
  var out__8670 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8669 < len__8668) {
      var G__8671 = i__8669 + 1;
      var G__8672 = cljs.core.assoc.call(null, out__8670, ks[i__8669], vs[i__8669]);
      i__8669 = G__8671;
      out__8670 = G__8672;
      continue
    }else {
      return out__8670
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8676 = m.arr;
  var len__8677 = arr__8676.length;
  var i__8678 = 0;
  while(true) {
    if(len__8677 <= i__8678) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8676[i__8678], k)) {
        return i__8678
      }else {
        if("\ufdd0'else") {
          var G__8679 = i__8678 + 2;
          i__8678 = G__8679;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8682 = this;
  return new cljs.core.TransientArrayMap({}, this__8682.arr.length, this__8682.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8683 = this;
  var h__2255__auto____8684 = this__8683.__hash;
  if(!(h__2255__auto____8684 == null)) {
    return h__2255__auto____8684
  }else {
    var h__2255__auto____8685 = cljs.core.hash_imap.call(null, coll);
    this__8683.__hash = h__2255__auto____8685;
    return h__2255__auto____8685
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8686 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8687 = this;
  var idx__8688 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8688 === -1) {
    return not_found
  }else {
    return this__8687.arr[idx__8688 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8689 = this;
  var idx__8690 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8690 === -1) {
    if(this__8689.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8689.meta, this__8689.cnt + 1, function() {
        var G__8691__8692 = this__8689.arr.slice();
        G__8691__8692.push(k);
        G__8691__8692.push(v);
        return G__8691__8692
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8689.arr[idx__8690 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8689.meta, this__8689.cnt, function() {
          var G__8693__8694 = this__8689.arr.slice();
          G__8693__8694[idx__8690 + 1] = v;
          return G__8693__8694
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8695 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8727 = null;
  var G__8727__2 = function(this_sym8696, k) {
    var this__8698 = this;
    var this_sym8696__8699 = this;
    var coll__8700 = this_sym8696__8699;
    return coll__8700.cljs$core$ILookup$_lookup$arity$2(coll__8700, k)
  };
  var G__8727__3 = function(this_sym8697, k, not_found) {
    var this__8698 = this;
    var this_sym8697__8701 = this;
    var coll__8702 = this_sym8697__8701;
    return coll__8702.cljs$core$ILookup$_lookup$arity$3(coll__8702, k, not_found)
  };
  G__8727 = function(this_sym8697, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8727__2.call(this, this_sym8697, k);
      case 3:
        return G__8727__3.call(this, this_sym8697, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8727
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8680, args8681) {
  var this__8703 = this;
  return this_sym8680.call.apply(this_sym8680, [this_sym8680].concat(args8681.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8704 = this;
  var len__8705 = this__8704.arr.length;
  var i__8706 = 0;
  var init__8707 = init;
  while(true) {
    if(i__8706 < len__8705) {
      var init__8708 = f.call(null, init__8707, this__8704.arr[i__8706], this__8704.arr[i__8706 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8708)) {
        return cljs.core.deref.call(null, init__8708)
      }else {
        var G__8728 = i__8706 + 2;
        var G__8729 = init__8708;
        i__8706 = G__8728;
        init__8707 = G__8729;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8709 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8710 = this;
  var this__8711 = this;
  return cljs.core.pr_str.call(null, this__8711)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8712 = this;
  if(this__8712.cnt > 0) {
    var len__8713 = this__8712.arr.length;
    var array_map_seq__8714 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8713) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8712.arr[i], this__8712.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8714.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8715 = this;
  return this__8715.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8716 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8717 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8717.cnt, this__8717.arr, this__8717.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8718 = this;
  return this__8718.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8719 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8719.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8720 = this;
  var idx__8721 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8721 >= 0) {
    var len__8722 = this__8720.arr.length;
    var new_len__8723 = len__8722 - 2;
    if(new_len__8723 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8724 = cljs.core.make_array.call(null, new_len__8723);
      var s__8725 = 0;
      var d__8726 = 0;
      while(true) {
        if(s__8725 >= len__8722) {
          return new cljs.core.PersistentArrayMap(this__8720.meta, this__8720.cnt - 1, new_arr__8724, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8720.arr[s__8725])) {
            var G__8730 = s__8725 + 2;
            var G__8731 = d__8726;
            s__8725 = G__8730;
            d__8726 = G__8731;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8724[d__8726] = this__8720.arr[s__8725];
              new_arr__8724[d__8726 + 1] = this__8720.arr[s__8725 + 1];
              var G__8732 = s__8725 + 2;
              var G__8733 = d__8726 + 2;
              s__8725 = G__8732;
              d__8726 = G__8733;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8734 = cljs.core.count.call(null, ks);
  var i__8735 = 0;
  var out__8736 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8735 < len__8734) {
      var G__8737 = i__8735 + 1;
      var G__8738 = cljs.core.assoc_BANG_.call(null, out__8736, ks[i__8735], vs[i__8735]);
      i__8735 = G__8737;
      out__8736 = G__8738;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8736)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8739 = this;
  if(cljs.core.truth_(this__8739.editable_QMARK_)) {
    var idx__8740 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8740 >= 0) {
      this__8739.arr[idx__8740] = this__8739.arr[this__8739.len - 2];
      this__8739.arr[idx__8740 + 1] = this__8739.arr[this__8739.len - 1];
      var G__8741__8742 = this__8739.arr;
      G__8741__8742.pop();
      G__8741__8742.pop();
      G__8741__8742;
      this__8739.len = this__8739.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8743 = this;
  if(cljs.core.truth_(this__8743.editable_QMARK_)) {
    var idx__8744 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8744 === -1) {
      if(this__8743.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8743.len = this__8743.len + 2;
        this__8743.arr.push(key);
        this__8743.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8743.len, this__8743.arr), key, val)
      }
    }else {
      if(val === this__8743.arr[idx__8744 + 1]) {
        return tcoll
      }else {
        this__8743.arr[idx__8744 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8745 = this;
  if(cljs.core.truth_(this__8745.editable_QMARK_)) {
    if(function() {
      var G__8746__8747 = o;
      if(G__8746__8747) {
        if(function() {
          var or__3943__auto____8748 = G__8746__8747.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8748) {
            return or__3943__auto____8748
          }else {
            return G__8746__8747.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8746__8747.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8746__8747)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8746__8747)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8749 = cljs.core.seq.call(null, o);
      var tcoll__8750 = tcoll;
      while(true) {
        var temp__4090__auto____8751 = cljs.core.first.call(null, es__8749);
        if(cljs.core.truth_(temp__4090__auto____8751)) {
          var e__8752 = temp__4090__auto____8751;
          var G__8758 = cljs.core.next.call(null, es__8749);
          var G__8759 = tcoll__8750.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8750, cljs.core.key.call(null, e__8752), cljs.core.val.call(null, e__8752));
          es__8749 = G__8758;
          tcoll__8750 = G__8759;
          continue
        }else {
          return tcoll__8750
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8753 = this;
  if(cljs.core.truth_(this__8753.editable_QMARK_)) {
    this__8753.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8753.len, 2), this__8753.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8754 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8755 = this;
  if(cljs.core.truth_(this__8755.editable_QMARK_)) {
    var idx__8756 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8756 === -1) {
      return not_found
    }else {
      return this__8755.arr[idx__8756 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8757 = this;
  if(cljs.core.truth_(this__8757.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8757.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8762 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8763 = 0;
  while(true) {
    if(i__8763 < len) {
      var G__8764 = cljs.core.assoc_BANG_.call(null, out__8762, arr[i__8763], arr[i__8763 + 1]);
      var G__8765 = i__8763 + 2;
      out__8762 = G__8764;
      i__8763 = G__8765;
      continue
    }else {
      return out__8762
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2373__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8770__8771 = arr.slice();
    G__8770__8771[i] = a;
    return G__8770__8771
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8772__8773 = arr.slice();
    G__8772__8773[i] = a;
    G__8772__8773[j] = b;
    return G__8772__8773
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8775 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8775, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8775, 2 * i, new_arr__8775.length - 2 * i);
  return new_arr__8775
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8778 = inode.ensure_editable(edit);
    editable__8778.arr[i] = a;
    return editable__8778
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8779 = inode.ensure_editable(edit);
    editable__8779.arr[i] = a;
    editable__8779.arr[j] = b;
    return editable__8779
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8786 = arr.length;
  var i__8787 = 0;
  var init__8788 = init;
  while(true) {
    if(i__8787 < len__8786) {
      var init__8791 = function() {
        var k__8789 = arr[i__8787];
        if(!(k__8789 == null)) {
          return f.call(null, init__8788, k__8789, arr[i__8787 + 1])
        }else {
          var node__8790 = arr[i__8787 + 1];
          if(!(node__8790 == null)) {
            return node__8790.kv_reduce(f, init__8788)
          }else {
            return init__8788
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8791)) {
        return cljs.core.deref.call(null, init__8791)
      }else {
        var G__8792 = i__8787 + 2;
        var G__8793 = init__8791;
        i__8787 = G__8792;
        init__8788 = G__8793;
        continue
      }
    }else {
      return init__8788
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8794 = this;
  var inode__8795 = this;
  if(this__8794.bitmap === bit) {
    return null
  }else {
    var editable__8796 = inode__8795.ensure_editable(e);
    var earr__8797 = editable__8796.arr;
    var len__8798 = earr__8797.length;
    editable__8796.bitmap = bit ^ editable__8796.bitmap;
    cljs.core.array_copy.call(null, earr__8797, 2 * (i + 1), earr__8797, 2 * i, len__8798 - 2 * (i + 1));
    earr__8797[len__8798 - 2] = null;
    earr__8797[len__8798 - 1] = null;
    return editable__8796
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8799 = this;
  var inode__8800 = this;
  var bit__8801 = 1 << (hash >>> shift & 31);
  var idx__8802 = cljs.core.bitmap_indexed_node_index.call(null, this__8799.bitmap, bit__8801);
  if((this__8799.bitmap & bit__8801) === 0) {
    var n__8803 = cljs.core.bit_count.call(null, this__8799.bitmap);
    if(2 * n__8803 < this__8799.arr.length) {
      var editable__8804 = inode__8800.ensure_editable(edit);
      var earr__8805 = editable__8804.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8805, 2 * idx__8802, earr__8805, 2 * (idx__8802 + 1), 2 * (n__8803 - idx__8802));
      earr__8805[2 * idx__8802] = key;
      earr__8805[2 * idx__8802 + 1] = val;
      editable__8804.bitmap = editable__8804.bitmap | bit__8801;
      return editable__8804
    }else {
      if(n__8803 >= 16) {
        var nodes__8806 = cljs.core.make_array.call(null, 32);
        var jdx__8807 = hash >>> shift & 31;
        nodes__8806[jdx__8807] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8808 = 0;
        var j__8809 = 0;
        while(true) {
          if(i__8808 < 32) {
            if((this__8799.bitmap >>> i__8808 & 1) === 0) {
              var G__8862 = i__8808 + 1;
              var G__8863 = j__8809;
              i__8808 = G__8862;
              j__8809 = G__8863;
              continue
            }else {
              nodes__8806[i__8808] = !(this__8799.arr[j__8809] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8799.arr[j__8809]), this__8799.arr[j__8809], this__8799.arr[j__8809 + 1], added_leaf_QMARK_) : this__8799.arr[j__8809 + 1];
              var G__8864 = i__8808 + 1;
              var G__8865 = j__8809 + 2;
              i__8808 = G__8864;
              j__8809 = G__8865;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8803 + 1, nodes__8806)
      }else {
        if("\ufdd0'else") {
          var new_arr__8810 = cljs.core.make_array.call(null, 2 * (n__8803 + 4));
          cljs.core.array_copy.call(null, this__8799.arr, 0, new_arr__8810, 0, 2 * idx__8802);
          new_arr__8810[2 * idx__8802] = key;
          new_arr__8810[2 * idx__8802 + 1] = val;
          cljs.core.array_copy.call(null, this__8799.arr, 2 * idx__8802, new_arr__8810, 2 * (idx__8802 + 1), 2 * (n__8803 - idx__8802));
          added_leaf_QMARK_.val = true;
          var editable__8811 = inode__8800.ensure_editable(edit);
          editable__8811.arr = new_arr__8810;
          editable__8811.bitmap = editable__8811.bitmap | bit__8801;
          return editable__8811
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8812 = this__8799.arr[2 * idx__8802];
    var val_or_node__8813 = this__8799.arr[2 * idx__8802 + 1];
    if(key_or_nil__8812 == null) {
      var n__8814 = val_or_node__8813.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8814 === val_or_node__8813) {
        return inode__8800
      }else {
        return cljs.core.edit_and_set.call(null, inode__8800, edit, 2 * idx__8802 + 1, n__8814)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8812)) {
        if(val === val_or_node__8813) {
          return inode__8800
        }else {
          return cljs.core.edit_and_set.call(null, inode__8800, edit, 2 * idx__8802 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8800, edit, 2 * idx__8802, null, 2 * idx__8802 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8812, val_or_node__8813, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8815 = this;
  var inode__8816 = this;
  return cljs.core.create_inode_seq.call(null, this__8815.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8817 = this;
  var inode__8818 = this;
  var bit__8819 = 1 << (hash >>> shift & 31);
  if((this__8817.bitmap & bit__8819) === 0) {
    return inode__8818
  }else {
    var idx__8820 = cljs.core.bitmap_indexed_node_index.call(null, this__8817.bitmap, bit__8819);
    var key_or_nil__8821 = this__8817.arr[2 * idx__8820];
    var val_or_node__8822 = this__8817.arr[2 * idx__8820 + 1];
    if(key_or_nil__8821 == null) {
      var n__8823 = val_or_node__8822.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8823 === val_or_node__8822) {
        return inode__8818
      }else {
        if(!(n__8823 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8818, edit, 2 * idx__8820 + 1, n__8823)
        }else {
          if(this__8817.bitmap === bit__8819) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8818.edit_and_remove_pair(edit, bit__8819, idx__8820)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8821)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8818.edit_and_remove_pair(edit, bit__8819, idx__8820)
      }else {
        if("\ufdd0'else") {
          return inode__8818
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8824 = this;
  var inode__8825 = this;
  if(e === this__8824.edit) {
    return inode__8825
  }else {
    var n__8826 = cljs.core.bit_count.call(null, this__8824.bitmap);
    var new_arr__8827 = cljs.core.make_array.call(null, n__8826 < 0 ? 4 : 2 * (n__8826 + 1));
    cljs.core.array_copy.call(null, this__8824.arr, 0, new_arr__8827, 0, 2 * n__8826);
    return new cljs.core.BitmapIndexedNode(e, this__8824.bitmap, new_arr__8827)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8828 = this;
  var inode__8829 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8828.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8830 = this;
  var inode__8831 = this;
  var bit__8832 = 1 << (hash >>> shift & 31);
  if((this__8830.bitmap & bit__8832) === 0) {
    return not_found
  }else {
    var idx__8833 = cljs.core.bitmap_indexed_node_index.call(null, this__8830.bitmap, bit__8832);
    var key_or_nil__8834 = this__8830.arr[2 * idx__8833];
    var val_or_node__8835 = this__8830.arr[2 * idx__8833 + 1];
    if(key_or_nil__8834 == null) {
      return val_or_node__8835.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8834)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8834, val_or_node__8835], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8836 = this;
  var inode__8837 = this;
  var bit__8838 = 1 << (hash >>> shift & 31);
  if((this__8836.bitmap & bit__8838) === 0) {
    return inode__8837
  }else {
    var idx__8839 = cljs.core.bitmap_indexed_node_index.call(null, this__8836.bitmap, bit__8838);
    var key_or_nil__8840 = this__8836.arr[2 * idx__8839];
    var val_or_node__8841 = this__8836.arr[2 * idx__8839 + 1];
    if(key_or_nil__8840 == null) {
      var n__8842 = val_or_node__8841.inode_without(shift + 5, hash, key);
      if(n__8842 === val_or_node__8841) {
        return inode__8837
      }else {
        if(!(n__8842 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8836.bitmap, cljs.core.clone_and_set.call(null, this__8836.arr, 2 * idx__8839 + 1, n__8842))
        }else {
          if(this__8836.bitmap === bit__8838) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8836.bitmap ^ bit__8838, cljs.core.remove_pair.call(null, this__8836.arr, idx__8839))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8840)) {
        return new cljs.core.BitmapIndexedNode(null, this__8836.bitmap ^ bit__8838, cljs.core.remove_pair.call(null, this__8836.arr, idx__8839))
      }else {
        if("\ufdd0'else") {
          return inode__8837
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8843 = this;
  var inode__8844 = this;
  var bit__8845 = 1 << (hash >>> shift & 31);
  var idx__8846 = cljs.core.bitmap_indexed_node_index.call(null, this__8843.bitmap, bit__8845);
  if((this__8843.bitmap & bit__8845) === 0) {
    var n__8847 = cljs.core.bit_count.call(null, this__8843.bitmap);
    if(n__8847 >= 16) {
      var nodes__8848 = cljs.core.make_array.call(null, 32);
      var jdx__8849 = hash >>> shift & 31;
      nodes__8848[jdx__8849] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8850 = 0;
      var j__8851 = 0;
      while(true) {
        if(i__8850 < 32) {
          if((this__8843.bitmap >>> i__8850 & 1) === 0) {
            var G__8866 = i__8850 + 1;
            var G__8867 = j__8851;
            i__8850 = G__8866;
            j__8851 = G__8867;
            continue
          }else {
            nodes__8848[i__8850] = !(this__8843.arr[j__8851] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8843.arr[j__8851]), this__8843.arr[j__8851], this__8843.arr[j__8851 + 1], added_leaf_QMARK_) : this__8843.arr[j__8851 + 1];
            var G__8868 = i__8850 + 1;
            var G__8869 = j__8851 + 2;
            i__8850 = G__8868;
            j__8851 = G__8869;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8847 + 1, nodes__8848)
    }else {
      var new_arr__8852 = cljs.core.make_array.call(null, 2 * (n__8847 + 1));
      cljs.core.array_copy.call(null, this__8843.arr, 0, new_arr__8852, 0, 2 * idx__8846);
      new_arr__8852[2 * idx__8846] = key;
      new_arr__8852[2 * idx__8846 + 1] = val;
      cljs.core.array_copy.call(null, this__8843.arr, 2 * idx__8846, new_arr__8852, 2 * (idx__8846 + 1), 2 * (n__8847 - idx__8846));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8843.bitmap | bit__8845, new_arr__8852)
    }
  }else {
    var key_or_nil__8853 = this__8843.arr[2 * idx__8846];
    var val_or_node__8854 = this__8843.arr[2 * idx__8846 + 1];
    if(key_or_nil__8853 == null) {
      var n__8855 = val_or_node__8854.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8855 === val_or_node__8854) {
        return inode__8844
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8843.bitmap, cljs.core.clone_and_set.call(null, this__8843.arr, 2 * idx__8846 + 1, n__8855))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8853)) {
        if(val === val_or_node__8854) {
          return inode__8844
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8843.bitmap, cljs.core.clone_and_set.call(null, this__8843.arr, 2 * idx__8846 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8843.bitmap, cljs.core.clone_and_set.call(null, this__8843.arr, 2 * idx__8846, null, 2 * idx__8846 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8853, val_or_node__8854, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8856 = this;
  var inode__8857 = this;
  var bit__8858 = 1 << (hash >>> shift & 31);
  if((this__8856.bitmap & bit__8858) === 0) {
    return not_found
  }else {
    var idx__8859 = cljs.core.bitmap_indexed_node_index.call(null, this__8856.bitmap, bit__8858);
    var key_or_nil__8860 = this__8856.arr[2 * idx__8859];
    var val_or_node__8861 = this__8856.arr[2 * idx__8859 + 1];
    if(key_or_nil__8860 == null) {
      return val_or_node__8861.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8860)) {
        return val_or_node__8861
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8877 = array_node.arr;
  var len__8878 = 2 * (array_node.cnt - 1);
  var new_arr__8879 = cljs.core.make_array.call(null, len__8878);
  var i__8880 = 0;
  var j__8881 = 1;
  var bitmap__8882 = 0;
  while(true) {
    if(i__8880 < len__8878) {
      if(function() {
        var and__3941__auto____8883 = !(i__8880 === idx);
        if(and__3941__auto____8883) {
          return!(arr__8877[i__8880] == null)
        }else {
          return and__3941__auto____8883
        }
      }()) {
        new_arr__8879[j__8881] = arr__8877[i__8880];
        var G__8884 = i__8880 + 1;
        var G__8885 = j__8881 + 2;
        var G__8886 = bitmap__8882 | 1 << i__8880;
        i__8880 = G__8884;
        j__8881 = G__8885;
        bitmap__8882 = G__8886;
        continue
      }else {
        var G__8887 = i__8880 + 1;
        var G__8888 = j__8881;
        var G__8889 = bitmap__8882;
        i__8880 = G__8887;
        j__8881 = G__8888;
        bitmap__8882 = G__8889;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8882, new_arr__8879)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8890 = this;
  var inode__8891 = this;
  var idx__8892 = hash >>> shift & 31;
  var node__8893 = this__8890.arr[idx__8892];
  if(node__8893 == null) {
    var editable__8894 = cljs.core.edit_and_set.call(null, inode__8891, edit, idx__8892, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8894.cnt = editable__8894.cnt + 1;
    return editable__8894
  }else {
    var n__8895 = node__8893.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8895 === node__8893) {
      return inode__8891
    }else {
      return cljs.core.edit_and_set.call(null, inode__8891, edit, idx__8892, n__8895)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8896 = this;
  var inode__8897 = this;
  return cljs.core.create_array_node_seq.call(null, this__8896.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8898 = this;
  var inode__8899 = this;
  var idx__8900 = hash >>> shift & 31;
  var node__8901 = this__8898.arr[idx__8900];
  if(node__8901 == null) {
    return inode__8899
  }else {
    var n__8902 = node__8901.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8902 === node__8901) {
      return inode__8899
    }else {
      if(n__8902 == null) {
        if(this__8898.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8899, edit, idx__8900)
        }else {
          var editable__8903 = cljs.core.edit_and_set.call(null, inode__8899, edit, idx__8900, n__8902);
          editable__8903.cnt = editable__8903.cnt - 1;
          return editable__8903
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8899, edit, idx__8900, n__8902)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8904 = this;
  var inode__8905 = this;
  if(e === this__8904.edit) {
    return inode__8905
  }else {
    return new cljs.core.ArrayNode(e, this__8904.cnt, this__8904.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8906 = this;
  var inode__8907 = this;
  var len__8908 = this__8906.arr.length;
  var i__8909 = 0;
  var init__8910 = init;
  while(true) {
    if(i__8909 < len__8908) {
      var node__8911 = this__8906.arr[i__8909];
      if(!(node__8911 == null)) {
        var init__8912 = node__8911.kv_reduce(f, init__8910);
        if(cljs.core.reduced_QMARK_.call(null, init__8912)) {
          return cljs.core.deref.call(null, init__8912)
        }else {
          var G__8931 = i__8909 + 1;
          var G__8932 = init__8912;
          i__8909 = G__8931;
          init__8910 = G__8932;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8910
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8913 = this;
  var inode__8914 = this;
  var idx__8915 = hash >>> shift & 31;
  var node__8916 = this__8913.arr[idx__8915];
  if(!(node__8916 == null)) {
    return node__8916.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8917 = this;
  var inode__8918 = this;
  var idx__8919 = hash >>> shift & 31;
  var node__8920 = this__8917.arr[idx__8919];
  if(!(node__8920 == null)) {
    var n__8921 = node__8920.inode_without(shift + 5, hash, key);
    if(n__8921 === node__8920) {
      return inode__8918
    }else {
      if(n__8921 == null) {
        if(this__8917.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8918, null, idx__8919)
        }else {
          return new cljs.core.ArrayNode(null, this__8917.cnt - 1, cljs.core.clone_and_set.call(null, this__8917.arr, idx__8919, n__8921))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8917.cnt, cljs.core.clone_and_set.call(null, this__8917.arr, idx__8919, n__8921))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8918
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8922 = this;
  var inode__8923 = this;
  var idx__8924 = hash >>> shift & 31;
  var node__8925 = this__8922.arr[idx__8924];
  if(node__8925 == null) {
    return new cljs.core.ArrayNode(null, this__8922.cnt + 1, cljs.core.clone_and_set.call(null, this__8922.arr, idx__8924, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8926 = node__8925.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8926 === node__8925) {
      return inode__8923
    }else {
      return new cljs.core.ArrayNode(null, this__8922.cnt, cljs.core.clone_and_set.call(null, this__8922.arr, idx__8924, n__8926))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8927 = this;
  var inode__8928 = this;
  var idx__8929 = hash >>> shift & 31;
  var node__8930 = this__8927.arr[idx__8929];
  if(!(node__8930 == null)) {
    return node__8930.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8935 = 2 * cnt;
  var i__8936 = 0;
  while(true) {
    if(i__8936 < lim__8935) {
      if(cljs.core.key_test.call(null, key, arr[i__8936])) {
        return i__8936
      }else {
        var G__8937 = i__8936 + 2;
        i__8936 = G__8937;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8938 = this;
  var inode__8939 = this;
  if(hash === this__8938.collision_hash) {
    var idx__8940 = cljs.core.hash_collision_node_find_index.call(null, this__8938.arr, this__8938.cnt, key);
    if(idx__8940 === -1) {
      if(this__8938.arr.length > 2 * this__8938.cnt) {
        var editable__8941 = cljs.core.edit_and_set.call(null, inode__8939, edit, 2 * this__8938.cnt, key, 2 * this__8938.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8941.cnt = editable__8941.cnt + 1;
        return editable__8941
      }else {
        var len__8942 = this__8938.arr.length;
        var new_arr__8943 = cljs.core.make_array.call(null, len__8942 + 2);
        cljs.core.array_copy.call(null, this__8938.arr, 0, new_arr__8943, 0, len__8942);
        new_arr__8943[len__8942] = key;
        new_arr__8943[len__8942 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8939.ensure_editable_array(edit, this__8938.cnt + 1, new_arr__8943)
      }
    }else {
      if(this__8938.arr[idx__8940 + 1] === val) {
        return inode__8939
      }else {
        return cljs.core.edit_and_set.call(null, inode__8939, edit, idx__8940 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8938.collision_hash >>> shift & 31), [null, inode__8939, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8944 = this;
  var inode__8945 = this;
  return cljs.core.create_inode_seq.call(null, this__8944.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8946 = this;
  var inode__8947 = this;
  var idx__8948 = cljs.core.hash_collision_node_find_index.call(null, this__8946.arr, this__8946.cnt, key);
  if(idx__8948 === -1) {
    return inode__8947
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8946.cnt === 1) {
      return null
    }else {
      var editable__8949 = inode__8947.ensure_editable(edit);
      var earr__8950 = editable__8949.arr;
      earr__8950[idx__8948] = earr__8950[2 * this__8946.cnt - 2];
      earr__8950[idx__8948 + 1] = earr__8950[2 * this__8946.cnt - 1];
      earr__8950[2 * this__8946.cnt - 1] = null;
      earr__8950[2 * this__8946.cnt - 2] = null;
      editable__8949.cnt = editable__8949.cnt - 1;
      return editable__8949
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8951 = this;
  var inode__8952 = this;
  if(e === this__8951.edit) {
    return inode__8952
  }else {
    var new_arr__8953 = cljs.core.make_array.call(null, 2 * (this__8951.cnt + 1));
    cljs.core.array_copy.call(null, this__8951.arr, 0, new_arr__8953, 0, 2 * this__8951.cnt);
    return new cljs.core.HashCollisionNode(e, this__8951.collision_hash, this__8951.cnt, new_arr__8953)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8954 = this;
  var inode__8955 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8954.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8956 = this;
  var inode__8957 = this;
  var idx__8958 = cljs.core.hash_collision_node_find_index.call(null, this__8956.arr, this__8956.cnt, key);
  if(idx__8958 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8956.arr[idx__8958])) {
      return cljs.core.PersistentVector.fromArray([this__8956.arr[idx__8958], this__8956.arr[idx__8958 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8959 = this;
  var inode__8960 = this;
  var idx__8961 = cljs.core.hash_collision_node_find_index.call(null, this__8959.arr, this__8959.cnt, key);
  if(idx__8961 === -1) {
    return inode__8960
  }else {
    if(this__8959.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8959.collision_hash, this__8959.cnt - 1, cljs.core.remove_pair.call(null, this__8959.arr, cljs.core.quot.call(null, idx__8961, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8962 = this;
  var inode__8963 = this;
  if(hash === this__8962.collision_hash) {
    var idx__8964 = cljs.core.hash_collision_node_find_index.call(null, this__8962.arr, this__8962.cnt, key);
    if(idx__8964 === -1) {
      var len__8965 = this__8962.arr.length;
      var new_arr__8966 = cljs.core.make_array.call(null, len__8965 + 2);
      cljs.core.array_copy.call(null, this__8962.arr, 0, new_arr__8966, 0, len__8965);
      new_arr__8966[len__8965] = key;
      new_arr__8966[len__8965 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8962.collision_hash, this__8962.cnt + 1, new_arr__8966)
    }else {
      if(cljs.core._EQ_.call(null, this__8962.arr[idx__8964], val)) {
        return inode__8963
      }else {
        return new cljs.core.HashCollisionNode(null, this__8962.collision_hash, this__8962.cnt, cljs.core.clone_and_set.call(null, this__8962.arr, idx__8964 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8962.collision_hash >>> shift & 31), [null, inode__8963])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8967 = this;
  var inode__8968 = this;
  var idx__8969 = cljs.core.hash_collision_node_find_index.call(null, this__8967.arr, this__8967.cnt, key);
  if(idx__8969 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8967.arr[idx__8969])) {
      return this__8967.arr[idx__8969 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8970 = this;
  var inode__8971 = this;
  if(e === this__8970.edit) {
    this__8970.arr = array;
    this__8970.cnt = count;
    return inode__8971
  }else {
    return new cljs.core.HashCollisionNode(this__8970.edit, this__8970.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8976 = cljs.core.hash.call(null, key1);
    if(key1hash__8976 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8976, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8977 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8976, key1, val1, added_leaf_QMARK___8977).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8977)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8978 = cljs.core.hash.call(null, key1);
    if(key1hash__8978 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8978, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8979 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8978, key1, val1, added_leaf_QMARK___8979).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8979)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8980 = this;
  var h__2255__auto____8981 = this__8980.__hash;
  if(!(h__2255__auto____8981 == null)) {
    return h__2255__auto____8981
  }else {
    var h__2255__auto____8982 = cljs.core.hash_coll.call(null, coll);
    this__8980.__hash = h__2255__auto____8982;
    return h__2255__auto____8982
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8983 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8984 = this;
  var this__8985 = this;
  return cljs.core.pr_str.call(null, this__8985)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8986 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8987 = this;
  if(this__8987.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8987.nodes[this__8987.i], this__8987.nodes[this__8987.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8987.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8988 = this;
  if(this__8988.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8988.nodes, this__8988.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8988.nodes, this__8988.i, cljs.core.next.call(null, this__8988.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8989 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8990 = this;
  return new cljs.core.NodeSeq(meta, this__8990.nodes, this__8990.i, this__8990.s, this__8990.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8991 = this;
  return this__8991.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8992 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8992.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8999 = nodes.length;
      var j__9000 = i;
      while(true) {
        if(j__9000 < len__8999) {
          if(!(nodes[j__9000] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9000, null, null)
          }else {
            var temp__4090__auto____9001 = nodes[j__9000 + 1];
            if(cljs.core.truth_(temp__4090__auto____9001)) {
              var node__9002 = temp__4090__auto____9001;
              var temp__4090__auto____9003 = node__9002.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____9003)) {
                var node_seq__9004 = temp__4090__auto____9003;
                return new cljs.core.NodeSeq(null, nodes, j__9000 + 2, node_seq__9004, null)
              }else {
                var G__9005 = j__9000 + 2;
                j__9000 = G__9005;
                continue
              }
            }else {
              var G__9006 = j__9000 + 2;
              j__9000 = G__9006;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9007 = this;
  var h__2255__auto____9008 = this__9007.__hash;
  if(!(h__2255__auto____9008 == null)) {
    return h__2255__auto____9008
  }else {
    var h__2255__auto____9009 = cljs.core.hash_coll.call(null, coll);
    this__9007.__hash = h__2255__auto____9009;
    return h__2255__auto____9009
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9010 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9011 = this;
  var this__9012 = this;
  return cljs.core.pr_str.call(null, this__9012)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9013 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9014 = this;
  return cljs.core.first.call(null, this__9014.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9015 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9015.nodes, this__9015.i, cljs.core.next.call(null, this__9015.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9016 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9017 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9017.nodes, this__9017.i, this__9017.s, this__9017.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9018 = this;
  return this__9018.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9019 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9019.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9026 = nodes.length;
      var j__9027 = i;
      while(true) {
        if(j__9027 < len__9026) {
          var temp__4090__auto____9028 = nodes[j__9027];
          if(cljs.core.truth_(temp__4090__auto____9028)) {
            var nj__9029 = temp__4090__auto____9028;
            var temp__4090__auto____9030 = nj__9029.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____9030)) {
              var ns__9031 = temp__4090__auto____9030;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9027 + 1, ns__9031, null)
            }else {
              var G__9032 = j__9027 + 1;
              j__9027 = G__9032;
              continue
            }
          }else {
            var G__9033 = j__9027 + 1;
            j__9027 = G__9033;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9036 = this;
  return new cljs.core.TransientHashMap({}, this__9036.root, this__9036.cnt, this__9036.has_nil_QMARK_, this__9036.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9037 = this;
  var h__2255__auto____9038 = this__9037.__hash;
  if(!(h__2255__auto____9038 == null)) {
    return h__2255__auto____9038
  }else {
    var h__2255__auto____9039 = cljs.core.hash_imap.call(null, coll);
    this__9037.__hash = h__2255__auto____9039;
    return h__2255__auto____9039
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9040 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9041 = this;
  if(k == null) {
    if(this__9041.has_nil_QMARK_) {
      return this__9041.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9041.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9041.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9042 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____9043 = this__9042.has_nil_QMARK_;
      if(and__3941__auto____9043) {
        return v === this__9042.nil_val
      }else {
        return and__3941__auto____9043
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9042.meta, this__9042.has_nil_QMARK_ ? this__9042.cnt : this__9042.cnt + 1, this__9042.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9044 = new cljs.core.Box(false);
    var new_root__9045 = (this__9042.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9042.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9044);
    if(new_root__9045 === this__9042.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9042.meta, added_leaf_QMARK___9044.val ? this__9042.cnt + 1 : this__9042.cnt, new_root__9045, this__9042.has_nil_QMARK_, this__9042.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9046 = this;
  if(k == null) {
    return this__9046.has_nil_QMARK_
  }else {
    if(this__9046.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9046.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9069 = null;
  var G__9069__2 = function(this_sym9047, k) {
    var this__9049 = this;
    var this_sym9047__9050 = this;
    var coll__9051 = this_sym9047__9050;
    return coll__9051.cljs$core$ILookup$_lookup$arity$2(coll__9051, k)
  };
  var G__9069__3 = function(this_sym9048, k, not_found) {
    var this__9049 = this;
    var this_sym9048__9052 = this;
    var coll__9053 = this_sym9048__9052;
    return coll__9053.cljs$core$ILookup$_lookup$arity$3(coll__9053, k, not_found)
  };
  G__9069 = function(this_sym9048, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9069__2.call(this, this_sym9048, k);
      case 3:
        return G__9069__3.call(this, this_sym9048, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9069
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9034, args9035) {
  var this__9054 = this;
  return this_sym9034.call.apply(this_sym9034, [this_sym9034].concat(args9035.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9055 = this;
  var init__9056 = this__9055.has_nil_QMARK_ ? f.call(null, init, null, this__9055.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9056)) {
    return cljs.core.deref.call(null, init__9056)
  }else {
    if(!(this__9055.root == null)) {
      return this__9055.root.kv_reduce(f, init__9056)
    }else {
      if("\ufdd0'else") {
        return init__9056
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9057 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9058 = this;
  var this__9059 = this;
  return cljs.core.pr_str.call(null, this__9059)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9060 = this;
  if(this__9060.cnt > 0) {
    var s__9061 = !(this__9060.root == null) ? this__9060.root.inode_seq() : null;
    if(this__9060.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9060.nil_val], true), s__9061)
    }else {
      return s__9061
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9062 = this;
  return this__9062.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9063 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9064 = this;
  return new cljs.core.PersistentHashMap(meta, this__9064.cnt, this__9064.root, this__9064.has_nil_QMARK_, this__9064.nil_val, this__9064.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9065 = this;
  return this__9065.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9066 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9066.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9067 = this;
  if(k == null) {
    if(this__9067.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9067.meta, this__9067.cnt - 1, this__9067.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9067.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9068 = this__9067.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9068 === this__9067.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9067.meta, this__9067.cnt - 1, new_root__9068, this__9067.has_nil_QMARK_, this__9067.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9070 = ks.length;
  var i__9071 = 0;
  var out__9072 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9071 < len__9070) {
      var G__9073 = i__9071 + 1;
      var G__9074 = cljs.core.assoc_BANG_.call(null, out__9072, ks[i__9071], vs[i__9071]);
      i__9071 = G__9073;
      out__9072 = G__9074;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9072)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9075 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9076 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9077 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9078 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9079 = this;
  if(k == null) {
    if(this__9079.has_nil_QMARK_) {
      return this__9079.nil_val
    }else {
      return null
    }
  }else {
    if(this__9079.root == null) {
      return null
    }else {
      return this__9079.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9080 = this;
  if(k == null) {
    if(this__9080.has_nil_QMARK_) {
      return this__9080.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9080.root == null) {
      return not_found
    }else {
      return this__9080.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9081 = this;
  if(this__9081.edit) {
    return this__9081.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9082 = this;
  var tcoll__9083 = this;
  if(this__9082.edit) {
    if(function() {
      var G__9084__9085 = o;
      if(G__9084__9085) {
        if(function() {
          var or__3943__auto____9086 = G__9084__9085.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____9086) {
            return or__3943__auto____9086
          }else {
            return G__9084__9085.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9084__9085.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9084__9085)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9084__9085)
      }
    }()) {
      return tcoll__9083.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9087 = cljs.core.seq.call(null, o);
      var tcoll__9088 = tcoll__9083;
      while(true) {
        var temp__4090__auto____9089 = cljs.core.first.call(null, es__9087);
        if(cljs.core.truth_(temp__4090__auto____9089)) {
          var e__9090 = temp__4090__auto____9089;
          var G__9101 = cljs.core.next.call(null, es__9087);
          var G__9102 = tcoll__9088.assoc_BANG_(cljs.core.key.call(null, e__9090), cljs.core.val.call(null, e__9090));
          es__9087 = G__9101;
          tcoll__9088 = G__9102;
          continue
        }else {
          return tcoll__9088
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9091 = this;
  var tcoll__9092 = this;
  if(this__9091.edit) {
    if(k == null) {
      if(this__9091.nil_val === v) {
      }else {
        this__9091.nil_val = v
      }
      if(this__9091.has_nil_QMARK_) {
      }else {
        this__9091.count = this__9091.count + 1;
        this__9091.has_nil_QMARK_ = true
      }
      return tcoll__9092
    }else {
      var added_leaf_QMARK___9093 = new cljs.core.Box(false);
      var node__9094 = (this__9091.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9091.root).inode_assoc_BANG_(this__9091.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9093);
      if(node__9094 === this__9091.root) {
      }else {
        this__9091.root = node__9094
      }
      if(added_leaf_QMARK___9093.val) {
        this__9091.count = this__9091.count + 1
      }else {
      }
      return tcoll__9092
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9095 = this;
  var tcoll__9096 = this;
  if(this__9095.edit) {
    if(k == null) {
      if(this__9095.has_nil_QMARK_) {
        this__9095.has_nil_QMARK_ = false;
        this__9095.nil_val = null;
        this__9095.count = this__9095.count - 1;
        return tcoll__9096
      }else {
        return tcoll__9096
      }
    }else {
      if(this__9095.root == null) {
        return tcoll__9096
      }else {
        var removed_leaf_QMARK___9097 = new cljs.core.Box(false);
        var node__9098 = this__9095.root.inode_without_BANG_(this__9095.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9097);
        if(node__9098 === this__9095.root) {
        }else {
          this__9095.root = node__9098
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9097[0])) {
          this__9095.count = this__9095.count - 1
        }else {
        }
        return tcoll__9096
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9099 = this;
  var tcoll__9100 = this;
  if(this__9099.edit) {
    this__9099.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9099.count, this__9099.root, this__9099.has_nil_QMARK_, this__9099.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9105 = node;
  var stack__9106 = stack;
  while(true) {
    if(!(t__9105 == null)) {
      var G__9107 = ascending_QMARK_ ? t__9105.left : t__9105.right;
      var G__9108 = cljs.core.conj.call(null, stack__9106, t__9105);
      t__9105 = G__9107;
      stack__9106 = G__9108;
      continue
    }else {
      return stack__9106
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9109 = this;
  var h__2255__auto____9110 = this__9109.__hash;
  if(!(h__2255__auto____9110 == null)) {
    return h__2255__auto____9110
  }else {
    var h__2255__auto____9111 = cljs.core.hash_coll.call(null, coll);
    this__9109.__hash = h__2255__auto____9111;
    return h__2255__auto____9111
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9112 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9113 = this;
  var this__9114 = this;
  return cljs.core.pr_str.call(null, this__9114)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9115 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9116 = this;
  if(this__9116.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9116.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9117 = this;
  return cljs.core.peek.call(null, this__9117.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9118 = this;
  var t__9119 = cljs.core.first.call(null, this__9118.stack);
  var next_stack__9120 = cljs.core.tree_map_seq_push.call(null, this__9118.ascending_QMARK_ ? t__9119.right : t__9119.left, cljs.core.next.call(null, this__9118.stack), this__9118.ascending_QMARK_);
  if(!(next_stack__9120 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9120, this__9118.ascending_QMARK_, this__9118.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9121 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9122 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9122.stack, this__9122.ascending_QMARK_, this__9122.cnt, this__9122.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9123 = this;
  return this__9123.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto____9125 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____9125) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____9125
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto____9127 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____9127) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____9127
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9131 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9131)) {
    return cljs.core.deref.call(null, init__9131)
  }else {
    var init__9132 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9131) : init__9131;
    if(cljs.core.reduced_QMARK_.call(null, init__9132)) {
      return cljs.core.deref.call(null, init__9132)
    }else {
      var init__9133 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9132) : init__9132;
      if(cljs.core.reduced_QMARK_.call(null, init__9133)) {
        return cljs.core.deref.call(null, init__9133)
      }else {
        return init__9133
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9136 = this;
  var h__2255__auto____9137 = this__9136.__hash;
  if(!(h__2255__auto____9137 == null)) {
    return h__2255__auto____9137
  }else {
    var h__2255__auto____9138 = cljs.core.hash_coll.call(null, coll);
    this__9136.__hash = h__2255__auto____9138;
    return h__2255__auto____9138
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9139 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9140 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9141 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9141.key, this__9141.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9189 = null;
  var G__9189__2 = function(this_sym9142, k) {
    var this__9144 = this;
    var this_sym9142__9145 = this;
    var node__9146 = this_sym9142__9145;
    return node__9146.cljs$core$ILookup$_lookup$arity$2(node__9146, k)
  };
  var G__9189__3 = function(this_sym9143, k, not_found) {
    var this__9144 = this;
    var this_sym9143__9147 = this;
    var node__9148 = this_sym9143__9147;
    return node__9148.cljs$core$ILookup$_lookup$arity$3(node__9148, k, not_found)
  };
  G__9189 = function(this_sym9143, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9189__2.call(this, this_sym9143, k);
      case 3:
        return G__9189__3.call(this, this_sym9143, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9189
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9134, args9135) {
  var this__9149 = this;
  return this_sym9134.call.apply(this_sym9134, [this_sym9134].concat(args9135.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9150 = this;
  return cljs.core.PersistentVector.fromArray([this__9150.key, this__9150.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9151 = this;
  return this__9151.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9152 = this;
  return this__9152.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9153 = this;
  var node__9154 = this;
  return ins.balance_right(node__9154)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9155 = this;
  var node__9156 = this;
  return new cljs.core.RedNode(this__9155.key, this__9155.val, this__9155.left, this__9155.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9157 = this;
  var node__9158 = this;
  return cljs.core.balance_right_del.call(null, this__9157.key, this__9157.val, this__9157.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9159 = this;
  var node__9160 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9161 = this;
  var node__9162 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9162, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9163 = this;
  var node__9164 = this;
  return cljs.core.balance_left_del.call(null, this__9163.key, this__9163.val, del, this__9163.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9165 = this;
  var node__9166 = this;
  return ins.balance_left(node__9166)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9167 = this;
  var node__9168 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9168, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9190 = null;
  var G__9190__0 = function() {
    var this__9169 = this;
    var this__9171 = this;
    return cljs.core.pr_str.call(null, this__9171)
  };
  G__9190 = function() {
    switch(arguments.length) {
      case 0:
        return G__9190__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9190
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9172 = this;
  var node__9173 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9173, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9174 = this;
  var node__9175 = this;
  return node__9175
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9176 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9177 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9178 = this;
  return cljs.core.list.call(null, this__9178.key, this__9178.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9179 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9180 = this;
  return this__9180.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9181 = this;
  return cljs.core.PersistentVector.fromArray([this__9181.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9182 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9182.key, this__9182.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9183 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9184 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9184.key, this__9184.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9185 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9186 = this;
  if(n === 0) {
    return this__9186.key
  }else {
    if(n === 1) {
      return this__9186.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9187 = this;
  if(n === 0) {
    return this__9187.key
  }else {
    if(n === 1) {
      return this__9187.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9188 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9193 = this;
  var h__2255__auto____9194 = this__9193.__hash;
  if(!(h__2255__auto____9194 == null)) {
    return h__2255__auto____9194
  }else {
    var h__2255__auto____9195 = cljs.core.hash_coll.call(null, coll);
    this__9193.__hash = h__2255__auto____9195;
    return h__2255__auto____9195
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9196 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9197 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9198 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9198.key, this__9198.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9246 = null;
  var G__9246__2 = function(this_sym9199, k) {
    var this__9201 = this;
    var this_sym9199__9202 = this;
    var node__9203 = this_sym9199__9202;
    return node__9203.cljs$core$ILookup$_lookup$arity$2(node__9203, k)
  };
  var G__9246__3 = function(this_sym9200, k, not_found) {
    var this__9201 = this;
    var this_sym9200__9204 = this;
    var node__9205 = this_sym9200__9204;
    return node__9205.cljs$core$ILookup$_lookup$arity$3(node__9205, k, not_found)
  };
  G__9246 = function(this_sym9200, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9246__2.call(this, this_sym9200, k);
      case 3:
        return G__9246__3.call(this, this_sym9200, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9246
}();
cljs.core.RedNode.prototype.apply = function(this_sym9191, args9192) {
  var this__9206 = this;
  return this_sym9191.call.apply(this_sym9191, [this_sym9191].concat(args9192.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9207 = this;
  return cljs.core.PersistentVector.fromArray([this__9207.key, this__9207.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9208 = this;
  return this__9208.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9209 = this;
  return this__9209.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9210 = this;
  var node__9211 = this;
  return new cljs.core.RedNode(this__9210.key, this__9210.val, this__9210.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9212 = this;
  var node__9213 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9214 = this;
  var node__9215 = this;
  return new cljs.core.RedNode(this__9214.key, this__9214.val, this__9214.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9216 = this;
  var node__9217 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9218 = this;
  var node__9219 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9219, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9220 = this;
  var node__9221 = this;
  return new cljs.core.RedNode(this__9220.key, this__9220.val, del, this__9220.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9222 = this;
  var node__9223 = this;
  return new cljs.core.RedNode(this__9222.key, this__9222.val, ins, this__9222.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9224 = this;
  var node__9225 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9224.left)) {
    return new cljs.core.RedNode(this__9224.key, this__9224.val, this__9224.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9224.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9224.right)) {
      return new cljs.core.RedNode(this__9224.right.key, this__9224.right.val, new cljs.core.BlackNode(this__9224.key, this__9224.val, this__9224.left, this__9224.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9224.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9225, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9247 = null;
  var G__9247__0 = function() {
    var this__9226 = this;
    var this__9228 = this;
    return cljs.core.pr_str.call(null, this__9228)
  };
  G__9247 = function() {
    switch(arguments.length) {
      case 0:
        return G__9247__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9247
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9229 = this;
  var node__9230 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9229.right)) {
    return new cljs.core.RedNode(this__9229.key, this__9229.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9229.left, null), this__9229.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9229.left)) {
      return new cljs.core.RedNode(this__9229.left.key, this__9229.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9229.left.left, null), new cljs.core.BlackNode(this__9229.key, this__9229.val, this__9229.left.right, this__9229.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9230, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9231 = this;
  var node__9232 = this;
  return new cljs.core.BlackNode(this__9231.key, this__9231.val, this__9231.left, this__9231.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9233 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9234 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9235 = this;
  return cljs.core.list.call(null, this__9235.key, this__9235.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9236 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9237 = this;
  return this__9237.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9238 = this;
  return cljs.core.PersistentVector.fromArray([this__9238.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9239 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9239.key, this__9239.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9240 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9241 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9241.key, this__9241.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9242 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9243 = this;
  if(n === 0) {
    return this__9243.key
  }else {
    if(n === 1) {
      return this__9243.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9244 = this;
  if(n === 0) {
    return this__9244.key
  }else {
    if(n === 1) {
      return this__9244.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9245 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9251 = comp.call(null, k, tree.key);
    if(c__9251 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9251 < 0) {
        var ins__9252 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9252 == null)) {
          return tree.add_left(ins__9252)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9253 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9253 == null)) {
            return tree.add_right(ins__9253)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9256 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9256)) {
            return new cljs.core.RedNode(app__9256.key, app__9256.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9256.left, null), new cljs.core.RedNode(right.key, right.val, app__9256.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9256, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9257 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9257)) {
              return new cljs.core.RedNode(app__9257.key, app__9257.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9257.left, null), new cljs.core.BlackNode(right.key, right.val, app__9257.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9257, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9263 = comp.call(null, k, tree.key);
    if(c__9263 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9263 < 0) {
        var del__9264 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____9265 = !(del__9264 == null);
          if(or__3943__auto____9265) {
            return or__3943__auto____9265
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9264, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9264, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9266 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____9267 = !(del__9266 == null);
            if(or__3943__auto____9267) {
              return or__3943__auto____9267
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9266)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9266, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9270 = tree.key;
  var c__9271 = comp.call(null, k, tk__9270);
  if(c__9271 === 0) {
    return tree.replace(tk__9270, v, tree.left, tree.right)
  }else {
    if(c__9271 < 0) {
      return tree.replace(tk__9270, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9270, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9274 = this;
  var h__2255__auto____9275 = this__9274.__hash;
  if(!(h__2255__auto____9275 == null)) {
    return h__2255__auto____9275
  }else {
    var h__2255__auto____9276 = cljs.core.hash_imap.call(null, coll);
    this__9274.__hash = h__2255__auto____9276;
    return h__2255__auto____9276
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9277 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9278 = this;
  var n__9279 = coll.entry_at(k);
  if(!(n__9279 == null)) {
    return n__9279.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9280 = this;
  var found__9281 = [null];
  var t__9282 = cljs.core.tree_map_add.call(null, this__9280.comp, this__9280.tree, k, v, found__9281);
  if(t__9282 == null) {
    var found_node__9283 = cljs.core.nth.call(null, found__9281, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9283.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9280.comp, cljs.core.tree_map_replace.call(null, this__9280.comp, this__9280.tree, k, v), this__9280.cnt, this__9280.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9280.comp, t__9282.blacken(), this__9280.cnt + 1, this__9280.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9284 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9318 = null;
  var G__9318__2 = function(this_sym9285, k) {
    var this__9287 = this;
    var this_sym9285__9288 = this;
    var coll__9289 = this_sym9285__9288;
    return coll__9289.cljs$core$ILookup$_lookup$arity$2(coll__9289, k)
  };
  var G__9318__3 = function(this_sym9286, k, not_found) {
    var this__9287 = this;
    var this_sym9286__9290 = this;
    var coll__9291 = this_sym9286__9290;
    return coll__9291.cljs$core$ILookup$_lookup$arity$3(coll__9291, k, not_found)
  };
  G__9318 = function(this_sym9286, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9318__2.call(this, this_sym9286, k);
      case 3:
        return G__9318__3.call(this, this_sym9286, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9318
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9272, args9273) {
  var this__9292 = this;
  return this_sym9272.call.apply(this_sym9272, [this_sym9272].concat(args9273.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9293 = this;
  if(!(this__9293.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9293.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9294 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9295 = this;
  if(this__9295.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9295.tree, false, this__9295.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9296 = this;
  var this__9297 = this;
  return cljs.core.pr_str.call(null, this__9297)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9298 = this;
  var coll__9299 = this;
  var t__9300 = this__9298.tree;
  while(true) {
    if(!(t__9300 == null)) {
      var c__9301 = this__9298.comp.call(null, k, t__9300.key);
      if(c__9301 === 0) {
        return t__9300
      }else {
        if(c__9301 < 0) {
          var G__9319 = t__9300.left;
          t__9300 = G__9319;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9320 = t__9300.right;
            t__9300 = G__9320;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9302 = this;
  if(this__9302.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9302.tree, ascending_QMARK_, this__9302.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9303 = this;
  if(this__9303.cnt > 0) {
    var stack__9304 = null;
    var t__9305 = this__9303.tree;
    while(true) {
      if(!(t__9305 == null)) {
        var c__9306 = this__9303.comp.call(null, k, t__9305.key);
        if(c__9306 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9304, t__9305), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9306 < 0) {
              var G__9321 = cljs.core.conj.call(null, stack__9304, t__9305);
              var G__9322 = t__9305.left;
              stack__9304 = G__9321;
              t__9305 = G__9322;
              continue
            }else {
              var G__9323 = stack__9304;
              var G__9324 = t__9305.right;
              stack__9304 = G__9323;
              t__9305 = G__9324;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9306 > 0) {
                var G__9325 = cljs.core.conj.call(null, stack__9304, t__9305);
                var G__9326 = t__9305.right;
                stack__9304 = G__9325;
                t__9305 = G__9326;
                continue
              }else {
                var G__9327 = stack__9304;
                var G__9328 = t__9305.left;
                stack__9304 = G__9327;
                t__9305 = G__9328;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9304 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9304, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9307 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9308 = this;
  return this__9308.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9309 = this;
  if(this__9309.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9309.tree, true, this__9309.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9310 = this;
  return this__9310.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9311 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9312 = this;
  return new cljs.core.PersistentTreeMap(this__9312.comp, this__9312.tree, this__9312.cnt, meta, this__9312.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9313 = this;
  return this__9313.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9314 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9314.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9315 = this;
  var found__9316 = [null];
  var t__9317 = cljs.core.tree_map_remove.call(null, this__9315.comp, this__9315.tree, k, found__9316);
  if(t__9317 == null) {
    if(cljs.core.nth.call(null, found__9316, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9315.comp, null, 0, this__9315.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9315.comp, t__9317.blacken(), this__9315.cnt - 1, this__9315.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9331 = cljs.core.seq.call(null, keyvals);
    var out__9332 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9331) {
        var G__9333 = cljs.core.nnext.call(null, in__9331);
        var G__9334 = cljs.core.assoc_BANG_.call(null, out__9332, cljs.core.first.call(null, in__9331), cljs.core.second.call(null, in__9331));
        in__9331 = G__9333;
        out__9332 = G__9334;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9332)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9335) {
    var keyvals = cljs.core.seq(arglist__9335);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9336) {
    var keyvals = cljs.core.seq(arglist__9336);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9340 = [];
    var obj__9341 = {};
    var kvs__9342 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9342) {
        ks__9340.push(cljs.core.first.call(null, kvs__9342));
        obj__9341[cljs.core.first.call(null, kvs__9342)] = cljs.core.second.call(null, kvs__9342);
        var G__9343 = cljs.core.nnext.call(null, kvs__9342);
        kvs__9342 = G__9343;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9340, obj__9341)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9344) {
    var keyvals = cljs.core.seq(arglist__9344);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9347 = cljs.core.seq.call(null, keyvals);
    var out__9348 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9347) {
        var G__9349 = cljs.core.nnext.call(null, in__9347);
        var G__9350 = cljs.core.assoc.call(null, out__9348, cljs.core.first.call(null, in__9347), cljs.core.second.call(null, in__9347));
        in__9347 = G__9349;
        out__9348 = G__9350;
        continue
      }else {
        return out__9348
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9351) {
    var keyvals = cljs.core.seq(arglist__9351);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9354 = cljs.core.seq.call(null, keyvals);
    var out__9355 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9354) {
        var G__9356 = cljs.core.nnext.call(null, in__9354);
        var G__9357 = cljs.core.assoc.call(null, out__9355, cljs.core.first.call(null, in__9354), cljs.core.second.call(null, in__9354));
        in__9354 = G__9356;
        out__9355 = G__9357;
        continue
      }else {
        return out__9355
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9358) {
    var comparator = cljs.core.first(arglist__9358);
    var keyvals = cljs.core.rest(arglist__9358);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9359_SHARP_, p2__9360_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____9362 = p1__9359_SHARP_;
          if(cljs.core.truth_(or__3943__auto____9362)) {
            return or__3943__auto____9362
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9360_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9363) {
    var maps = cljs.core.seq(arglist__9363);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9371 = function(m, e) {
        var k__9369 = cljs.core.first.call(null, e);
        var v__9370 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9369)) {
          return cljs.core.assoc.call(null, m, k__9369, f.call(null, cljs.core._lookup.call(null, m, k__9369, null), v__9370))
        }else {
          return cljs.core.assoc.call(null, m, k__9369, v__9370)
        }
      };
      var merge2__9373 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9371, function() {
          var or__3943__auto____9372 = m1;
          if(cljs.core.truth_(or__3943__auto____9372)) {
            return or__3943__auto____9372
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9373, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9374) {
    var f = cljs.core.first(arglist__9374);
    var maps = cljs.core.rest(arglist__9374);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9379 = cljs.core.ObjMap.EMPTY;
  var keys__9380 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9380) {
      var key__9381 = cljs.core.first.call(null, keys__9380);
      var entry__9382 = cljs.core._lookup.call(null, map, key__9381, "\ufdd0'cljs.core/not-found");
      var G__9383 = cljs.core.not_EQ_.call(null, entry__9382, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9379, key__9381, entry__9382) : ret__9379;
      var G__9384 = cljs.core.next.call(null, keys__9380);
      ret__9379 = G__9383;
      keys__9380 = G__9384;
      continue
    }else {
      return ret__9379
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9388 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9388.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9389 = this;
  var h__2255__auto____9390 = this__9389.__hash;
  if(!(h__2255__auto____9390 == null)) {
    return h__2255__auto____9390
  }else {
    var h__2255__auto____9391 = cljs.core.hash_iset.call(null, coll);
    this__9389.__hash = h__2255__auto____9391;
    return h__2255__auto____9391
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9392 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9393 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9393.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9414 = null;
  var G__9414__2 = function(this_sym9394, k) {
    var this__9396 = this;
    var this_sym9394__9397 = this;
    var coll__9398 = this_sym9394__9397;
    return coll__9398.cljs$core$ILookup$_lookup$arity$2(coll__9398, k)
  };
  var G__9414__3 = function(this_sym9395, k, not_found) {
    var this__9396 = this;
    var this_sym9395__9399 = this;
    var coll__9400 = this_sym9395__9399;
    return coll__9400.cljs$core$ILookup$_lookup$arity$3(coll__9400, k, not_found)
  };
  G__9414 = function(this_sym9395, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9414__2.call(this, this_sym9395, k);
      case 3:
        return G__9414__3.call(this, this_sym9395, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9414
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9386, args9387) {
  var this__9401 = this;
  return this_sym9386.call.apply(this_sym9386, [this_sym9386].concat(args9387.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9402 = this;
  return new cljs.core.PersistentHashSet(this__9402.meta, cljs.core.assoc.call(null, this__9402.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9403 = this;
  var this__9404 = this;
  return cljs.core.pr_str.call(null, this__9404)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9405 = this;
  return cljs.core.keys.call(null, this__9405.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9406 = this;
  return new cljs.core.PersistentHashSet(this__9406.meta, cljs.core.dissoc.call(null, this__9406.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9407 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9408 = this;
  var and__3941__auto____9409 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9409) {
    var and__3941__auto____9410 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9410) {
      return cljs.core.every_QMARK_.call(null, function(p1__9385_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9385_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9410
    }
  }else {
    return and__3941__auto____9409
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9411 = this;
  return new cljs.core.PersistentHashSet(meta, this__9411.hash_map, this__9411.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9412 = this;
  return this__9412.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9413 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9413.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9415 = cljs.core.count.call(null, items);
  var i__9416 = 0;
  var out__9417 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9416 < len__9415) {
      var G__9418 = i__9416 + 1;
      var G__9419 = cljs.core.conj_BANG_.call(null, out__9417, items[i__9416]);
      i__9416 = G__9418;
      out__9417 = G__9419;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9417)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9437 = null;
  var G__9437__2 = function(this_sym9423, k) {
    var this__9425 = this;
    var this_sym9423__9426 = this;
    var tcoll__9427 = this_sym9423__9426;
    if(cljs.core._lookup.call(null, this__9425.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9437__3 = function(this_sym9424, k, not_found) {
    var this__9425 = this;
    var this_sym9424__9428 = this;
    var tcoll__9429 = this_sym9424__9428;
    if(cljs.core._lookup.call(null, this__9425.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9437 = function(this_sym9424, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9437__2.call(this, this_sym9424, k);
      case 3:
        return G__9437__3.call(this, this_sym9424, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9437
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9421, args9422) {
  var this__9430 = this;
  return this_sym9421.call.apply(this_sym9421, [this_sym9421].concat(args9422.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9431 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9432 = this;
  if(cljs.core._lookup.call(null, this__9432.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9433 = this;
  return cljs.core.count.call(null, this__9433.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9434 = this;
  this__9434.transient_map = cljs.core.dissoc_BANG_.call(null, this__9434.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9435 = this;
  this__9435.transient_map = cljs.core.assoc_BANG_.call(null, this__9435.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9436 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9436.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9440 = this;
  var h__2255__auto____9441 = this__9440.__hash;
  if(!(h__2255__auto____9441 == null)) {
    return h__2255__auto____9441
  }else {
    var h__2255__auto____9442 = cljs.core.hash_iset.call(null, coll);
    this__9440.__hash = h__2255__auto____9442;
    return h__2255__auto____9442
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9443 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9444 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9444.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9470 = null;
  var G__9470__2 = function(this_sym9445, k) {
    var this__9447 = this;
    var this_sym9445__9448 = this;
    var coll__9449 = this_sym9445__9448;
    return coll__9449.cljs$core$ILookup$_lookup$arity$2(coll__9449, k)
  };
  var G__9470__3 = function(this_sym9446, k, not_found) {
    var this__9447 = this;
    var this_sym9446__9450 = this;
    var coll__9451 = this_sym9446__9450;
    return coll__9451.cljs$core$ILookup$_lookup$arity$3(coll__9451, k, not_found)
  };
  G__9470 = function(this_sym9446, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9470__2.call(this, this_sym9446, k);
      case 3:
        return G__9470__3.call(this, this_sym9446, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9470
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9438, args9439) {
  var this__9452 = this;
  return this_sym9438.call.apply(this_sym9438, [this_sym9438].concat(args9439.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9453 = this;
  return new cljs.core.PersistentTreeSet(this__9453.meta, cljs.core.assoc.call(null, this__9453.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9454 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9454.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9455 = this;
  var this__9456 = this;
  return cljs.core.pr_str.call(null, this__9456)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9457 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9457.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9458 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9458.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9459 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9460 = this;
  return cljs.core._comparator.call(null, this__9460.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9461 = this;
  return cljs.core.keys.call(null, this__9461.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9462 = this;
  return new cljs.core.PersistentTreeSet(this__9462.meta, cljs.core.dissoc.call(null, this__9462.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9463 = this;
  return cljs.core.count.call(null, this__9463.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9464 = this;
  var and__3941__auto____9465 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9465) {
    var and__3941__auto____9466 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9466) {
      return cljs.core.every_QMARK_.call(null, function(p1__9420_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9420_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9466
    }
  }else {
    return and__3941__auto____9465
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9467 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9467.tree_map, this__9467.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9468 = this;
  return this__9468.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9469 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9469.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9475__delegate = function(keys) {
      var in__9473 = cljs.core.seq.call(null, keys);
      var out__9474 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9473)) {
          var G__9476 = cljs.core.next.call(null, in__9473);
          var G__9477 = cljs.core.conj_BANG_.call(null, out__9474, cljs.core.first.call(null, in__9473));
          in__9473 = G__9476;
          out__9474 = G__9477;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9474)
        }
        break
      }
    };
    var G__9475 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9475__delegate.call(this, keys)
    };
    G__9475.cljs$lang$maxFixedArity = 0;
    G__9475.cljs$lang$applyTo = function(arglist__9478) {
      var keys = cljs.core.seq(arglist__9478);
      return G__9475__delegate(keys)
    };
    G__9475.cljs$lang$arity$variadic = G__9475__delegate;
    return G__9475
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9479) {
    var keys = cljs.core.seq(arglist__9479);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9481) {
    var comparator = cljs.core.first(arglist__9481);
    var keys = cljs.core.rest(arglist__9481);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9487 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____9488 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____9488)) {
        var e__9489 = temp__4090__auto____9488;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9489))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9487, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9480_SHARP_) {
      var temp__4090__auto____9490 = cljs.core.find.call(null, smap, p1__9480_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____9490)) {
        var e__9491 = temp__4090__auto____9490;
        return cljs.core.second.call(null, e__9491)
      }else {
        return p1__9480_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9521 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9514, seen) {
        while(true) {
          var vec__9515__9516 = p__9514;
          var f__9517 = cljs.core.nth.call(null, vec__9515__9516, 0, null);
          var xs__9518 = vec__9515__9516;
          var temp__4092__auto____9519 = cljs.core.seq.call(null, xs__9518);
          if(temp__4092__auto____9519) {
            var s__9520 = temp__4092__auto____9519;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9517)) {
              var G__9522 = cljs.core.rest.call(null, s__9520);
              var G__9523 = seen;
              p__9514 = G__9522;
              seen = G__9523;
              continue
            }else {
              return cljs.core.cons.call(null, f__9517, step.call(null, cljs.core.rest.call(null, s__9520), cljs.core.conj.call(null, seen, f__9517)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9521.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9526 = cljs.core.PersistentVector.EMPTY;
  var s__9527 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9527)) {
      var G__9528 = cljs.core.conj.call(null, ret__9526, cljs.core.first.call(null, s__9527));
      var G__9529 = cljs.core.next.call(null, s__9527);
      ret__9526 = G__9528;
      s__9527 = G__9529;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9526)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____9532 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____9532) {
        return or__3943__auto____9532
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9533 = x.lastIndexOf("/");
      if(i__9533 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9533 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto____9536 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____9536) {
      return or__3943__auto____9536
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9537 = x.lastIndexOf("/");
    if(i__9537 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9537)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9544 = cljs.core.ObjMap.EMPTY;
  var ks__9545 = cljs.core.seq.call(null, keys);
  var vs__9546 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____9547 = ks__9545;
      if(and__3941__auto____9547) {
        return vs__9546
      }else {
        return and__3941__auto____9547
      }
    }()) {
      var G__9548 = cljs.core.assoc.call(null, map__9544, cljs.core.first.call(null, ks__9545), cljs.core.first.call(null, vs__9546));
      var G__9549 = cljs.core.next.call(null, ks__9545);
      var G__9550 = cljs.core.next.call(null, vs__9546);
      map__9544 = G__9548;
      ks__9545 = G__9549;
      vs__9546 = G__9550;
      continue
    }else {
      return map__9544
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9553__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9538_SHARP_, p2__9539_SHARP_) {
        return max_key.call(null, k, p1__9538_SHARP_, p2__9539_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9553 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9553__delegate.call(this, k, x, y, more)
    };
    G__9553.cljs$lang$maxFixedArity = 3;
    G__9553.cljs$lang$applyTo = function(arglist__9554) {
      var k = cljs.core.first(arglist__9554);
      var x = cljs.core.first(cljs.core.next(arglist__9554));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9554)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9554)));
      return G__9553__delegate(k, x, y, more)
    };
    G__9553.cljs$lang$arity$variadic = G__9553__delegate;
    return G__9553
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9555__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9551_SHARP_, p2__9552_SHARP_) {
        return min_key.call(null, k, p1__9551_SHARP_, p2__9552_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9555 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9555__delegate.call(this, k, x, y, more)
    };
    G__9555.cljs$lang$maxFixedArity = 3;
    G__9555.cljs$lang$applyTo = function(arglist__9556) {
      var k = cljs.core.first(arglist__9556);
      var x = cljs.core.first(cljs.core.next(arglist__9556));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9556)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9556)));
      return G__9555__delegate(k, x, y, more)
    };
    G__9555.cljs$lang$arity$variadic = G__9555__delegate;
    return G__9555
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9559 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9559) {
        var s__9560 = temp__4092__auto____9559;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9560), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9560)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9563 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9563) {
      var s__9564 = temp__4092__auto____9563;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9564)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9564), take_while.call(null, pred, cljs.core.rest.call(null, s__9564)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9566 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9566.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9578 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____9579 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____9579)) {
        var vec__9580__9581 = temp__4092__auto____9579;
        var e__9582 = cljs.core.nth.call(null, vec__9580__9581, 0, null);
        var s__9583 = vec__9580__9581;
        if(cljs.core.truth_(include__9578.call(null, e__9582))) {
          return s__9583
        }else {
          return cljs.core.next.call(null, s__9583)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9578, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9584 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____9584)) {
      var vec__9585__9586 = temp__4092__auto____9584;
      var e__9587 = cljs.core.nth.call(null, vec__9585__9586, 0, null);
      var s__9588 = vec__9585__9586;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9587)) ? s__9588 : cljs.core.next.call(null, s__9588))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9600 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____9601 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____9601)) {
        var vec__9602__9603 = temp__4092__auto____9601;
        var e__9604 = cljs.core.nth.call(null, vec__9602__9603, 0, null);
        var s__9605 = vec__9602__9603;
        if(cljs.core.truth_(include__9600.call(null, e__9604))) {
          return s__9605
        }else {
          return cljs.core.next.call(null, s__9605)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9600, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9606 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____9606)) {
      var vec__9607__9608 = temp__4092__auto____9606;
      var e__9609 = cljs.core.nth.call(null, vec__9607__9608, 0, null);
      var s__9610 = vec__9607__9608;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9609)) ? s__9610 : cljs.core.next.call(null, s__9610))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9611 = this;
  var h__2255__auto____9612 = this__9611.__hash;
  if(!(h__2255__auto____9612 == null)) {
    return h__2255__auto____9612
  }else {
    var h__2255__auto____9613 = cljs.core.hash_coll.call(null, rng);
    this__9611.__hash = h__2255__auto____9613;
    return h__2255__auto____9613
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9614 = this;
  if(this__9614.step > 0) {
    if(this__9614.start + this__9614.step < this__9614.end) {
      return new cljs.core.Range(this__9614.meta, this__9614.start + this__9614.step, this__9614.end, this__9614.step, null)
    }else {
      return null
    }
  }else {
    if(this__9614.start + this__9614.step > this__9614.end) {
      return new cljs.core.Range(this__9614.meta, this__9614.start + this__9614.step, this__9614.end, this__9614.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9615 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9616 = this;
  var this__9617 = this;
  return cljs.core.pr_str.call(null, this__9617)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9618 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9619 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9620 = this;
  if(this__9620.step > 0) {
    if(this__9620.start < this__9620.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9620.start > this__9620.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9621 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9621.end - this__9621.start) / this__9621.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9622 = this;
  return this__9622.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9623 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9623.meta, this__9623.start + this__9623.step, this__9623.end, this__9623.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9624 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9625 = this;
  return new cljs.core.Range(meta, this__9625.start, this__9625.end, this__9625.step, this__9625.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9626 = this;
  return this__9626.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9627 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9627.start + n * this__9627.step
  }else {
    if(function() {
      var and__3941__auto____9628 = this__9627.start > this__9627.end;
      if(and__3941__auto____9628) {
        return this__9627.step === 0
      }else {
        return and__3941__auto____9628
      }
    }()) {
      return this__9627.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9629 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9629.start + n * this__9629.step
  }else {
    if(function() {
      var and__3941__auto____9630 = this__9629.start > this__9629.end;
      if(and__3941__auto____9630) {
        return this__9629.step === 0
      }else {
        return and__3941__auto____9630
      }
    }()) {
      return this__9629.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9631 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9631.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9634 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9634) {
      var s__9635 = temp__4092__auto____9634;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9635), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9635)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9642 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9642) {
      var s__9643 = temp__4092__auto____9642;
      var fst__9644 = cljs.core.first.call(null, s__9643);
      var fv__9645 = f.call(null, fst__9644);
      var run__9646 = cljs.core.cons.call(null, fst__9644, cljs.core.take_while.call(null, function(p1__9636_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9645, f.call(null, p1__9636_SHARP_))
      }, cljs.core.next.call(null, s__9643)));
      return cljs.core.cons.call(null, run__9646, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9646), s__9643))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____9661 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____9661) {
        var s__9662 = temp__4090__auto____9661;
        return reductions.call(null, f, cljs.core.first.call(null, s__9662), cljs.core.rest.call(null, s__9662))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9663 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9663) {
        var s__9664 = temp__4092__auto____9663;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9664)), cljs.core.rest.call(null, s__9664))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9667 = null;
      var G__9667__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9667__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9667__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9667__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9667__4 = function() {
        var G__9668__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9668 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9668__delegate.call(this, x, y, z, args)
        };
        G__9668.cljs$lang$maxFixedArity = 3;
        G__9668.cljs$lang$applyTo = function(arglist__9669) {
          var x = cljs.core.first(arglist__9669);
          var y = cljs.core.first(cljs.core.next(arglist__9669));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9669)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9669)));
          return G__9668__delegate(x, y, z, args)
        };
        G__9668.cljs$lang$arity$variadic = G__9668__delegate;
        return G__9668
      }();
      G__9667 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9667__0.call(this);
          case 1:
            return G__9667__1.call(this, x);
          case 2:
            return G__9667__2.call(this, x, y);
          case 3:
            return G__9667__3.call(this, x, y, z);
          default:
            return G__9667__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9667.cljs$lang$maxFixedArity = 3;
      G__9667.cljs$lang$applyTo = G__9667__4.cljs$lang$applyTo;
      return G__9667
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9670 = null;
      var G__9670__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9670__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9670__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9670__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9670__4 = function() {
        var G__9671__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9671 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9671__delegate.call(this, x, y, z, args)
        };
        G__9671.cljs$lang$maxFixedArity = 3;
        G__9671.cljs$lang$applyTo = function(arglist__9672) {
          var x = cljs.core.first(arglist__9672);
          var y = cljs.core.first(cljs.core.next(arglist__9672));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9672)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9672)));
          return G__9671__delegate(x, y, z, args)
        };
        G__9671.cljs$lang$arity$variadic = G__9671__delegate;
        return G__9671
      }();
      G__9670 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9670__0.call(this);
          case 1:
            return G__9670__1.call(this, x);
          case 2:
            return G__9670__2.call(this, x, y);
          case 3:
            return G__9670__3.call(this, x, y, z);
          default:
            return G__9670__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9670.cljs$lang$maxFixedArity = 3;
      G__9670.cljs$lang$applyTo = G__9670__4.cljs$lang$applyTo;
      return G__9670
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9673 = null;
      var G__9673__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9673__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9673__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9673__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9673__4 = function() {
        var G__9674__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9674 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9674__delegate.call(this, x, y, z, args)
        };
        G__9674.cljs$lang$maxFixedArity = 3;
        G__9674.cljs$lang$applyTo = function(arglist__9675) {
          var x = cljs.core.first(arglist__9675);
          var y = cljs.core.first(cljs.core.next(arglist__9675));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9675)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9675)));
          return G__9674__delegate(x, y, z, args)
        };
        G__9674.cljs$lang$arity$variadic = G__9674__delegate;
        return G__9674
      }();
      G__9673 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9673__0.call(this);
          case 1:
            return G__9673__1.call(this, x);
          case 2:
            return G__9673__2.call(this, x, y);
          case 3:
            return G__9673__3.call(this, x, y, z);
          default:
            return G__9673__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9673.cljs$lang$maxFixedArity = 3;
      G__9673.cljs$lang$applyTo = G__9673__4.cljs$lang$applyTo;
      return G__9673
    }()
  };
  var juxt__4 = function() {
    var G__9676__delegate = function(f, g, h, fs) {
      var fs__9666 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9677 = null;
        var G__9677__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9647_SHARP_, p2__9648_SHARP_) {
            return cljs.core.conj.call(null, p1__9647_SHARP_, p2__9648_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9666)
        };
        var G__9677__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9649_SHARP_, p2__9650_SHARP_) {
            return cljs.core.conj.call(null, p1__9649_SHARP_, p2__9650_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9666)
        };
        var G__9677__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9651_SHARP_, p2__9652_SHARP_) {
            return cljs.core.conj.call(null, p1__9651_SHARP_, p2__9652_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9666)
        };
        var G__9677__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9653_SHARP_, p2__9654_SHARP_) {
            return cljs.core.conj.call(null, p1__9653_SHARP_, p2__9654_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9666)
        };
        var G__9677__4 = function() {
          var G__9678__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9655_SHARP_, p2__9656_SHARP_) {
              return cljs.core.conj.call(null, p1__9655_SHARP_, cljs.core.apply.call(null, p2__9656_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9666)
          };
          var G__9678 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9678__delegate.call(this, x, y, z, args)
          };
          G__9678.cljs$lang$maxFixedArity = 3;
          G__9678.cljs$lang$applyTo = function(arglist__9679) {
            var x = cljs.core.first(arglist__9679);
            var y = cljs.core.first(cljs.core.next(arglist__9679));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9679)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9679)));
            return G__9678__delegate(x, y, z, args)
          };
          G__9678.cljs$lang$arity$variadic = G__9678__delegate;
          return G__9678
        }();
        G__9677 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9677__0.call(this);
            case 1:
              return G__9677__1.call(this, x);
            case 2:
              return G__9677__2.call(this, x, y);
            case 3:
              return G__9677__3.call(this, x, y, z);
            default:
              return G__9677__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9677.cljs$lang$maxFixedArity = 3;
        G__9677.cljs$lang$applyTo = G__9677__4.cljs$lang$applyTo;
        return G__9677
      }()
    };
    var G__9676 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9676__delegate.call(this, f, g, h, fs)
    };
    G__9676.cljs$lang$maxFixedArity = 3;
    G__9676.cljs$lang$applyTo = function(arglist__9680) {
      var f = cljs.core.first(arglist__9680);
      var g = cljs.core.first(cljs.core.next(arglist__9680));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9680)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9680)));
      return G__9676__delegate(f, g, h, fs)
    };
    G__9676.cljs$lang$arity$variadic = G__9676__delegate;
    return G__9676
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9683 = cljs.core.next.call(null, coll);
        coll = G__9683;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____9682 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____9682) {
          return n > 0
        }else {
          return and__3941__auto____9682
        }
      }())) {
        var G__9684 = n - 1;
        var G__9685 = cljs.core.next.call(null, coll);
        n = G__9684;
        coll = G__9685;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9687 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9687), s)) {
    if(cljs.core.count.call(null, matches__9687) === 1) {
      return cljs.core.first.call(null, matches__9687)
    }else {
      return cljs.core.vec.call(null, matches__9687)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9689 = re.exec(s);
  if(matches__9689 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9689) === 1) {
      return cljs.core.first.call(null, matches__9689)
    }else {
      return cljs.core.vec.call(null, matches__9689)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9694 = cljs.core.re_find.call(null, re, s);
  var match_idx__9695 = s.search(re);
  var match_str__9696 = cljs.core.coll_QMARK_.call(null, match_data__9694) ? cljs.core.first.call(null, match_data__9694) : match_data__9694;
  var post_match__9697 = cljs.core.subs.call(null, s, match_idx__9695 + cljs.core.count.call(null, match_str__9696));
  if(cljs.core.truth_(match_data__9694)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9694, re_seq.call(null, re, post_match__9697))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9704__9705 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9706 = cljs.core.nth.call(null, vec__9704__9705, 0, null);
  var flags__9707 = cljs.core.nth.call(null, vec__9704__9705, 1, null);
  var pattern__9708 = cljs.core.nth.call(null, vec__9704__9705, 2, null);
  return new RegExp(pattern__9708, flags__9707)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9698_SHARP_) {
    return print_one.call(null, p1__9698_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____9718 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____9718)) {
            var and__3941__auto____9722 = function() {
              var G__9719__9720 = obj;
              if(G__9719__9720) {
                if(function() {
                  var or__3943__auto____9721 = G__9719__9720.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____9721) {
                    return or__3943__auto____9721
                  }else {
                    return G__9719__9720.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9719__9720.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9719__9720)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9719__9720)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____9722)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____9722
            }
          }else {
            return and__3941__auto____9718
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____9723 = !(obj == null);
          if(and__3941__auto____9723) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____9723
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9724__9725 = obj;
          if(G__9724__9725) {
            if(function() {
              var or__3943__auto____9726 = G__9724__9725.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____9726) {
                return or__3943__auto____9726
              }else {
                return G__9724__9725.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9724__9725.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9724__9725)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9724__9725)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9746 = new goog.string.StringBuffer;
  var G__9747__9748 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9747__9748) {
    var string__9749 = cljs.core.first.call(null, G__9747__9748);
    var G__9747__9750 = G__9747__9748;
    while(true) {
      sb__9746.append(string__9749);
      var temp__4092__auto____9751 = cljs.core.next.call(null, G__9747__9750);
      if(temp__4092__auto____9751) {
        var G__9747__9752 = temp__4092__auto____9751;
        var G__9765 = cljs.core.first.call(null, G__9747__9752);
        var G__9766 = G__9747__9752;
        string__9749 = G__9765;
        G__9747__9750 = G__9766;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9753__9754 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9753__9754) {
    var obj__9755 = cljs.core.first.call(null, G__9753__9754);
    var G__9753__9756 = G__9753__9754;
    while(true) {
      sb__9746.append(" ");
      var G__9757__9758 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9755, opts));
      if(G__9757__9758) {
        var string__9759 = cljs.core.first.call(null, G__9757__9758);
        var G__9757__9760 = G__9757__9758;
        while(true) {
          sb__9746.append(string__9759);
          var temp__4092__auto____9761 = cljs.core.next.call(null, G__9757__9760);
          if(temp__4092__auto____9761) {
            var G__9757__9762 = temp__4092__auto____9761;
            var G__9767 = cljs.core.first.call(null, G__9757__9762);
            var G__9768 = G__9757__9762;
            string__9759 = G__9767;
            G__9757__9760 = G__9768;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9763 = cljs.core.next.call(null, G__9753__9756);
      if(temp__4092__auto____9763) {
        var G__9753__9764 = temp__4092__auto____9763;
        var G__9769 = cljs.core.first.call(null, G__9753__9764);
        var G__9770 = G__9753__9764;
        obj__9755 = G__9769;
        G__9753__9756 = G__9770;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9746
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9772 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9772.append("\n");
  return[cljs.core.str(sb__9772)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9791__9792 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9791__9792) {
    var string__9793 = cljs.core.first.call(null, G__9791__9792);
    var G__9791__9794 = G__9791__9792;
    while(true) {
      cljs.core.string_print.call(null, string__9793);
      var temp__4092__auto____9795 = cljs.core.next.call(null, G__9791__9794);
      if(temp__4092__auto____9795) {
        var G__9791__9796 = temp__4092__auto____9795;
        var G__9809 = cljs.core.first.call(null, G__9791__9796);
        var G__9810 = G__9791__9796;
        string__9793 = G__9809;
        G__9791__9794 = G__9810;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9797__9798 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9797__9798) {
    var obj__9799 = cljs.core.first.call(null, G__9797__9798);
    var G__9797__9800 = G__9797__9798;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9801__9802 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9799, opts));
      if(G__9801__9802) {
        var string__9803 = cljs.core.first.call(null, G__9801__9802);
        var G__9801__9804 = G__9801__9802;
        while(true) {
          cljs.core.string_print.call(null, string__9803);
          var temp__4092__auto____9805 = cljs.core.next.call(null, G__9801__9804);
          if(temp__4092__auto____9805) {
            var G__9801__9806 = temp__4092__auto____9805;
            var G__9811 = cljs.core.first.call(null, G__9801__9806);
            var G__9812 = G__9801__9806;
            string__9803 = G__9811;
            G__9801__9804 = G__9812;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9807 = cljs.core.next.call(null, G__9797__9800);
      if(temp__4092__auto____9807) {
        var G__9797__9808 = temp__4092__auto____9807;
        var G__9813 = cljs.core.first.call(null, G__9797__9808);
        var G__9814 = G__9797__9808;
        obj__9799 = G__9813;
        G__9797__9800 = G__9814;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9815) {
    var objs = cljs.core.seq(arglist__9815);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9816) {
    var objs = cljs.core.seq(arglist__9816);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9817) {
    var objs = cljs.core.seq(arglist__9817);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9818) {
    var objs = cljs.core.seq(arglist__9818);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9819) {
    var objs = cljs.core.seq(arglist__9819);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9820) {
    var objs = cljs.core.seq(arglist__9820);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9821) {
    var objs = cljs.core.seq(arglist__9821);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9822) {
    var objs = cljs.core.seq(arglist__9822);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9823) {
    var fmt = cljs.core.first(arglist__9823);
    var args = cljs.core.rest(arglist__9823);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9824 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9824, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9825 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9825, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9826 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9826, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto____9827 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____9827)) {
        var nspc__9828 = temp__4092__auto____9827;
        return[cljs.core.str(nspc__9828), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____9829 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____9829)) {
          var nspc__9830 = temp__4092__auto____9829;
          return[cljs.core.str(nspc__9830), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9831 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9831, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9833 = function(n, len) {
    var ns__9832 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9832) < len) {
        var G__9835 = [cljs.core.str("0"), cljs.core.str(ns__9832)].join("");
        ns__9832 = G__9835;
        continue
      }else {
        return ns__9832
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9833.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9833.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9833.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9833.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9833.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9833.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9834 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9834, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9836 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9837 = this;
  var G__9838__9839 = cljs.core.seq.call(null, this__9837.watches);
  if(G__9838__9839) {
    var G__9841__9843 = cljs.core.first.call(null, G__9838__9839);
    var vec__9842__9844 = G__9841__9843;
    var key__9845 = cljs.core.nth.call(null, vec__9842__9844, 0, null);
    var f__9846 = cljs.core.nth.call(null, vec__9842__9844, 1, null);
    var G__9838__9847 = G__9838__9839;
    var G__9841__9848 = G__9841__9843;
    var G__9838__9849 = G__9838__9847;
    while(true) {
      var vec__9850__9851 = G__9841__9848;
      var key__9852 = cljs.core.nth.call(null, vec__9850__9851, 0, null);
      var f__9853 = cljs.core.nth.call(null, vec__9850__9851, 1, null);
      var G__9838__9854 = G__9838__9849;
      f__9853.call(null, key__9852, this$, oldval, newval);
      var temp__4092__auto____9855 = cljs.core.next.call(null, G__9838__9854);
      if(temp__4092__auto____9855) {
        var G__9838__9856 = temp__4092__auto____9855;
        var G__9863 = cljs.core.first.call(null, G__9838__9856);
        var G__9864 = G__9838__9856;
        G__9841__9848 = G__9863;
        G__9838__9849 = G__9864;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9857 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9857.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9858 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9858.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9859 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9859.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9860 = this;
  return this__9860.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9861 = this;
  return this__9861.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9862 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9876__delegate = function(x, p__9865) {
      var map__9871__9872 = p__9865;
      var map__9871__9873 = cljs.core.seq_QMARK_.call(null, map__9871__9872) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9871__9872) : map__9871__9872;
      var validator__9874 = cljs.core._lookup.call(null, map__9871__9873, "\ufdd0'validator", null);
      var meta__9875 = cljs.core._lookup.call(null, map__9871__9873, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9875, validator__9874, null)
    };
    var G__9876 = function(x, var_args) {
      var p__9865 = null;
      if(goog.isDef(var_args)) {
        p__9865 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9876__delegate.call(this, x, p__9865)
    };
    G__9876.cljs$lang$maxFixedArity = 1;
    G__9876.cljs$lang$applyTo = function(arglist__9877) {
      var x = cljs.core.first(arglist__9877);
      var p__9865 = cljs.core.rest(arglist__9877);
      return G__9876__delegate(x, p__9865)
    };
    G__9876.cljs$lang$arity$variadic = G__9876__delegate;
    return G__9876
  }();
  atom = function(x, var_args) {
    var p__9865 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto____9881 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____9881)) {
    var validate__9882 = temp__4092__auto____9881;
    if(cljs.core.truth_(validate__9882.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__9883 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9883, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9884__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9884 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9884__delegate.call(this, a, f, x, y, z, more)
    };
    G__9884.cljs$lang$maxFixedArity = 5;
    G__9884.cljs$lang$applyTo = function(arglist__9885) {
      var a = cljs.core.first(arglist__9885);
      var f = cljs.core.first(cljs.core.next(arglist__9885));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9885)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9885))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9885)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9885)))));
      return G__9884__delegate(a, f, x, y, z, more)
    };
    G__9884.cljs$lang$arity$variadic = G__9884__delegate;
    return G__9884
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9886) {
    var iref = cljs.core.first(arglist__9886);
    var f = cljs.core.first(cljs.core.next(arglist__9886));
    var args = cljs.core.rest(cljs.core.next(arglist__9886));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9887 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9887.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9888 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9888.state, function(p__9889) {
    var map__9890__9891 = p__9889;
    var map__9890__9892 = cljs.core.seq_QMARK_.call(null, map__9890__9891) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9890__9891) : map__9890__9891;
    var curr_state__9893 = map__9890__9892;
    var done__9894 = cljs.core._lookup.call(null, map__9890__9892, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9894)) {
      return curr_state__9893
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9888.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9923__9924 = options;
    var map__9923__9925 = cljs.core.seq_QMARK_.call(null, map__9923__9924) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9923__9924) : map__9923__9924;
    var keywordize_keys__9926 = cljs.core._lookup.call(null, map__9923__9925, "\ufdd0'keywordize-keys", null);
    var keyfn__9927 = cljs.core.truth_(keywordize_keys__9926) ? cljs.core.keyword : cljs.core.str;
    var f__9950 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2525__auto____9949 = function iter__9939(s__9940) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9940__9945 = s__9940;
                    while(true) {
                      var temp__4092__auto____9946 = cljs.core.seq.call(null, s__9940__9945);
                      if(temp__4092__auto____9946) {
                        var xs__4579__auto____9947 = temp__4092__auto____9946;
                        var k__9948 = cljs.core.first.call(null, xs__4579__auto____9947);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9927.call(null, k__9948), thisfn.call(null, x[k__9948])], true), iter__9939.call(null, cljs.core.rest.call(null, s__9940__9945)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2525__auto____9949.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9950.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9951) {
    var x = cljs.core.first(arglist__9951);
    var options = cljs.core.rest(arglist__9951);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9956 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9960__delegate = function(args) {
      var temp__4090__auto____9957 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9956), args, null);
      if(cljs.core.truth_(temp__4090__auto____9957)) {
        var v__9958 = temp__4090__auto____9957;
        return v__9958
      }else {
        var ret__9959 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9956, cljs.core.assoc, args, ret__9959);
        return ret__9959
      }
    };
    var G__9960 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9960__delegate.call(this, args)
    };
    G__9960.cljs$lang$maxFixedArity = 0;
    G__9960.cljs$lang$applyTo = function(arglist__9961) {
      var args = cljs.core.seq(arglist__9961);
      return G__9960__delegate(args)
    };
    G__9960.cljs$lang$arity$variadic = G__9960__delegate;
    return G__9960
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9963 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9963)) {
        var G__9964 = ret__9963;
        f = G__9964;
        continue
      }else {
        return ret__9963
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9965__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9965 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9965__delegate.call(this, f, args)
    };
    G__9965.cljs$lang$maxFixedArity = 1;
    G__9965.cljs$lang$applyTo = function(arglist__9966) {
      var f = cljs.core.first(arglist__9966);
      var args = cljs.core.rest(arglist__9966);
      return G__9965__delegate(f, args)
    };
    G__9965.cljs$lang$arity$variadic = G__9965__delegate;
    return G__9965
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9968 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9968, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9968, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto____9977 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____9977) {
      return or__3943__auto____9977
    }else {
      var or__3943__auto____9978 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____9978) {
        return or__3943__auto____9978
      }else {
        var and__3941__auto____9979 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____9979) {
          var and__3941__auto____9980 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____9980) {
            var and__3941__auto____9981 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____9981) {
              var ret__9982 = true;
              var i__9983 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____9984 = cljs.core.not.call(null, ret__9982);
                  if(or__3943__auto____9984) {
                    return or__3943__auto____9984
                  }else {
                    return i__9983 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9982
                }else {
                  var G__9985 = isa_QMARK_.call(null, h, child.call(null, i__9983), parent.call(null, i__9983));
                  var G__9986 = i__9983 + 1;
                  ret__9982 = G__9985;
                  i__9983 = G__9986;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____9981
            }
          }else {
            return and__3941__auto____9980
          }
        }else {
          return and__3941__auto____9979
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728, "\ufdd0'column", 12))))].join(""));
    }
    var tp__9995 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9996 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9997 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9998 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____9999 = cljs.core.contains_QMARK_.call(null, tp__9995.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9997.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9997.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9995, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9998.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9996, parent, ta__9997), "\ufdd0'descendants":tf__9998.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9997, tag, td__9996)})
    }();
    if(cljs.core.truth_(or__3943__auto____9999)) {
      return or__3943__auto____9999
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10004 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10005 = cljs.core.truth_(parentMap__10004.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10004.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10006 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10005)) ? cljs.core.assoc.call(null, parentMap__10004, tag, childsParents__10005) : cljs.core.dissoc.call(null, parentMap__10004, tag);
    var deriv_seq__10007 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9987_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9987_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9987_SHARP_), cljs.core.second.call(null, p1__9987_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10006)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10004.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9988_SHARP_, p2__9989_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9988_SHARP_, p2__9989_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10007))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10015 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____10017 = cljs.core.truth_(function() {
    var and__3941__auto____10016 = xprefs__10015;
    if(cljs.core.truth_(and__3941__auto____10016)) {
      return xprefs__10015.call(null, y)
    }else {
      return and__3941__auto____10016
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____10017)) {
    return or__3943__auto____10017
  }else {
    var or__3943__auto____10019 = function() {
      var ps__10018 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10018) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10018), prefer_table))) {
          }else {
          }
          var G__10022 = cljs.core.rest.call(null, ps__10018);
          ps__10018 = G__10022;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____10019)) {
      return or__3943__auto____10019
    }else {
      var or__3943__auto____10021 = function() {
        var ps__10020 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10020) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10020), y, prefer_table))) {
            }else {
            }
            var G__10023 = cljs.core.rest.call(null, ps__10020);
            ps__10020 = G__10023;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____10021)) {
        return or__3943__auto____10021
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____10025 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____10025)) {
    return or__3943__auto____10025
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10043 = cljs.core.reduce.call(null, function(be, p__10035) {
    var vec__10036__10037 = p__10035;
    var k__10038 = cljs.core.nth.call(null, vec__10036__10037, 0, null);
    var ___10039 = cljs.core.nth.call(null, vec__10036__10037, 1, null);
    var e__10040 = vec__10036__10037;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10038)) {
      var be2__10042 = cljs.core.truth_(function() {
        var or__3943__auto____10041 = be == null;
        if(or__3943__auto____10041) {
          return or__3943__auto____10041
        }else {
          return cljs.core.dominates.call(null, k__10038, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10040 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10042), k__10038, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10038), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10042)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10042
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10043)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10043));
      return cljs.core.second.call(null, best_entry__10043)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto____10048 = mf;
    if(and__3941__auto____10048) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____10048
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2426__auto____10049 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10050 = cljs.core._reset[goog.typeOf(x__2426__auto____10049)];
      if(or__3943__auto____10050) {
        return or__3943__auto____10050
      }else {
        var or__3943__auto____10051 = cljs.core._reset["_"];
        if(or__3943__auto____10051) {
          return or__3943__auto____10051
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____10056 = mf;
    if(and__3941__auto____10056) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____10056
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2426__auto____10057 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10058 = cljs.core._add_method[goog.typeOf(x__2426__auto____10057)];
      if(or__3943__auto____10058) {
        return or__3943__auto____10058
      }else {
        var or__3943__auto____10059 = cljs.core._add_method["_"];
        if(or__3943__auto____10059) {
          return or__3943__auto____10059
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____10064 = mf;
    if(and__3941__auto____10064) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____10064
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2426__auto____10065 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10066 = cljs.core._remove_method[goog.typeOf(x__2426__auto____10065)];
      if(or__3943__auto____10066) {
        return or__3943__auto____10066
      }else {
        var or__3943__auto____10067 = cljs.core._remove_method["_"];
        if(or__3943__auto____10067) {
          return or__3943__auto____10067
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____10072 = mf;
    if(and__3941__auto____10072) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____10072
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2426__auto____10073 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10074 = cljs.core._prefer_method[goog.typeOf(x__2426__auto____10073)];
      if(or__3943__auto____10074) {
        return or__3943__auto____10074
      }else {
        var or__3943__auto____10075 = cljs.core._prefer_method["_"];
        if(or__3943__auto____10075) {
          return or__3943__auto____10075
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____10080 = mf;
    if(and__3941__auto____10080) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____10080
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2426__auto____10081 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10082 = cljs.core._get_method[goog.typeOf(x__2426__auto____10081)];
      if(or__3943__auto____10082) {
        return or__3943__auto____10082
      }else {
        var or__3943__auto____10083 = cljs.core._get_method["_"];
        if(or__3943__auto____10083) {
          return or__3943__auto____10083
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____10088 = mf;
    if(and__3941__auto____10088) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____10088
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2426__auto____10089 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10090 = cljs.core._methods[goog.typeOf(x__2426__auto____10089)];
      if(or__3943__auto____10090) {
        return or__3943__auto____10090
      }else {
        var or__3943__auto____10091 = cljs.core._methods["_"];
        if(or__3943__auto____10091) {
          return or__3943__auto____10091
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____10096 = mf;
    if(and__3941__auto____10096) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____10096
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2426__auto____10097 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10098 = cljs.core._prefers[goog.typeOf(x__2426__auto____10097)];
      if(or__3943__auto____10098) {
        return or__3943__auto____10098
      }else {
        var or__3943__auto____10099 = cljs.core._prefers["_"];
        if(or__3943__auto____10099) {
          return or__3943__auto____10099
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____10104 = mf;
    if(and__3941__auto____10104) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____10104
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2426__auto____10105 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____10106 = cljs.core._dispatch[goog.typeOf(x__2426__auto____10105)];
      if(or__3943__auto____10106) {
        return or__3943__auto____10106
      }else {
        var or__3943__auto____10107 = cljs.core._dispatch["_"];
        if(or__3943__auto____10107) {
          return or__3943__auto____10107
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10110 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10111 = cljs.core._get_method.call(null, mf, dispatch_val__10110);
  if(cljs.core.truth_(target_fn__10111)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10110)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10111, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10112 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10113 = this;
  cljs.core.swap_BANG_.call(null, this__10113.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10113.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10113.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10113.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10114 = this;
  cljs.core.swap_BANG_.call(null, this__10114.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10114.method_cache, this__10114.method_table, this__10114.cached_hierarchy, this__10114.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10115 = this;
  cljs.core.swap_BANG_.call(null, this__10115.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10115.method_cache, this__10115.method_table, this__10115.cached_hierarchy, this__10115.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10116 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10116.cached_hierarchy), cljs.core.deref.call(null, this__10116.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10116.method_cache, this__10116.method_table, this__10116.cached_hierarchy, this__10116.hierarchy)
  }
  var temp__4090__auto____10117 = cljs.core.deref.call(null, this__10116.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____10117)) {
    var target_fn__10118 = temp__4090__auto____10117;
    return target_fn__10118
  }else {
    var temp__4090__auto____10119 = cljs.core.find_and_cache_best_method.call(null, this__10116.name, dispatch_val, this__10116.hierarchy, this__10116.method_table, this__10116.prefer_table, this__10116.method_cache, this__10116.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____10119)) {
      var target_fn__10120 = temp__4090__auto____10119;
      return target_fn__10120
    }else {
      return cljs.core.deref.call(null, this__10116.method_table).call(null, this__10116.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10121 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10121.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10121.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10121.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10121.method_cache, this__10121.method_table, this__10121.cached_hierarchy, this__10121.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10122 = this;
  return cljs.core.deref.call(null, this__10122.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10123 = this;
  return cljs.core.deref.call(null, this__10123.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10124 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10124.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10126__delegate = function(_, args) {
    var self__10125 = this;
    return cljs.core._dispatch.call(null, self__10125, args)
  };
  var G__10126 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10126__delegate.call(this, _, args)
  };
  G__10126.cljs$lang$maxFixedArity = 1;
  G__10126.cljs$lang$applyTo = function(arglist__10127) {
    var _ = cljs.core.first(arglist__10127);
    var args = cljs.core.rest(arglist__10127);
    return G__10126__delegate(_, args)
  };
  G__10126.cljs$lang$arity$variadic = G__10126__delegate;
  return G__10126
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10128 = this;
  return cljs.core._dispatch.call(null, self__10128, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2372__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10129 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10131, _) {
  var this__10130 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10130.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10132 = this;
  var and__3941__auto____10133 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3941__auto____10133) {
    return this__10132.uuid === other.uuid
  }else {
    return and__3941__auto____10133
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10134 = this;
  var this__10135 = this;
  return cljs.core.pr_str.call(null, this__10135)
};
cljs.core.UUID;
goog.provide("inflationcalculator.inflationcalculator");
goog.require("cljs.core");
document.write("<p>Hello, world!</p>");
document.write(4 + 4);
inflationcalculator.inflationcalculator.cpis = cljs.core.PersistentArrayMap.fromArrays([2E3, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014], [172.2, 177.1, 179.9, 184, 188.9, 195.3, 201.6, 207.342, 215.303, 214.537, 218.056, 224.939, 229.594, 233.069, 233.069]);
inflationcalculator.inflationcalculator.discount = function() {
  var discount = null;
  var discount__3 = function(table, amount, target_year) {
    return discount.call(null, amount, (new Date).getFullYear(), target_year, table)
  };
  var discount__4 = function(table, amount, base_year, target_year) {
    return amount * (cljs.core._lookup.call(null, table, target_year, null) / cljs.core._lookup.call(null, table, base_year, null))
  };
  discount = function(table, amount, base_year, target_year) {
    switch(arguments.length) {
      case 3:
        return discount__3.call(this, table, amount, base_year);
      case 4:
        return discount__4.call(this, table, amount, base_year, target_year)
    }
    throw"Invalid arity: " + arguments.length;
  };
  discount.cljs$lang$arity$3 = discount__3;
  discount.cljs$lang$arity$4 = discount__4;
  return discount
}();
console.log(inflationcalculator.inflationcalculator.discount.call(null, inflationcalculator.inflationcalculator.cpis, 14, 2E3, 2011), inflationcalculator.inflationcalculator.discount.call(null, inflationcalculator.inflationcalculator.cpis, 14, 2E3), (new Date).getFullYear());
