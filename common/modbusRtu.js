import * as CRCUtils from "@/uni_modules/wrs-js-modbusCRCHex/js_sdk/wrs-CRCUtils.js"
import * as HexUtils from "@/uni_modules/wrs-js-modbusCRCHex/js_sdk/wrs-HexUtils.js"


/**
 * @param {String} hexString:需要检验的16进制字符串
 * @returns {Number} CRC Result:计算的CRC数据（低字节在前）
 */
export function getModbusCrc(hexString) {
	let hexStr = hexString.replace(/\s+/g, "");
	let hexArr = HexUtils.hexToByteArray(hexStr);
	let crc = CRCUtils.getCRC16_MODBUS(hexArr);
	return ((crc << 8) & 0xFF00) | (crc >> 8);
}

/**
 * @param {String} hexString:待校验的十六进制数据字符串
 * @returns {Boolean} check reult:CRC校验结果
 */
export function crcCheck(hexString) {
	let hexStr = hexString.replace(/\s+/g, "");
	let hexArr = HexUtils.hexToByteArray(hexStr);
	let checkData = hexArr.slice(0, hexArr.length - 2);
	let dataCrc = (hexArr[hexArr.length - 2] << 8) | hexArr[hexArr.length - 1];
	let calcCrc = CRCUtils.getCRC16_MODBUS(checkData);
	calcCrc = ((calcCrc << 8) & 0xFF00) | (calcCrc >> 8);
	if (dataCrc == calcCrc) {
		return true;
	} else {
		return false;
	}
}

/**
 * @param {String} hexString:需要计算CRC校验的modbus指令16进制字符串
 * @returns {ArrayBuffer} modbus cmd buffer:带有CRC校验的二进制buffer
 */
export function getModbusCmdBuf(hexString) {
	let hexStr = hexString.replace(/\s+/g, "");
	let hexArr = HexUtils.hexToByteArray(hexStr);
	let crc = CRCUtils.getCRC16_MODBUS(hexArr);
	const cmdbuffer = new ArrayBuffer(hexArr.length + 2);
	const dataView = new DataView(cmdbuffer);
	hexArr.forEach((byte, index) => {
		dataView.setInt8(index, byte);
	});
	dataView.setInt8(hexArr.length, crc & 0xFF);
	dataView.setInt8(hexArr.length + 1, crc >> 8);
	return cmdbuffer;
}