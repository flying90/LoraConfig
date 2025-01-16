<template>
	<view class="container">
		<scroll-view scroll-y="true" class="config_container">
			<view>
				<view v-for="(config, index) in commonConfigure" :key="index">
					<view v-if="index === 1" class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-easyinput type="text" v-model="datetime" :disabled="!config.editable" class="config_value"></uni-easyinput>
						<label>
							<checkbox :checked="datetimeConfig" />
						</label>
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
					<view v-else-if="index === 6" class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-easyinput type="text" v-model="devEUI" :disabled="!config.editable" class="config_value"></uni-easyinput>
					</view>
					<view v-else-if="index === 7" class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-easyinput type="text" v-model="appKey" :disabled="!config.editable" class="config_value"></uni-easyinput>
					</view>
					<view v-else class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-easyinput type="text" v-model="config.value" :disabled="!config.editable" class="config_value"></uni-easyinput>
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
			<button type="primary" @click="commitConfigure">Submit</button>
			<!-- 			<button type="primary" :disabled="btnDisabled" @click="commitConfigure">Submit</button> -->
		</view>
	</view>
</template>

<script>
	import {
		byteStr2Int,
		int2ByteStr,
		chMaskEncode,
		chMaskDecode
	} from "@/common/utils";
	import bleInfo from "@/common/common"
	import {
		getModbusCmdBuf,
		crcCheck
	} from "@/common/modbusRtu";
	export default {
		data() {
			return {
				datetimeConfig: false,
				loraChannelsChecked: true,
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
						value_h: "",
						value_l: "",
						editable: true,
						unit: ""
					},
					{
						name: "APPKEY",
						value_1: "",
						value_2: "",
						value_3: "",
						value_4: "",
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
				return `20${this.commonConfigure[1].date_value} ${this.commonConfigure[1].time_value}`;
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
			devEUI: {
				get() {
					return `${this.commonConfigure[6].value_h+this.commonConfigure[6].value_l}`;
				},
				set(newValue) {
					let value = newValue.padStart(16, '0');
					this.commonConfigure[6].value_h = value.slice(0, 8);
					this.commonConfigure[6].value_l = value.slice(8, 16);
				}
			},
			appKey: {
				get() {
					return `${this.commonConfigure[7].value_1+this.commonConfigure[7].value_2+this.commonConfigure[7].value_3+this.commonConfigure[7].value_4}`;
				},
				set(newValue) {
					let value = newValue.padStart(32, '0');
					this.commonConfigure[7].value_1 = value.slice(0, 8);
					this.commonConfigure[7].value_2 = value.slice(8, 16);
					this.commonConfigure[7].value_3 = value.slice(16, 24);
					this.commonConfigure[7].value_4 = value.slice(24, 32);
				}

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
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						console.log("读取通用设置发送成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									console.log(data);
									for (let i = 0; i < data.length; i++) {
										if (i === 1) {
											this.commonConfigure[i].date_value = data[i].slice(-6).match(/.{1,2}/g).join('-');
										} else if (i === 2) {
											this.commonConfigure[i - 1].time_value = data[i].slice(-6).match(/.{1,2}/g).join(':');
										} else if (i === 3) {
											this.commonConfigure[i - 1].value = byteStr2Int(data[i]);
										} else if (i === 4 || i === 5 || i === 6) {

										} else if (i === 7) {
											this.commonConfigure[i - 4].value = byteStr2Int(data[i]);
										} else if (i === 8) {
											this.commonConfigure[i - 4].ch0_31_value = chMaskDecode(byteStr2Int(data[i]));
										} else if (i === 9) {
											this.commonConfigure[i - 5].ch32_63_value = chMaskDecode(byteStr2Int(data[i]));
										} else if (i === 10) {
											this.commonConfigure[i - 6].ch64_71_value = chMaskDecode(byteStr2Int(data[i]));
										} else if (i === 11) {
											this.commonConfigure[i - 6].value = byteStr2Int(data[i]);
										} else if (i === 12) {
											this.commonConfigure[i - 6].value_h = data[i];
										} else if (i === 13) {
											this.commonConfigure[i - 7].value_l = data[i];
										} else if (i === 14) {
											this.commonConfigure[i - 7].value_1 = data[i];
										} else if (i === 15) {
											this.commonConfigure[i - 8].value_2 = data[i];
										} else if (i === 16) {
											this.commonConfigure[i - 9].value_3 = data[i];
										} else if (i === 17) {
											this.commonConfigure[i - 10].value_4 = data[i];
										} else {
											this.commonConfigure[i].value = byteStr2Int(data[i]);
										}
									}
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
							console.log("通用设置: ", this.commonConfigure);
						}, 2000);

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
				console.log(cmdStr);
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						console.log("读取特殊设置发送成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									console.log(data);
									if (bleInfo.ble_device.name.includes("DWL4")) {
										for (let i = 0; i < data.length; i++) {
											this.dwl4Configure[i + 1].value = byteStr2Int(data[i]);
										}
									} else if (bleInfo.ble_device.name.includes("TILT")) {
										for (let i = 0; i < data.length; i++) {
											this.tiltConfigure[i + 1].value = byteStr2Int(data[i]);
										}
									}
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						}, 2000);

					},
					fail: (err) => {
						console.error("读取特殊设置失败: " + err.errMsg);
						uni.showToast({
							title: "read failed.",
							icon: "error",
							duration: 2000
						})
					}
				})
			},
			readConfigure() {
				this.readCommonConfigure();
				setTimeout(() => {
					this.readSpecialConfigure();
				}, 3000);
			},
			commitConfigure() {
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
							let channelsArray = [...this.commonConfigure[4].ch0_31_value.split(','), ...this.commonConfigure[4].ch32_63_value.split(','), ...this.commonConfigure[4].ch64_71_value.split(
								',')];
							let mask = chMaskEncode(channelsArray)
							console.log(mask);
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
				let cmdStr = `01 15 00 01 00 ${this.commonConfigure.length.toString(16).padStart(4,'0')} ${commonConfigData}`;
				console.log(cmdStr);

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
							if (channel > 71) {
								this.loraChannelsChecked = false;
							}
						} else {
							if (channel > 31) {
								this.loraChannelsChecked = false;
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
				}
			},
			channelChange() {
				this.readSpecialConfigure();
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