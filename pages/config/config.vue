<template>
	<view class="container">
		<scroll-view scroll-y="true" class="config_container">
			<view>
				<view v-for="(config, index) in commonConfigure" :key="index">
					<view v-if="index === 0">
						<view class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="number" v-model="config.value" :disabled="!config.editable" class="config_value" @change="cycleChange"></uni-easyinput>
						</view>
						<text v-if="!cycleChecked" class="warning">collection cycle verification failed</text>
					</view>
					<view v-else-if="index === 1" class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-easyinput type="text" v-model="datetime" :disabled="!config.editable" class="config_value"></uni-easyinput>
						<label>
							<checkbox :checked="datetimeConfig" />
						</label>
					</view>
					<view v-else-if="index === 2">
						<view class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="number" v-model="config.value" :disabled="!config.editable" class="config_value" @change="deviceSNChange"></uni-easyinput>
						</view>
						<text v-if="!snChecked" class="warning">device SN verification failed</text>
					</view>
					<view v-else-if="index === 3" class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-data-select v-model="config.value" :localdata="config.range" :clear="false" :disabled="!config.editable" placeholder="Select"></uni-data-select>
					</view>
					<view v-else-if="index === 4">
						<view class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="text" :value="loraChannels" :disabled="!config.editable" class="config_value" @change="loraChannelsChange"></uni-easyinput>
						</view>
						<text v-if="!loraChannelsChecked" class="warning">channels verification failed</text>
					</view>
					<view v-else-if="index == 5">
						<view class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="number" v-model="config.value" :disabled="!config.editable" class="config_value" @change="fportChange"></uni-easyinput>
						</view>
						<text v-if="!fportChecked" class="warning">fport verification failed</text>
					</view>
					<view v-else-if="index === 6">
						<view class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="text" :value="devEUI" :disabled="!config.editable" class="config_value" @change="devEUIChange"></uni-easyinput>
						</view>
						<text v-if="!devEUIChecked" class="warning">devEUI verification failed</text>
					</view>
					<view v-else-if="index === 7">
						<view class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="text" :value="appKey" :disabled="!config.editable" class="config_value" @change="appKeyChange"></uni-easyinput>
						</view>
						<text v-if="!appKeyChecked" class="warning">appKey verification failed</text>
					</view>

				</view>
				<view v-if="devName.includes('DWL4')">
					<view v-for="(config,index) in dwl4Configure" :key="index">
						<view v-if="index === 0" class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-data-select v-model="config.value" :localdata="config.range" @change="channelChange" :clear="false" :disabled="!config.editable"></uni-data-select>
						</view>
						<view v-else class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="text" v-model="config.value" :disabled="!config.editable" class="config_value"></uni-easyinput>
						</view>
					</view>
				</view>
				<view v-else-if="devName.includes('TILT')">
					<view v-for="(config,index) in tiltConfigure" :key="index" class="config_cell">
						<view v-if="index === 0" class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-data-select v-model="config.value" :localdata="config.range" @change="channelChange" :clear="false" :disabled="!config.editable"></uni-data-select>
						</view>
						<view v-else class="config_cell">
							<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
							<uni-easyinput type="text" v-model="config.value" :disabled="!config.editable" class="config_value"></uni-easyinput>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
	<view class="sb_btn">
		<view class="btn_group">
			<button type="primary" :disabled="btnDisabled" @click="readConfigure">Read</button>
			<!-- <button type="primary" @click="commitConfigure">Submit</button> -->
			<button type="primary" :disabled="btnDisabled" @click="commitConfigure">Submit</button>
		</view>
	</view>
</template>

<script>
	import {
		byteStr2Int,
		int2ByteStr,
		calculateChannelMask,
		parseChannelMask,
		byteStr2Float,
		float2ByteStr
	} from "@/common/utils";
	import bleInfo from "@/common/common"
	import {
		getModbusCmdBuf,
		crcCheck
	} from "@/common/modbusRtu";
	export default {
		data() {
			return {
				cycleChecked: true,
				snChecked: true,
				datetimeConfig: false,
				loraChannelsChecked: true,
				fportChecked: true,
				devEUIChecked: true,
				appKeyChecked: true,
				commonConfigure: [{
						name: "Collection Cycle",
						value: 1,
						editable: true,
						unit: "min[1-1440]"
					},
					{
						name: "Date Time",
						date_value: "",
						time_value: "",
						editable: false,
						unit: ""
					},
					{
						name: "Device SN",
						value: 1,
						editable: true,
						unit: ""
					},
					{
						name: "Frequency Band",
						value: 84,
						range: [{
								value: 84,
								text: "RU864"
							},
							{
								value: 85,
								text: "IN865"
							},
							{
								value: 86,
								text: "EU868"
							}, {
								value: 90,
								text: "US915"
							}, {
								value: 91,
								text: "AU915"
							}, {
								value: 92,
								text: "KR920"
							}, {
								value: 93,
								text: "AS923-1"
							}, {
								value: 94,
								text: "AS923-2"
							}, {
								value: 95,
								text: "AS923-3"
							}, {
								value: 96,
								text: "AS923-4"
							}
						],
						editable: true,
						unit: ""
					},
					{
						name: "Channels",
						ch0_31_value: "",
						ch32_63_value: "",
						ch64_71_value: "",
						editable: true,
						unit: ""
					},
					{
						name: "fport",
						value: 1,
						editable: true,
						unit: ""
					},
					{
						name: "DEVEUI",
						value_h: "00000000",
						value_l: "00000000",
						editable: true,
						unit: ""
					},
					{
						name: "APPKEY",
						value_1: "5572404c",
						value_2: "696e6b4c",
						value_3: "6f526132",
						value_4: "30313823",
						editable: true,
						unit: ""
					}
				],
				dwl4Configure: [{
						name: "Channel Index",
						value: 1,
						range: [{
							value: 1,
							text: "Device Channel 1"
						}, {
							value: 2,
							text: "Device Channel 2"
						}, {
							value: 3,
							text: "Device Channel 3"
						}, {
							value: 4,
							text: "Device Channel 4"
						}],
						editable: true,
						unit: ""
					},
					{
						name: "Frequency Upper Limit",
						value: 0,
						editable: true,
						unit: "Hz"
					},
					{
						name: "Frequency Lower Limit",
						value: 0,
						editable: true,
						unit: "Hz"
					},
					{
						name: "Temperature Coefficient K",
						value: 0,
						editable: true,
						unit: ""
					},
					{
						name: "Temperature Coefficient B",
						value: 0,
						editable: true,
						unit: ""
					}
				],
				tiltConfigure: [{
						name: "Channel Index",
						value: 1,
						range: [{
							value: 1,
							text: "Device Channel 1"
						}],
						editable: false,
						unit: ""
					},
					{
						name: "X-axis Coefficient",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "Y-axis Coefficient",
						value: 100,
						editable: true,
						unit: ""
					},
					{
						name: "Z-axis Coefficient",
						value: 100,
						editable: true,
						unit: ""
					}
				]
			}
		},
		computed: {
			btnDisabled() {
				return !bleInfo.ble_connected;
			},
			datetime() {
				if (this.commonConfigure[1]) {
					return `20${this.commonConfigure[1].date_value} ${this.commonConfigure[1].time_value}`;
				} else {
					return "";
				}
			},
			loraChannels() {
				let channels = "";
				if (this.commonConfigure[4].ch0_31_value.length > 0) {
					channels += (this.commonConfigure[4].ch0_31_value + ',');
				}
				if (this.commonConfigure[4].ch32_63_value.length > 0) {
					channels += (this.commonConfigure[4].ch32_63_value + ',');
				}
				if (this.commonConfigure[4].ch64_71_value.length > 0) {
					channels += this.commonConfigure[4].ch64_71_value;
				}
				return channels;
			},
			devEUI() {
				return `${this.commonConfigure[6].value_h+this.commonConfigure[6].value_l}`;
			},
			appKey() {
				return `${this.commonConfigure[7].value_1+this.commonConfigure[7].value_2+this.commonConfigure[7].value_3+this.commonConfigure[7].value_4}`;
			},
			devName() {
				return bleInfo.ble_device ? bleInfo.ble_device.name : "";
			}
		},
		methods: {
			getCurrentTime() {
				let date = new Date();
				let hours = date.getHours().toString().padStart(2, '0');
				let minutes = date.getMinutes().toString().padStart(2, '0');
				let seconds = date.getSeconds().toString().padStart(2, '0');
				return `00${hours}${minutes}${seconds}`;
			},
			getCurrentDate() {
				let date = new Date();
				let year = date.getFullYear();
				let month = (date.getMonth() + 1).toString().padStart(2, '0');
				let day = date.getDate().toString().padStart(2, '0');
				return `00${year}${month}${day}`;
			},
			readCommonConfigure() {
				bleInfo.ble_recv_data = "";
				let cmdStr = "01 03 00 01 00 00 12";
				// console.log("读取通用设置: ", cmdStr);
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						// console.log("读取通用设置发送成功: " + res.errMsg);
						uni.$once("dataArrive", () => {
							if (bleInfo.ble_recv_data) {
								// console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									// console.log(data);
									for (let i = 0; i < data.length; i++) {
										switch (i) {
											case 0:
												this.commonConfigure[0].value = byteStr2Int(data[0]);
												break;
											case 2:
												this.commonConfigure[1].date_value = data[1].slice(-6).match(/.{1,2}/g).join('-');
												this.commonConfigure[1].time_value = data[2].slice(-6).match(/.{1,2}/g).join(':');
												break;
											case 3:
												this.commonConfigure[2].value = byteStr2Int(data[3]);
												break;
											case 7:
												this.commonConfigure[3].value = byteStr2Int(data[7]);
												break;
											case 10:
												const channels = parseChannelMask(data[8] + data[9] + data[10]);
												let ch0_31 = [];
												let ch32_63 = [];
												let ch64_71 = [];
												for (const channel of channels) {
													if (0 <= channel && channel <= 31) {
														ch0_31.push(channel);
													} else if (0 <= channel && channel <= 31) {
														ch32_63.push(channel);
													} else {
														ch64_71.push(channel);
													}
												}
												this.commonConfigure[4].ch0_31_value = ch0_31.join(',');
												this.commonConfigure[4].ch32_63_value = ch32_63.join(',');
												this.commonConfigure[4].ch64_71_value = ch64_71.join(',');
												break;
											case 11:
												this.commonConfigure[5].value = byteStr2Int(data[11]);
												break;
											case 13:
												this.commonConfigure[6].value_h = data[12];
												this.commonConfigure[6].value_l = data[13];
												break;
											case 17:
												this.commonConfigure[7].value_1 = data[14];
												this.commonConfigure[7].value_2 = data[15];
												this.commonConfigure[7].value_3 = data[16];
												this.commonConfigure[7].value_4 = data[17];
												break;
											default:
												break;
										}
									}
									uni.$emit("readCommonConfigOk");
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
							// console.log("通用设置: ", this.commonConfigure);
						});
						// setTimeout(() => {
						// 	if (bleInfo.ble_recv_data) {
						// 		console.log("ble info " + bleInfo.ble_recv_data);
						// 		if (crcCheck(bleInfo.ble_recv_data)) {
						// 			let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
						// 			console.log(data);
						// 			for (let i = 0; i < data.length; i++) {
						// 				switch (i) {
						// 					case 0:
						// 						this.commonConfigure[0].value = byteStr2Int(data[0]);
						// 						break;
						// 					case 2:
						// 						this.commonConfigure[1].date_value = data[1].slice(-6).match(/.{1,2}/g).join('-');
						// 						this.commonConfigure[1].time_value = data[2].slice(-6).match(/.{1,2}/g).join(':');
						// 						break;
						// 					case 3:
						// 						this.commonConfigure[2].value = byteStr2Int(data[3]);
						// 						break;
						// 					case 7:
						// 						this.commonConfigure[3].value = byteStr2Int(data[7]);
						// 						break;
						// 					case 10:
						// 						const channels = parseChannelMask(data[8] + data[9] + data[10]);
						// 						let ch0_31 = [];
						// 						let ch32_63 = [];
						// 						let ch64_71 = [];
						// 						for (const channel of channels) {
						// 							if (0 <= channel && channel <= 31) {
						// 								ch0_31.push(channel);
						// 							} else if (0 <= channel && channel <= 31) {
						// 								ch32_63.push(channel);
						// 							} else {
						// 								ch64_71.push(channel);
						// 							}
						// 						}
						// 						this.commonConfigure[4].ch0_31_value = ch0_31.join(',');
						// 						this.commonConfigure[4].ch32_63_value = ch32_63.join(',');
						// 						this.commonConfigure[4].ch64_71_value = ch64_71.join(',');
						// 						break;
						// 					case 11:
						// 						this.commonConfigure[5].value = byteStr2Int(data[11]);
						// 						break;
						// 					case 13:
						// 						this.commonConfigure[6].value_h = data[12];
						// 						this.commonConfigure[6].value_l = data[13];
						// 						break;
						// 					case 17:
						// 						this.commonConfigure[7].value_1 = data[14];
						// 						this.commonConfigure[7].value_2 = data[15];
						// 						this.commonConfigure[7].value_3 = data[16];
						// 						this.commonConfigure[7].value_4 = data[17];
						// 						break;
						// 					default:
						// 						break;
						// 				}
						// 			}
						// 		} else {
						// 			bleInfo.ble_recv_data = '';
						// 		}
						// 	}
						// 	console.log("通用设置: ", this.commonConfigure);
						// }, 2000);

					},
					fail: (err) => {
						console.error("读取通用设置失败: " + err.errMsg);
						uni.showToast({
							title: "read failed.",
							icon: "error",
							duration: 2000
						})
					}
				})
			},
			readSpecialConfigure() {
				bleInfo.ble_recv_data = "";
				let cmdStr = "";
				if (bleInfo.ble_device.name.includes("DWL4")) {
					cmdStr = `01 03 00 01 32 00 ${("00" + this.dwl4Configure[0].value.toString(16).toUpperCase()).slice(-2)}`;
				} else if (bleInfo.ble_device.name.includes("TILT")) {
					cmdStr = `01 03 00 01 32 00 ${("00" + this.tiltConfigure[0].value.toString(16).toUpperCase()).slice(-2)}`;
				}
				// console.log("读取特殊设置:", cmdStr);
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						// console.log("读取特殊设置发送成功: " + res.errMsg);
						uni.$once("dataArrive", () => {
							// console.log("设置页面收到数据");
							if (bleInfo.ble_recv_data) {
								// console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									// console.log(data);
									if (bleInfo.ble_device.name.includes("DWL4")) {
										for (let i = 0; i < data.length; i++) {
											this.dwl4Configure[i + 1].value = byteStr2Int(data[i]);
										}
									} else if (bleInfo.ble_device.name.includes("TILT")) {
										for (let i = 0; i < data.length; i++) {
											this.tiltConfigure[i + 1].value = byteStr2Float(data[i]);
										}
									}
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						});
						// setTimeout(() => {
						// 	if (bleInfo.ble_recv_data) {
						// 		console.log("ble info " + bleInfo.ble_recv_data);
						// 		if (crcCheck(bleInfo.ble_recv_data)) {
						// 			let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
						// 			console.log(data);
						// 			if (bleInfo.ble_device.name.includes("DWL4")) {
						// 				for (let i = 0; i < data.length; i++) {
						// 					this.dwl4Configure[i + 1].value = byteStr2Int(data[i]);
						// 				}
						// 			} else if (bleInfo.ble_device.name.includes("TILT")) {
						// 				for (let i = 0; i < data.length; i++) {
						// 					this.tiltConfigure[i + 1].value = byteStr2Int(data[i]);
						// 				}
						// 			}
						// 		} else {
						// 			bleInfo.ble_recv_data = '';
						// 		}
						// 	}
						// }, 2000);

					},
					fail: (err) => {
						console.error("读取特殊设置失败: " + err.errMsg);
						uni.showToast({
							title: "read failed.",
							icon: "error",
							duration: 2000
						})
					}
				});
			},
			readConfigure() {
				this.readCommonConfigure();
				uni.$once("readCommonConfigOk", () => {
					this.readSpecialConfigure();
				});
				// setTimeout(() => {
				// 	this.readSpecialConfigure();
				// }, 3000);
			},
			commitCommonConfigure() {
				bleInfo.ble_recv_data = "";
				let commonConfigData = [
					"0000001e",
					"00250116",
					"00072946",
					"0003a982",
					"00000001",
					"00000000",
					"00000000",
					"0000005d",
					"00000000",
					"00000000",
					"00000000",
					"00000032",
					"00000000",
					"00000000",
					"5572404c",
					"696e6b4c",
					"6f526132",
					"30313823"
				];
				let dataStr = "";
				if (this.cycleChecked && this.loraChannelsChecked && this.devEUIChecked && this.appKeyChecked && this.fportChecked) {
					for (let i = 0; i < commonConfigData.length; i++) {
						switch (i) {
							case 0:
								commonConfigData[0] = int2ByteStr(this.commonConfigure[0].value);
								break;
							case 2:
								if (this.datetimeConfig) {
									commonConfigData[1] = this.getCurrentDate();
									commonConfigData[2] = this.getCurrentTime();
								} else {
									commonConfigData[1] = "00000000";
									commonConfigData[2] = "00000000";
								}
								break;
							case 3:
								commonConfigData[3] = int2ByteStr(this.commonConfigure[2].value);
								break;
							case 7:
								commonConfigData[7] = int2ByteStr(this.commonConfigure[3].value);
								break;
							case 10:
								let channelsArray = [...this.commonConfigure[4].ch0_31_value.split(','), ...this.commonConfigure[4].ch32_63_value.split(','), ...this.commonConfigure[4].ch64_71_value.split(',')]
									.filter(item => item !== "")
									.map(Number);
								// console.log("channelsArray --->", channelsArray);
								const mask = calculateChannelMask(channelsArray);
								// console.log("mask --->", mask);
								commonConfigData[8] = mask.groupA_mask;
								commonConfigData[9] = mask.groupB_mask;
								commonConfigData[10] = mask.groupC_mask;
								break;
							case 11:
								commonConfigData[11] = int2ByteStr(this.commonConfigure[5].value);
								break;
							case 13:
								commonConfigData[12] = this.commonConfigure[6].value_h;
								commonConfigData[13] = this.commonConfigure[6].value_l;
								break;
							case 17:
								commonConfigData[14] = this.commonConfigure[7].value_1;
								commonConfigData[15] = this.commonConfigure[7].value_2;
								commonConfigData[16] = this.commonConfigure[7].value_3;
								commonConfigData[17] = this.commonConfigure[7].value_4;
								break;
							default:
								break;
						}
					}
					for (let data of commonConfigData) {
						dataStr += data;
					}
					let cmdStr = `01 15 00 01 00 ${commonConfigData.length.toString(16).padStart(4,'0')} ${dataStr}`;
					// console.log("设置值: ", this.commonConfigure, "下发通用设置:", cmdStr);
					let modbusCmd = getModbusCmdBuf(cmdStr);
					uni.writeBLECharacteristicValue({
						deviceId: bleInfo.ble_device.deviceId,
						serviceId: bleInfo.ble_service.uuid,
						characteristicId: bleInfo.ble_send_characteristic.uuid,
						value: modbusCmd,
						success: (res) => {
							// console.log("通用设置发送成功: " + res.errMsg);
							uni.$once("dataArrive", () => {
								if (bleInfo.ble_recv_data) {
									// console.log("ble info " + bleInfo.ble_recv_data);
									if (crcCheck(bleInfo.ble_recv_data)) {
										let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
										console.log("下发通用设置:", data);
										setTimeout(() => {
											uni.$emit("writeCommonConfigOk");
										}, 500);
									} else {
										bleInfo.ble_recv_data = '';
									}
								}
							});
							// setTimeout(() => {
							// 	if (bleInfo.ble_recv_data) {
							// 		console.log("ble info " + bleInfo.ble_recv_data);
							// 		if (crcCheck(bleInfo.ble_recv_data)) {
							// 			let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
							// 			console.log(data);
							// 		} else {
							// 			bleInfo.ble_recv_data = '';
							// 		}
							// 	}
							// }, 2000);

						},
						fail: (err) => {
							console.error("读取特殊设置失败: " + err.errMsg);
							uni.showToast({
								title: "read failed.",
								icon: "error",
								duration: 2000
							})
						}
					});
				} else {
					uni.showToast({
						title: "Incorrect parameters",
						icon: "error",
						duration: 2500
					})
				}
			},
			commitSpecialConfigure() {
				bleInfo.ble_recv_data = "";
				let cmdStr = "";
				if (bleInfo.ble_device.name.includes("DWL4")) {
					cmdStr =
						`01 15 00 01 32 00 05 ${Number(this.dwl4Configure[0].value).toString(16).padStart(8,'0')} ${Number(this.dwl4Configure[1].value).toString(16).padStart(8,'0')} ${Number(this.dwl4Configure[2].value).toString(16).padStart(8,'0')} ${Number(this.dwl4Configure[3].value).toString(16).padStart(8,'0')} ${Number(this.dwl4Configure[4].value).toString(16).padStart(8,'0')}`;
				} else if (bleInfo.ble_device.name.includes("TILT")) {
					cmdStr =
						`01 15 00 01 32 00 04 ${float2ByteStr(Number(this.tiltConfigure[0].value))} ${float2ByteStr(Number(this.tiltConfigure[1].value))} ${float2ByteStr(Number(this.tiltConfigure[2].value))} ${float2ByteStr(Number(this.tiltConfigure[3].value))}`;
				}
				// console.log("下发特殊设置: ", cmdStr);
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						// console.log("读取数据成功: " + res.errMsg);
						uni.$once("dataArrive", () => {
							if (bleInfo.ble_recv_data) {
								// console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									console.log("下发特殊设置", data);
									uni.showToast({
										title: "success."
									});
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						});
						// setTimeout(() => {
						// 	if (bleInfo.ble_recv_data) {
						// 		console.log("ble info " + bleInfo.ble_recv_data);
						// 		if (crcCheck(bleInfo.ble_recv_data)) {
						// 			let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
						// 			console.log(data);
						// 			uni.showToast({
						// 				title: "success."
						// 			});
						// 		} else {
						// 			bleInfo.ble_recv_data = '';
						// 		}
						// 	}
						// }, 3000);
					},
					fail: (err) => {
						console.error("读取设置失败: " + err.errMsg);
					}
				});
			},
			commitConfigure() {
				this.commitCommonConfigure();
				uni.$once("writeCommonConfigOk", () => {
					this.commitSpecialConfigure();
				});
				// setTimeout(() => {
				// 	this.commitSpecialConfigure();
				// }, 3000);
			},
			loraChannelsChange(content) {
				if (content) {
					if (content.endsWith(',')) {
						content = content.slice(0, -1);
					}
					let channels = content.split(',');
					let ch0_31 = [];
					let ch32_63 = [];
					let ch64_71 = [];
					for (let element of channels) {
						let channel = parseInt(element);
						this.loraChannelsChecked = true;
						if (this.commonConfigure[3].value == 90 || this.commonConfigure[3].value == 91) {
							if (channel > 71 || channel < 0) {
								this.loraChannelsChecked = false;
								return;
							}
						} else {
							if (channel > 31 || channel < 0) {
								this.loraChannelsChecked = false;
								return;
							}
						}
						if (0 <= channel && channel <= 31) {
							ch0_31.push(channel);
						} else if (32 <= channel && channel <= 63) {
							ch32_63.push(channel);
						} else {
							ch64_71.push(channel);
						}
					}
					this.commonConfigure[4].ch0_31_value = ch0_31.join(',');
					this.commonConfigure[4].ch32_63_value = ch32_63.join(',');
					this.commonConfigure[4].ch64_71_value = ch64_71.join(',');
				} else {
					this.commonConfigure[4].ch0_31_value = "";
					this.commonConfigure[4].ch32_63_value = "";
					this.commonConfigure[4].ch64_71_value = "";
				}
			},
			cycleChange(content) {
				this.cycleChecked = true;
				if (content.length < 1) {
					this.cycleChecked = false;
					return;
				}
				if (content < 1 || content > 1440) {
					this.cycleChecked = false;
					return;
				}
			},
			deviceSNChange(content) {
				this.snChecked = true;
				if (content < 0 || content > 999999) {
					this.snChecked = false;
				}
			},
			fportChange(content) {
				this.fportChecked = true;
				if (content < 0 || content > 221) {
					this.fportChecked = false;
				}
			},
			channelChange() {
				this.readSpecialConfigure();
			},
			devEUIChange(content) {
				const hexRegex = /^[0-9a-fA-F]+$/;
				this.devEUIChecked = true;
				if (content.length != 16) {
					this.devEUIChecked = false;
					return;
				}
				if (!hexRegex.test(content)) {
					this.devEUIChecked = false;
					return;
				}
				this.commonConfigure[6].value_h = content.slice(0, 8);
				this.commonConfigure[6].value_l = content.slice(8, 16);
			},
			appKeyChange(content) {
				const hexRegex = /^[0-9a-fA-F]+$/;
				this.appKeyChecked = true;
				if (content.length != 32) {
					this.appKeyChecked = false;
				}
				if (!hexRegex.test(content)) {
					this.appKeyChecked = false;
					return;
				}
				this.commonConfigure[7].value_1 = content.slice(0, 8);
				this.commonConfigure[7].value_2 = content.slice(8, 16);
				this.commonConfigure[7].value_3 = content.slice(16, 24);
				this.commonConfigure[7].value_4 = content.slice(24, 32);
			}
		},
		mounted() {

		},
		onShow() {

		}
	}
</script>

<style>
	.container {
		margin: 10px;
		font-size: 14px;
		line-height: 24px;
	}

	.config_container {
		height: 88vh;
	}

	.config_cell {
		display: flex;
		flex-direction: row;
		border: 1px solid lightgray;
		margin: 12px 0;
		align-items: center;
	}

	.config_label {
		display: flex;
		width: 150px;
		font-size: 18px;
	}

	.config_value {
		font-size: 18px;
	}

	.btn_group {
		display: flex;
	}

	.sb_btn {
		position: fixed;
		left: 0;
		bottom: 0;
		width: 100%;
	}

	.warning {
		font-size: 12px;
		color: red;
	}

	button {
		width: 100%;
	}
</style>