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
						<uni-data-select v-model="config.value" :localdata="config.range" @change="bandChange" :clear="false"></uni-data-select>
					</view>
					<view v-else-if="index === 4" class="config_cell">
						<text class="config_label">{{config.name}}{{config.unit?`\n(${config.unit})`: ""}}: </text>
						<uni-easyinput type="text" v-model="loraChannels" :disabled="!config.editable" class="config_value"></uni-easyinput>
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
				<br />
			</view>
		</scroll-view>
	</view>
	<view class="sb_btn">
		<view class="btn_group">
			<button type="primary" :disabled="btnDisabled" @click="readConfigure">Read</button>
			<button type="primary" :disabled="btnDisabled" @click="commitConfigure">Submit</button>
		</view>
	</view>
</template>

<script>
	import {
		byteStr2Int,
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
				commonConfigure: [{
						"name": "Collection Cycle",
						"value": 30,
						"editable": true,
						"unit": "min[1-1440]"
					},
					{
						"name": "Date Time",
						"date_value": "25-01-15",
						"time_value": "08:50:55",
						"editable": false,
						"unit": ""
					},
					{
						"name": "Device SN",
						"value": 240002,
						"editable": true,
						"unit": ""
					},
					{
						"name": "Frequency Band",
						"value": 93,
						"range": [{
								"value": 84,
								"text": "RU864"
							},
							{
								"value": 85,
								"text": "IN865"
							},
							{
								"value": 86,
								"text": "EU868"
							},
							{
								"value": 90,
								"text": "US915"
							},
							{
								"value": 91,
								"text": "AU915"
							},
							{
								"value": 92,
								"text": "KR920"
							},
							{
								"value": 93,
								"text": "AS923-1"
							},
							{
								"value": 94,
								"text": "AS923-2"
							},
							{
								"value": 95,
								"text": "AS923-3"
							},
							{
								"value": 96,
								"text": "AS923-4"
							}
						],
						"editable": false,
						"unit": ""
					},
					{
						"name": "Channels",
						"ch0_31_value": [5, 8, 15],
						"ch32_63_value": [40, 50, 34],
						"ch64_71_value": [65],
						"editable": true,
						"unit": ""
					},
					{
						"name": "fport",
						"value": 50,
						"editable": true,
						"unit": ""
					},
					{
						"name": "DEVEUI",
						"value_h": "00000000",
						"value_l": "00000000",
						"editable": true,
						"unit": ""
					},
					{
						"name": "APPKEY",
						"value_1": "5572404c",
						"value_2": "696e6b4c",
						"value_3": "6f526132",
						"value_4": "30313823",
						"editable": true,
						"unit": ""
					}
				],
				// [{
				// 		name: "Collection Cycle",
				// 		value: 1,
				// 		editable: true,
				// 		unit: "min[1-1440]"
				// 	},
				// 	{
				// 		name: "Date Time",
				// 		date_value: "",
				// 		time_value: "",
				// 		editable: false,
				// 		unit: ""
				// 	},
				// 	{
				// 		name: "Device SN",
				// 		value: 1,
				// 		editable: true,
				// 		unit: ""
				// 	},
				// 	//- 84 RU864
				// 	// - 85 IN865
				// 	// - 86 EU868
				// 	// - 90 US915
				// 	// - 91 AU915
				// 	// - 92 KR920
				// 	// - 93 AS923-1
				// 	// - 94 AS923-2
				// 	// - 95 AS923-3
				// 	// - 96 AS923-4
				// 	{
				// 		name: "Frequency Band",
				// 		value: 0,
				// 		range: [{
				// 				value: 84,
				// 				text: "RU864"
				// 			},
				// 			{
				// 				value: 85,
				// 				text: "IN865"
				// 			},
				// 			{
				// 				value: 86,
				// 				text: "EU868"
				// 			}, {
				// 				value: 90,
				// 				text: "US915"
				// 			}, {
				// 				value: 91,
				// 				text: "AU915"
				// 			}, {
				// 				value: 92,
				// 				text: "KR920"
				// 			}, {
				// 				value: 93,
				// 				text: "AS923-1"
				// 			}, {
				// 				value: 94,
				// 				text: "AS923-2"
				// 			}, {
				// 				value: 95,
				// 				text: "AS923-3"
				// 			}, {
				// 				value: 96,
				// 				text: "AS923-4"
				// 			}
				// 		],
				// 		editable: false,
				// 		unit: ""
				// 	},
				// 	{
				// 		name: "Channels",
				// 		ch0_31_value: "",
				// 		ch32_63_value: "",
				// 		ch64_71_value: "",
				// 		editable: true,
				// 		unit: ""
				// 	},
				// 	{
				// 		name: "fport",
				// 		value: 1,
				// 		editable: true,
				// 		unit: ""
				// 	},
				// 	{
				// 		name: "DEVEUI",
				// 		value_h: "",
				// 		value_l: "",
				// 		editable: true,
				// 		unit: ""
				// 	},
				// 	{
				// 		name: "APPKEY",
				// 		value_1: "",
				// 		value_2: "",
				// 		value_3: "",
				// 		value_4: "",
				// 		editable: true,
				// 		unit: ""
				// 	}
				// ],
				dwl4Configure: [{
						name: "Channel Index",
						value: [1, 2, 3, 4],
						editable: false,
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
						value: [1],
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
				return `${this.commonConfigure[4].ch0_31_value.join(",")+','+this.commonConfigure[4].ch32_63_value.join(",")+','+this.commonConfigure[4].ch64_71_value.join(",")}`;
			},
			devEUI(){
				return `${this.commonConfigure[6].value_h+this.commonConfigure[6].value_l}`;
			},
			appKey(){
				return `${this.commonConfigure[7].value_1+this.commonConfigure[7].value_2+this.commonConfigure[7].value_3+this.commonConfigure[7].value_4}`;
			}
		},
		methods: {
			getCurrentTime() {
				let date = new Date()
				let year = date.getFullYear()
				let month = (date.getMonth() + 1).toString().padStart(2, '0')
				let day = date.getDay().toString().padStart(2, '0')
				let hours = date.getHours().toString().padStart(2, '0')
				let minutes = date.getMinutes().toString().padStart(2, '0')
				let seconds = date.getSeconds().toString().padStart(2, '0')
				this.commonConfigure[0].value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
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
						}, 3000);

					},
					fail: (err) => {
						console.error("读取通用设置失败: " + err.errMsg);
					}
				})
			},
			readSpecialConfigure(channelIndex) {
				bleInfo.ble_recv_data = "";
				let cmdStr = `01 03 00 01 32 00 ${("00" + channelIndex.toString(16).toUpperCase()).slice(-2)}`;
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
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						}, 3000);

					},
					fail: (err) => {
						console.error("读取特殊设置失败: " + err.errMsg);
					}
				})
			},
			readConfigure() {
				this.readCommonConfigure();
			},
			commitConfigure() {
				bleInfo.ble_recv_data = ""
				let cmdStr = "01 03 00 01 32 00 01";
				// let cmdStr = "01 15 00 01 32 00 05 00000001 00001771 00000192 00000003 00000f78";
				let modbusCmd = getModbusCmdBuf(cmdStr);
				uni.writeBLECharacteristicValue({
					deviceId: bleInfo.ble_device.deviceId,
					serviceId: bleInfo.ble_service.uuid,
					characteristicId: bleInfo.ble_send_characteristic.uuid,
					value: modbusCmd,
					success: (res) => {
						console.log("读取数据成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									// 0103 48 0000001e 00250113 00173754 0003a982 00000001 00000000 00000000 0000005d 00000000 00000000 00000000 
									// 00000032 00000000 00000000 5572404c 696e6b4c 6f526132 30313823 TILT5e
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									console.log(data);
									// if (bleInfo.ble_device.name.includes("DWL4")) {
									// 	for (let i = 0; i < data.length; i++) {
									// 		if (i < 4) {
									// 			if (i === 3) {
									// 				this.commonChannels[i].value = byteStr2Int(data[i]) / 100;
									// 			} else {
									// 				this.commonChannels[i].value = byteStr2Int(data[i]);
									// 			}
									// 		} else if (i < 12) {
									// 			this.dwl4Channels[i - 4].value = byteStr2Float(data[i]).toFixed(1);
									// 		} else if (i < 14) {
									// 			this.commonChannels[i - 8].value = byteStr2Float(data[i]).toFixed(1);
									// 		} else if (i > 18) {
									// 			if (i === 19) {
									// 				this.commonChannels[i - 12].value = (byteStr2Float(data[i]).toFixed(0) == 1) ? "Joined" : "Not Joined";
									// 			} else {
									// 				this.commonChannels[i - 12].value = byteStr2Float(data[i]).toFixed(1);
									// 			}
									// 		}
									// 	}
									// } else if (bleInfo.ble_device.name.includes("TILT")) {

									// }
									uni.showToast({
										title: "success."
									});
								} else {
									bleInfo.ble_recv_data = '';
								}
							}
						}, 3000);

					},
					fail: (err) => {
						console.error("读取设置失败: " + err.errMsg);
					}
				})
			},
			bandChange() {
				console.log("选择Band", this.commonConfigure[3]);
			}
		},
		mounted() {}
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

	button {
		width: 100%;
	}
</style>