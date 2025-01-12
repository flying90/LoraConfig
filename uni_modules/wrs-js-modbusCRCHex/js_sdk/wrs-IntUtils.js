export function intToHex(intValue) {
	return intValue.toString(16);
}


export function highLowToInt(obj) {
	var value = ((obj.high & 0xFF) << 8) | (obj.low & 0xFF);
	return value;
}


export function intToHighLow(intValue) {
	var low = intValue & 0xFF;
	var high = (intValue & 0xFFFF) >>> 8;
	return {
		low: low,
		high: high
	}
}

    /**
     * 大端序 字节数组转int
     *
     * @param bytes
     * @return
     */
export function bigEndianToInt(bytes) {
	var byte0 = bytes[3] & 0XFF;
	var byte1 = (bytes[2] & 0XFF) << 8;
	var byte2 = (bytes[1] & 0XFF) << 16;
	var byte3 = (bytes[0] & 0XFF) << 24;
	var value = byte0 | byte1 | byte2 | byte3;
        return value;
}

 /**
     * 小端序 字节数组转int
     *
     * @param bytes
     * @return
     */
export function littleEndianToInt(bytes) {
        return (bytes[0]&0XFF)
                | ((bytes[1]&0XFF) << 8)
                | ((bytes[2]&0XFF) << 16)
                | ((bytes[3]&0XFF) << 24);
    }
  

// 大端序 int转字节数组
export function bigEndianToByteArray(i) {
	var byte1 = i & 0XFF;
	var byte2 = (i & 0XFFFF) >>> 8;
	var byte3 = (i & 0XFFFFFF) >>> 16;
	var byte4 = (i & 0XFFFFFFFF) >>> 24;
	var byteArray = [];
	byteArray.push(byte1);
	byteArray.push(byte2);
	byteArray.push(byte3);
	byteArray.push(byte4);
	return byteArray;
}

/**
 * 小端序 int转字节数组
 *
 * @param i
 * @return
 */
export function littleEndianToByteArray(i) {
	var byte1 = i & 0XFF;
	var byte2 = (i & 0XFF << 8) >> 8;
	var byte3 = (i & 0XFF << 16) >> 16;
	var byte4 = (i & 0XFF << 24) >> 24;
	var byteArray = []
	byteArray.push(byte1)
	byteArray.push(byte2)
	byteArray.push(byte3)
	byteArray.push(byte4)
	return byteArray;
}


export function bitToInt(bitStr) {
      return  parseInt(bitStr, 2)
 }

export function intToBit(by){
    //    var bit0 = (by>>7) & 0x1;
	   // var bit1 = (by>>6) & 0x1;
	   // var bit2 = (by>>5) & 0x1;
	   // var bit3 = (by>>4) & 0x1;
	   // var bit4 = (by>>3) & 0x1;
	   // var bit5 = (by>>2) & 0x1;
	   // var bit6 = (by>>1) & 0x1;
	   // var bit7 = (by>>1) & 0x1;
	   // return "" + bit0 + bit1 + bit2 + bit3 + bit4 + bit5 + bit6 + bit7; 
	  // return by.toString(2)
	  var value = by.toString(2)
	  if(value.length < 8) {
	  		 var count = 8 - value.length
	  		 for(var i = 0; i < count; i ++) {
	  			 value = "0" + value
	  		 }
	  }
	   return value
}


// module.exports = {
// intToHex: intToHex,
//   highLowToInt: highLowToInt,
//   intToHighLow: intToHighLow
// }