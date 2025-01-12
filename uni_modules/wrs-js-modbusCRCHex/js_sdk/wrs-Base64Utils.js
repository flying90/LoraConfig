
export function encodeBase64(str) {
	// let base64 = btoa(str)
	// return base64
	return new Buffer(str).toString('base64');
}

export function decodeBase64(str) {
 //   let originStr = atob(base64)  // 解码后的字符串
	// return originStr
	return Buffer(str, 'base64').toString();
}

// https://blog.csdn.net/qq_42961150/article/details/121922216
//编码
// new Buffer(String, 'base64').toString('hex');
// //解码
// new Buffer(base64Str, 'hex').toString('utf8');
