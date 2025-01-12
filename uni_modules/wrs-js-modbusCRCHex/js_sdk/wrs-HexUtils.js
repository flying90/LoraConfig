const HEX_CHAR_TABLE =  ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

 export function intToByte(intValue){
        var byteValue = intValue & 0xff;
        return byteValue;
 }

 export function byteToInt(byteValue){
    var intValue = byteValue & 0xff;
    return intValue;
}
 
 export function intArrayToHex(intArray) {
	 var byteArray = []
	 for(var i = 0; i < intArray.length; i ++) {
		 byteArray.push(intToByte(intArray[i]));
	 }
	 return byteArrayToHex(byteArray);
 }
 
 export function byteArrayToHex(byteArray) {
	 // 方法1:
 	 var hex = ""
 	 for(var i = 0; i < byteArray.length; i ++) {
		 var byteValue = byteArray[i];
		 hex = hex + HEX_CHAR_TABLE[(byteValue & 0xf0) >> 4];
		 hex = hex + HEX_CHAR_TABLE[byteValue & 0x0f]; 
 	 }
	 return hex;
	
 }
 
 export function hexToIntArray(hex) {
	  var len = hex.length/2;
	  var intArray = [];
	  for(var i = 0; i< len; i ++) {
		  var start = i * 2;
		  var hexStr = hex.substring(start, start + 2);
		   var intValue = parseInt(hexStr,16);
		   intArray.push(intValue);
	  }
	  return intArray;
 }
 
 export function hexToByteArray(hex) {
	 var len = hex.length;
	 var intArray = hexToIntArray(hex);
	 var byteArray = [];
	 for(var i = 0; i < intArray.length; i ++) {
		 var intValue = intArray[i];
		 var byteValue = intToByte(intValue);
		 byteArray.push(byteValue);
	 }
	 return byteArray;
 }
 
 export function intToHex(intValue) {
	 return intValue.toString(16);
 }
 
 /**
  * 16进制字符串转ArrayBuffer
  * @param {*} hex String
  */
 export function hexToArrayBuffer(hex) {
   var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
     return parseInt(h, 16)
   }));
   var buffer = typedArray.buffer;
   return buffer;
 }
 
 /**
  * ArrayButter转16进制字符串
  * @param {*} buffer ArrayBuffer
  */
 export function arrayBufferToHex(buffer) { // buffer is an ArrayBuffer
   return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
 }
 
 export function hexToUint8Array(hex) {
   var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
     return parseInt(h, 16)
   }));
   return typedArray;
 }
 
 export function uint8ArrayToHex(uint8Array) {
   return Array.prototype.map
           .call(uint8Array, (x) => ('00' + x.toString(16)).slice(-2))
           .join('');
 }
 
 // module.exports = {
 //   intArrayToHex: intArrayToHex,
 //   byteArrayToHex: byteArrayToHex,
 //   intToHex: intToHex,
 //   hexToIntArray: hexToIntArray,
 //   hexToByteArray: hexToByteArray,
 //   hexToArrayBuffer: hexToArrayBuffer,
 //   arrayBufferToHex: arrayBufferToHex
 // }