/**
 * 将二进制数据转换为十六进制字符串
 * @param {buffer} buffer:二进制数据
 * @returns {hexstring} hexstring:十六进制字符串
 */
export function ab2hex(buffer) {
	const hexArr = Array.prototype.map.call(
		new Uint8Array(buffer),
		function(bit) {
			return ('00' + bit.toString(16)).slice(-2)
		}
	)
	return hexArr.join('')
}

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

/**
 * @param {number} intNumber: 待转换十进制整型数字
 * @returns {string} byteStr: 4字节ABCD顺序的整型字节码
 */
export function int2ByteStr(intNumber) {
	return ("00000000" + intNumber.toString(16)).slice(-8);
}

/**
 * @param {number} floatNumber: 待转换的浮点数
 * @returns {string} byteStr: 4字节ABCD顺序的浮点数字节码
 */
export function float2ByteStr(floatNumber) {
	// 创建一个4字节的缓冲区
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);

	// 将浮点数写入缓冲区（32位浮点数，大端模式）
	view.setFloat32(0, floatNumber, false); // false表示大端模式

	// 将缓冲区转换为字节数组
	const bytes = [];
	for (let i = 0; i < 4; i++) {
		bytes.push(view.getUint8(i).toString(16).padStart(2, '0').toUpperCase());
	}

	return bytes.join(''); // 输出字节字符串格式
}

/**
 * 根据输入的通道号计算通道掩码
 * @param {channelIndexArray} 要打开通道编号的数组
 * @returns {chmaskArr} 三组通道掩码
 */
// export function chMaskEncode(channelArray) {
// 	let ch0_7_mask = 0b0000_0000;
// 	let ch8_15_mask = 0b0000_0000;
// 	let ch16_23_mask = 0b0000_0000;
// 	let ch24_31_mask = 0b0000_0000;
// 	let ch32_39_mask = 0b0000_0000;
// 	let ch40_47_mask = 0b0000_0000;
// 	let ch48_55_mask = 0b0000_0000;
// 	let ch56_63_mask = 0b0000_0000;
// 	let ch64_71_mask = 0b0000_0000;

// 	for (const channel of channelArray) {
// 		const ch = Number(channel) - 1; // 转为 0 基索引

// 		if (0 <= ch && ch <= 7) {
// 			ch0_7_mask |= 1 << ch;
// 		} else if (8 <= ch && ch <= 15) {
// 			ch8_15_mask |= 1 << (ch - 8);
// 		} else if (16 <= ch && ch <= 23) {
// 			ch16_23_mask |= 1 << (ch - 16);
// 		} else if (24 <= ch && ch <= 31) {
// 			ch24_31_mask |= 1 << (ch - 24);
// 		} else if (32 <= ch && ch <= 39) {
// 			ch32_39_mask |= 1 << (ch - 32);
// 		} else if (40 <= ch && ch <= 47) {
// 			ch40_47_mask |= 1 << (ch - 40);
// 		} else if (48 <= ch && ch <= 55) {
// 			ch48_55_mask |= 1 << (ch - 48);
// 		} else if (56 <= ch && ch <= 63) {
// 			ch56_63_mask |= 1 << (ch - 56);
// 		} else if (64 <= ch && ch <= 71) {
// 			ch64_71_mask |= 1 << (ch - 64);
// 		}
// 	}
// 	let groupA_mask = ch0_7_mask | (ch8_15_mask << 8) | (ch16_23_mask << 16) | (ch24_31_mask << 24);
// 	let groupB_mask = ch32_39_mask | (ch40_47_mask << 8) | (ch48_55_mask << 16) | (ch56_63_mask << 24);
// 	let groupC_mask = ch64_71_mask;
// 	groupA_mask = groupA_mask.toString(16).padStart(8, '0');
// 	groupB_mask = groupB_mask.toString(16).padStart(8, '0');
// 	groupC_mask = groupC_mask.toString(16).padStart(8, '0');
// 	return {
// 		groupA_mask,
// 		groupB_mask,
// 		groupC_mask
// 	};
// }


/**
 * 根据需要启用的频道编号计算 LoRaWAN 频道掩码
 * @param {number[]} channels - 要启用的频道编号数组 (0-71)
 * @returns {string} - 计算出的频道掩码 (16 字节的十六进制字符串)
 */
export function calculateChannelMask(channels) {
    // 初始化 16 字节的掩码，每个字节用 0 表示
    const mask = new Array(16).fill(0);

    channels.forEach(channel => {
        if (channel < 0 || channel > 71) {
            throw new Error(`频道编号 ${channel} 超出范围 (0-71)`);
        }

        // 计算频道所在字节索引和位位置
        const byteIndex = Math.floor(channel / 8);
        const bitPosition = channel % 8;

        // 设置对应字节的指定位为 1
        mask[byteIndex] |= (1 << bitPosition);
    });

    // 将掩码数组转换为十六进制字符串
    return mask.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}



/**
 * 根据通道掩码计算出打开的通道编号
 * @param {string} chmask:通道掩码十六进制字符串
 * @returns {string} 打开通道编号的数组
 */
// export function chMaskDecode(chmask) {
// 	let chmaskNum = parseInt(chmask);
// 	let maskBinStr = chmaskNum.toString(2).split("").reverse().join("");
// 	const channelIndexArray = [];
// 	for (let i = 0; i < maskBinStr.length; i++) {
// 		if (maskBinStr[i] === '1') {
// 			channelIndexArray.push(i + 1);
// 		}
// 	}
// 	return channelIndexArray.join(',');
// }

/**
 * 根据频道掩码解析启用的频道编号
 * @param {string} channelMask - 16 字节的频道掩码 (16 个字节的十六进制字符串)
 * @returns {number[]} - 启用的频道编号数组
 */
export function parseChannelMask(channelMask) {
    // 去除空白符并验证输入
    channelMask = channelMask.trim().toUpperCase();
    if (channelMask.length !== 32 || !/^[0-9A-F]{32}$/.test(channelMask)) {
        throw new Error("无效的频道掩码，必须是 32 个十六进制字符");
    }

    // 将掩码按字节转换为数组 (小端序解析)
    const maskBytes = [];
    for (let i = 0; i < channelMask.length; i += 2) {
        maskBytes.push(parseInt(channelMask.slice(i, i + 2), 16));
    }

    const enabledChannels = [];
    // 遍历每个字节
    maskBytes.forEach((byte, byteIndex) => {
        // 检查每个位是否为 1
        for (let bitPosition = 0; bitPosition < 8; bitPosition++) {
            if (byte & (1 << bitPosition)) {
                enabledChannels.push(byteIndex * 8 + bitPosition);
            }
        }
    });

    // 返回启用的频道编号数组
    return enabledChannels;
}


