/**
 * @param {string} byteStr: 4字节ABCD顺序的浮点数字节码（不能有空格）
 * @returns {number} floatNumber: 转换后的浮点数
 */
export function byteStr2Float(byteStr) {
	// 1. 定义四字节数据 (十六进制表示)
	const hexData = byteStr;
	// console.log("HexStr ---> " + hexData);
	// 2. 将十六进制字符串转换为字节数组
	const byteArray = [
		parseInt(hexData.slice(0, 2), 16),
		parseInt(hexData.slice(2, 4), 16),
		parseInt(hexData.slice(4, 6), 16),
		parseInt(hexData.slice(6, 8), 16)
	];

	// 3. 创建 ArrayBuffer 并将字节数据存入
	const buffer = new ArrayBuffer(4);
	const dataView = new DataView(buffer);
	byteArray.forEach((byte, index) => {
		dataView.setUint8(index, byte);
	});

	// 4. 读取 32 位浮点数（默认是大端模式，如果数据是小端模式，需要传入第二个参数 true）
	const floatNumber = dataView.getFloat32(0, false); // 大端模式
	// console.log(floatNumber); // 输出转换后的浮点数
	return floatNumber;
}

/**
 * @param {Object} byteStr: 4字节ABCD顺序的整型字节码（不能有空格）
 * @returns {number} intNumber: 转换后的整型数字
 */
export function byteStr2Int(byteStr) {
	// 1. 定义四字节数据 (十六进制表示)
	const hexData = byteStr;

	// 2. 将十六进制字符串转换为字节数组
	const byteArray = [
		parseInt(hexData.slice(0, 2), 16),
		parseInt(hexData.slice(2, 4), 16),
		parseInt(hexData.slice(4, 6), 16),
		parseInt(hexData.slice(6, 8), 16)
	];

	// 3. 创建 ArrayBuffer 并将字节数据存入
	const buffer = new ArrayBuffer(4);
	const dataView = new DataView(buffer);
	byteArray.forEach((byte, index) => {
		dataView.setUint8(index, byte);
	});

	// 4. 读取 32 位整数（默认是大端模式，如果数据是小端模式，需要传入第二个参数 true）
	const intNumber = dataView.getInt32(0, false); // 大端模式
	// console.log(intNumber); // 输出转换后的整数
	return intNumber;
}