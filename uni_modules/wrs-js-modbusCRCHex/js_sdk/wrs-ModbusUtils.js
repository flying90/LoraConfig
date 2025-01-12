// import {
// 	getCRC
// } from './CRCUtils.js'

// var CRCUtils = require('./wrs-CRCUtils.js');
import * as CRCUtils from './wrs-CRCUtils.js';
import * as IntUtils from './wrs-IntUtils.js';
/**
 * 读指令
 * @param address 设备地址, int
 * @param address 寄存器起始地址, int
 * @param count 寄存器个数, int
 * @return byte[]
 */
export function getReadModbus(address, start, count) {
	return getReadModbusCRCLowFront(address, start, count, true);
}

export function getReadModbusCRCLowFront(address, start, count, crcLowFront) {
	var registerObj = IntUtils.intToHighLow(start)
	var registerLow = registerObj.low; // int
	var registerHigh = registerObj.high; // int
	var countLow = count & 0xFF; // int
	var countHigh = count >>> 8; // int
	var data = [registerHigh, registerLow, countHigh, countLow]; // int[]
	var sendData = getModbusDataCRCLowFront(address, 0x03, data, crcLowFront); // byte[]
	return sendData;
}


/**
 * 写指令
 * @param address 设备地址 int
 * @param start 寄存器起始地址 int
 * @param writeData 寄存器个数 int[]
 * @return byte[]
 */
export function getWriteModbus(address, start, writeData) {
	return getWriteModbusCRCLowFront(address, start, writeData, true);
}

export function getWriteModbusCRCLowFront(address, start, writeData, crcLowFront) {
	var registerObj = IntUtils.intToHighLow(start)
	var registerLow = registerObj.low; // int
	var registerHigh = registerObj.high; // int
	var data = []; // int[]
	data.push(registerHigh);
	data.push(registerLow)
	for (var i = 0; i < writeData.length; i++) {
		data.push(writeData[i]);
	}
	var sendData = getModbusDataCRCLowFront(address, 0x06, data, crcLowFront);
	return sendData;
}

// public static List<Byte> isValidModbusResponseData(List<Byte> list) {
//     if (null != list && list.size() >= 4) {
//         int size = list.size();
//         int leng = ByteUtils.byteToInt(list.get(2));
//         int totalSize = leng + 5;
//         if (size < totalSize) {
//             return null;
//         }
//         List tempList = list.subList(0, totalSize - 2);
//         byte[] tempData = ArrayUtils.listTobyte(tempList);
//         int crc = CRCUtils.getCRC(tempData);
//         int low = crc & 0xFF;
//         int high = crc >>> 8;
//         byte lowData = list.get(totalSize - 2);
//         byte hightData = list.get(totalSize - 1);
//         if (low == ByteUtils.byteToInt(lowData) && high == ByteUtils.byteToInt(hightData)) {
//             return list.subList(0, totalSize);
//         } else {
//             return null;
//         }
//     } else {
//         return null;
//     }
// }

/**
 * 
 * @param address 设备地址 int
 * @param fun 功能值 int
 * @param data 数据 int[]
 * @return byte[]
 */
export function getModbusData(address, fun, data) {
	return getModbusDataCRCLowFront(address, fun, data, true);
}

/**
 * 
 * @param address 设备地址 int
 * @param fun 功能值 int
 * @param data 数据 int[]
 * @param crcLowFront CRC是否低位在前
 * @return byte[]
 */
export function getModbusDataCRCLowFront(address, fun, data,crcLowFront) {
	var leng = 2;
	if (data) {
		leng += data.length;
	}
	var tempData = []; // byte[]
	tempData.push(address);
	tempData.push(fun);
	if (data) {
		for (var i = 0; i < data.length; i++) {
			tempData.push(data[i]);
		}
	}
	var crc = CRCUtils.getCRC16_MODBUS(tempData); // int
	var crcObj = IntUtils.intToHighLow(crc)
	var low = crcObj.low; // int
	var high = crcObj.high; // int
	if(crcLowFront) {
		tempData.push(low);
		tempData.push(high);
	} else {
		tempData.push(high);
		tempData.push(low);
	}

	return tempData;
}

// module.exports = {
// 	getReadModbus: getReadModbus,
// 	getWriteModbus: getWriteModbus,
// 	getModbusData: getModbusData
// }
