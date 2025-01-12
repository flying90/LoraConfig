const isType = type => (/^\[object\s(.*)\]$/.exec(Object.prototype.toString.call(type)))[1];
export const isArray = function(a) {
	return isType(a) == 'Array';
}; // 注意首字母大写
export const isSymbol = function(a) {
	return isType(a) == 'Symbol';
};
export const isBoolean = function(a) {
	return isType() == 'Boolean';
};

export const isNumber = function(a) {
	return isType(a) == 'Number';
};
export const isUndefined = function(a) {
	return isType(a) == 'Undefined';
};
export const isNull = function(a) {
	return isType(a) == 'Null';
};
export const isObject = function(a) {
	return isType(a) == 'Object';
};
export const isString = function(a) {
	return isType(a) == 'String';
};
export const isFunction = function(a) {
	return isType(a) == 'Function';
};
export const isDate = function(a) {
	return isType(a) == 'Date';
};
export const isRegExp = function(a) {
	return isType(a) == 'RegExp';
};

// module.exports = {
// 	isType: isType,
// 	isArray: isArray,
// 	isSymbol: isSymbol,
// 	isBoolean: isBoolean,
// 	isString: isString,
// 	isNumber: isNumber,
// 	isUndefined: isUndefined,
// 	isNull: isNull,
// 	isObject: isObject,
// 	isFunction: isFunction,
// 	isDate: isDate,
// 	isRegExp:isRegExp
// }
