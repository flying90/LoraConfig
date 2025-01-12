import * as HexUtils from './wrs-HexUtils.js';

export function encodeUtf8(str) {
	// 方法1:
	// const utf8 = [];
	// for (let ii = 0; ii < str.length; ii++) {
	// 	let charCode = str.charCodeAt(ii);
	// 	if (charCode < 0x80){ 
	// 		utf8.push(charCode);
	// 	} else if (charCode < 0x800) {
	// 		utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
	// 	} else if (charCode < 0xd800 || charCode >= 0xe000) {
	// 		utf8.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
	// 	} else {
	// 		ii++;
	// 		// Surrogate pair:
	// 		// UTF-16 encodes 0x10000-0x10FFFF by subtracting 0x10000 and
	// 		// splitting the 20 bits of 0x0-0xFFFFF into two halves
	// 		charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(ii) & 0x3ff));
	// 		utf8.push(
	// 			0xf0 | (charCode >> 18),
	// 			0x80 | ((charCode >> 12) & 0x3f),
	// 			0x80 | ((charCode >> 6) & 0x3f),
	// 			0x80 | (charCode & 0x3f),
	// 		);
	// 	}
	// }
	// return utf8;
	// 方法2:
	// var bytes = []
	// for (let ii = 0; ii < str.length; ii++) {
	//   // for...of循环，能正确识别 32 位的 UTF-16 字符， 可以查阅资料了解。
	//   	let code = str.charCodeAt(ii);
	//   // let code = ch.codePointAt(0)
	//   if (code >= 65536 && code <= 1114111) {// 位运算， 补齐8位
	//     bytes.push((code >> 18) | 0xf0)
	//     bytes.push(((code >> 12) & 0x3f) | 0x80)
	//     bytes.push(((code >> 6) & 0x3f) | 0x80)
	//     bytes.push((code & 0x3f) | 0x80)
	//   } else if (code >= 2048 && code <= 65535) {
	//     bytes.push((code >> 12) | 0xe0)
	//     bytes.push(((code >> 6) & 0x3f) | 0x80)
	//     bytes.push((code & 0x3f) | 0x80)
	//   } else if (code >= 128 && code <= 2047) {
	//     bytes.push((code >> 6) | 0xc0)
	//     bytes.push((code & 0x3f) | 0x80)
	//   } else {
	//     bytes.push(code)
	//   }
	// }
	// return bytes

	// 方法3,android不支持TextEncoder
	// let encoder = new TextEncoder();
	// let utf8 = encoder.encode(str);  // UTF-8编码后的二进制数据

	// return utf8
	const encoded = encodeURIComponent(str);
	const charCodes = [];
	let i = 0;
	while (encoded[i]) {
		if (encoded[i] === '%') {
			const substr = encoded.slice(i, i + 3);
			charCodes.push(parseInt(substr.slice(-2), 16));
			i += 3;
		} else {
			charCodes.push(encoded[i].charCodeAt(0));
			i++;
		}
	}
	return charCodes
	// return Uint8Array.from(charCodes).buffer;
}
export function decodeUtf8(str) {


	let arr = HexUtils.hexToUint8Array(str);

	const REPL_CHAR = 0xFFFD;
	const hex = x => x.toString(16).padStart(2, '0');
	const xs = Array.from(arr);
	const res = [];
	let i = 0;
	while (i < xs.length && i < 3 && xs[i] && (xs[i] & 0xC0) === 0x80) {
		res.push(REPL_CHAR); // replacement for continuation byte
		i++;
	}
	if (i >= xs.length) return String.fromCodePoint(...res);
	if (!(
			((xs[i] & 0x80) === 0) || // 1 byte
			((xs[i] & 0xE0) === 0xC0) || // 2 byte
			((xs[i] & 0xF0) === 0xE0) || // 3 byte
			((xs[i] & 0xF8) === 0xF0) // 4 byte
		)) {
		throw new Error(`invalid utf-8. Expected a leading byte at index ${i} actual ${hex(xs[i])}`);
	}
	for (; i < xs.length; i++) {
		const x = xs[i];
		if ((x & 0x80) === 0) {
			// 1 byte
			res.push(x);
			continue;
		}
		if ((x & 0xE0) === 0xC0) {
			// 2 byte
			if (i + 1 >= xs.length) {
				res.push(REPL_CHAR); // replacement for 1st byte, 2nd byte is past end of string
				break;
			}
			const x1 = xs[i + 1];
			if ((x1 & 0xC0) !== 0x80) {
				throw new Error(`invalid utf-8. Expected a continuation byte at index ${i + 1} actual ${hex(x1)}`);
			}
			const c = ((x & 0x1F) << 6) | (x1 & 0x3F);
			if (c < 0x80 || c >= 0x800) {
				throw new Error(`invalid utf-8. Expected an integer between 0x80 and 0x800 at index ${i} actual ${c}`);
			}
			res.push(c);
			i++;
			continue;
		}
		if ((x & 0xF0) === 0xE0) {
			// 3 byte
			if (i + 2 >= xs.length) {
				res.push(REPL_CHAR); // replacement for 1st byte
				if (i + 1 < xs.length) res.push(REPL_CHAR); // replacement for 2nd byte, 3rd byte is past end of string
				break;
			}
			const x1 = xs[i + 1];
			if ((x1 & 0xC0) !== 0x80) {
				throw new Error(`invalid utf-8. Expected a continuation byte at index ${i + 1} actual ${hex(x1)}`);
			}
			const x2 = xs[i + 2];
			if ((x2 & 0xC0) !== 0x80) {
				throw new Error(`invalid utf-8. Expected a continuation byte at index ${i + 2} actual ${hex(x2)}`);
			}
			const c = ((x & 0x0F) << 12) | ((x1 & 0x3F) << 6) | (x2 & 0x3F);
			if (c < 0x800 || c >= 0x10000) {
				throw new Error(
					`invalid utf-8. Expected an integer between 0x800 and 0x10000 at index ${i} actual ${c}`);
			}
			res.push(c);
			i += 2;
			continue;
		}
		if ((x & 0xF8) === 0xF0) {
			// 4 byte
			if (i + 3 >= xs.length) {
				res.push(REPL_CHAR); // replacement for 1st byte
				if (i + 1 < xs.length) res.push(REPL_CHAR); // replacement for 2nd byte
				if (i + 2 < xs.length) res.push(REPL_CHAR); // replacement for 3rd byte, 4th byte is past end of string
				break;
			}
			const x1 = xs[i + 1];
			if ((x1 & 0xC0) !== 0x80) {
				throw new Error(`invalid utf-8. Expected a continuation byte at index ${i + 1} actual ${hex(x1)}`);
			}
			const x2 = xs[i + 2];
			if ((x2 & 0xC0) !== 0x80) {
				throw new Error(`invalid utf-8. Expected a continuation byte at index ${i + 2} actual ${hex(x2)}`);
			}
			const x3 = xs[i + 3];
			if ((x3 & 0xC0) !== 0x80) {
				throw new Error(`invalid utf-8. Expected a continuation byte at index ${i + 3} actual ${hex(x3)}`);
			}
			const c = ((x & 0x07) << 18) | ((x1 & 0x3F) << 12) | ((x2 & 0x3F) << 6) | (x3 & 0x3F);
			if (c < 0x10000) {
				throw new Error(`invalid utf-8. Expected an integer above 0x10000 at index ${i} actual ${c}`);
			}
			res.push(c);
			i += 3;
			continue;
		}
		throw new Error(`invalid utf-8. Expected a leading byte at index ${i} actual ${hex(x)}`);
	}
	return String.fromCodePoint(...res);


	// const u8 = new Uint8Array(buffer);
	// const oneByteChars = String.fromCharCode(...u8);
	// return btoa(oneByteChars);

	// let uint8Array = HexUtils.hexToUint8Array(str);
	// let decoder = new TextDecoder();
	// let result = decoder.decode(uint8Array); // 解码后的字符串
	// return result

	// let strValue = ''
	// let obStr = [...str].map((ch) => {
	// 	return padStart(parseInt(ch, 16).toString(2), 4, 0)
	// }).join('').match(/\d{8}/g).map((item) => parseInt(item, 2))
	// for (var i = 0; i < obStr.length;) {

	// 	let code = obStr[i]
	// 	let code1, code2, code3, code4, hex
	// 	if ((code & 240) == 240) {
	// 		code1 = (code & 0x03).toString(2)
	// 		code2 = padStart((obStr[i + 1] & 0x3f).toString(2), 6, '0')
	// 		code3 = padStart((obStr[i + 2] & 0x3f).toString(2), 6, '0')
	// 		code4 = padStart((obStr[i + 3] & 0x3f).toString(2), 6, '0')
	// 		hex = parseInt((code1 + code2 + code3 + code4), 2)
	// 		strValue = strValue + String.fromCodePoint(hex)
	// 		i = i + 4
	// 	} else if ((code & 224) == 224) {
	// 		code1 = (code & 0x07).toString(2)
	// 		code2 = padStart((obStr[i + 1] & 0x3f).toString(2), 6, '0')
	// 		code3 = padStart((obStr[i + 2] & 0x3f).toString(2), 6, '0')
	// 		hex = parseInt((code1 + code2 + code3), 2)
	// 		strValue = strValue + String.fromCodePoint(hex)
	// 		i = i + 3
	// 	} else if ((code & 192) == 192) {
	// 		code1 = (code & 0x0f).toString(2)
	// 		code2 = padStart((obStr[i + 1] & 0x3f).toString(2), 6, '0')
	// 		hex = parseInt((obStr + code2), 2)
	// 		strValue = strValue + String.fromCodePoint(hex)
	// 		i = i + 2
	// 	} else {
	// 		hex = code
	// 		strValue = strValue + String.fromCodePoint(code)
	// 		i = i + 1
	// 	}
	// }
	// return strValue
}
// module.exports = {
// 	encodeUtf8: encodeUtf8,
// 	decodeUtf8: decodeUtf8
// }


function padStart(str, len, prefix) {
	return ((new Array(len + 1).join(prefix)) + str).slice(-len) //  也可用 new Array(len+1).fill(0)
}