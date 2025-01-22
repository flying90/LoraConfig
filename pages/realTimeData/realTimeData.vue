<template>
	<view class="container">
		<scroll-view scroll-y="true" class="data_container">
			<view>
				<view class="data_cell">
					<text class="time_label">Read Time: </text>
					<text class="read_time">{{readTime}} </text>
				</view>
				<view class="data_cell" v-for="(comChannel, comIndex) in commonChannels" :key="comIndex">
					<text class="data_label">{{comChannel.channel_name}}:</text>
					<text class="data_value">{{comChannel.value}}</text>
					<text class="data_unit">{{comChannel.unit}}</text>
				</view>
				<view class="data_cell" v-if="deviceName.includes('DWL4')" v-for="(dwl4Channel, dwl4Index) in dwl4Channels" :key="dwl4Index+9">
					<text class="data_label">{{dwl4Channel.channel_name}}: </text>
					<text class="data_value">{{dwl4Channel.value}} </text>
					<text class="data_unit">{{dwl4Channel.unit}}</text>
				</view>
				<view class="data_cell" v-else-if="deviceName.includes('TILT')" v-for="(tiltChannel, tiltIndex) in tiltChannels" :key="tiltIndex+9">
					<text class="data_label">{{tiltChannel.channel_name}}: </text>
					<text class="data_value">{{tiltChannel.value}} </text>
					<text class="data_unit">{{tiltChannel.unit}}</text>
				</view>
			</view>
		</scroll-view>
		<view class="read_btn">
			<button type="primary" :disabled="readBtnStatus" @click="readRealtimeData">Read</button>
		</view>
	</view>
</template>

<script>
	import bleInfo from "@/common/common"
	import {
		getModbusCmdBuf,
		crcCheck
	} from "@/common/modbusRtu"
	import {
		byteStr2Int,
		byteStr2Float
	} from "@/common/utils"
	export default {
		data() {
			return {
				readTime: "",
				commonChannels: [{
						channel_name: "Cache Count",
						value: 0,
						unit: ""
					},
					{
						channel_name: "Device Model",
						value: "",
						unit: ""
					},
					{
						channel_name: "Device SN",
						value: 0,
						unit: ""
					},
					{
						channel_name: "Battery Voltage",
						value: 0.0,
						unit: " V"
					},
					{
						channel_name: "Onboard Temperature",
						value: 0,
						unit: " ℃"
					},
					{
						channel_name: "Onboard Humidity",
						value: 0,
						unit: " %"
					},
					{
						channel_name: "Barometric Pressure",
						value: 0,
						unit: " hPa"
					},
					{
						channel_name: "Lora Network Status",
						value: "Not Joined",
						unit: ""
					},
					{
						channel_name: "Lora Signal Strength",
						value: 0,
						unit: " dBm"
					}
				],
				dwl4Channels: [{
						channel_name: "Frequency of CH1",
						value: 0,
						unit: "Hz"
					},
					{
						channel_name: "Temperature of CH1",
						value: 0,
						unit: "℃"
					},
					{
						channel_name: "Frequency of CH2",
						value: 0,
						unit: "Hz"
					},
					{
						channel_name: "Temperature of CH2",
						value: 0,
						unit: "℃"
					},
					{
						channel_name: "Frequency of CH3",
						value: 0,
						unit: "Hz"
					},
					{
						channel_name: "Temperature of CH3",
						value: 0,
						unit: "℃"
					},
					{
						channel_name: "Frequency of CH4",
						value: 0,
						unit: "Hz"
					},
					{
						channel_name: "Temperature of CH4",
						value: 0,
						unit: "℃"
					},
				],
				tiltChannels: [{
						channel_name: "Temperature",
						value: 0,
						unit: "℃"
					},
					{
						channel_name: "X-axis reading",
						value: 0,
						unit: "°"
					},
					{
						channel_name: "Y-axis reading",
						value: 0,
						unit: "°"
					},
					{
						channel_name: "Z-axis reading",
						value: 0,
						unit: "°"
					},
				]
			}
		},
		computed: {
			readBtnStatus() {
				return !bleInfo.ble_connected;
			},
			deviceName() {
				return bleInfo.ble_device ? bleInfo.ble_device.name : "";
			}
		},
		methods: {
			getDatetime() {
				let date = new Date();
				let year = date.getFullYear();
				let month = (date.getMonth() + 1).toString().padStart(2, '0');
				let day = date.getDate().toString().padStart(2, '0');
				let hours = date.getHours().toString().padStart(2, '0');
				let minutes = date.getMinutes().toString().padStart(2, '0');
				let seconds = date.getSeconds().toString().padStart(2, '0');
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			},
			readRealtimeData() {
				bleInfo.ble_recv_data = ""
				let cmdStr = "01 03 00 00 00 00 15";
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
									//0103 54 000001c3 0000000a 0003a982 00000144 45cccc00 4479f99a 45cccc00 4479f99a 45cccc00 4479f99a 45cccc00 4479f99a
									//41c9c4c4 42024aa6 446430d8 41f00000 3f99999a 00000000 00000000 00000000 c2340000 6610
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									// console.log(data);
									uni.showToast({
										title: "success."
									});
									this.readTime = this.getDatetime();
									if (bleInfo.ble_device.name.includes("DWL4")) {
										for (let i = 0; i < data.length; i++) {
											switch (i) {
												case 0:
													this.commonChannels[0].value = byteStr2Int(data[0]);
													break;
												case 1:
													switch (byteStr2Int(data[i])) {
														case 10:
															this.commonChannels[i].value = "DWL4";
															break;
														case 11:
															this.commonChannels[i].value = "TILT";
															break;
														default:
															break;
													}
													break;
												case 2:
													this.commonChannels[2].value = byteStr2Int(data[2]);
													break;
												case 3:
													this.commonChannels[3].value = byteStr2Int(data[3]) / 100;
													break;
												case 4:
													this.dwl4Channels[0].value = byteStr2Float(data[4]).toFixed(1);
													break;
												case 5:
													this.dwl4Channels[1].value = byteStr2Float(data[5]).toFixed(1);
													break;
												case 6:
													this.dwl4Channels[2].value = byteStr2Float(data[6]).toFixed(1);
													break;
												case 7:
													this.dwl4Channels[3].value = byteStr2Float(data[7]).toFixed(1);
													break;
												case 8:
													this.dwl4Channels[4].value = byteStr2Float(data[8]).toFixed(1);
													break;
												case 9:
													this.dwl4Channels[5].value = byteStr2Float(data[9]).toFixed(1);
													break;
												case 10:
													this.dwl4Channels[6].value = byteStr2Float(data[10]).toFixed(1);
													break;
												case 11:
													this.dwl4Channels[7].value = byteStr2Float(data[11]).toFixed(1);
													break;
												case 12:
													this.commonChannels[4].value = byteStr2Float(data[12]).toFixed(1);
													break;
												case 13:
													this.commonChannels[5].value = byteStr2Float(data[13]).toFixed(1);
													break;
												case 14:
													this.commonChannels[6].value = byteStr2Float(data[14]).toFixed(1);
													break;
												case 19:
													this.commonChannels[7].value = (byteStr2Float(data[19]).toFixed(0) == 1) ? "Joined" : "Not Joined";
													break;
												case 20:
													this.commonChannels[8].value = byteStr2Float(data[20]).toFixed(1);
													break;
												default:
													// 默认处理
													break;
											}
										}
									} else if (bleInfo.ble_device.name.includes("TILT")) {
										for (let i = 0; i < data.length; i++) {
											switch (i) {
												case 0:
													this.commonChannels[0].value = byteStr2Int(data[0]);
													break;
												case 1:
													switch (byteStr2Int(data[i])) {
														case 10:
															this.commonChannels[i].value = "DWL4";
															break;
														case 11:
															this.commonChannels[i].value = "TILT";
															break;
														default:
															break;
													}
													break;
												case 2:
													this.commonChannels[2].value = byteStr2Int(data[2]);
													break;
												case 3:
													this.commonChannels[3].value = byteStr2Int(data[3]) / 100;
													break;
												case 4:
													this.tiltChannels[0].value = byteStr2Float(data[4]).toFixed(1);
													break;
												case 5:
													this.tiltChannels[1].value = byteStr2Float(data[5]).toFixed(4);
													break;
												case 6:
													this.tiltChannels[2].value = byteStr2Float(data[6]).toFixed(4);
													break;
												case 7:
													this.tiltChannels[3].value = byteStr2Float(data[7]).toFixed(4);
													break;
												case 12:
													this.commonChannels[4].value = byteStr2Float(data[12]).toFixed(1);
													break;
												case 13:
													this.commonChannels[5].value = byteStr2Float(data[13]).toFixed(1);
													break;
												case 14:
													this.commonChannels[6].value = byteStr2Float(data[14]).toFixed(1);
													break;
												case 19:
													this.commonChannels[7].value = (byteStr2Float(data[19]).toFixed(0) == 1) ? "Joined" : "Not Joined";
													break;
												case 20:
													this.commonChannels[8].value = byteStr2Float(data[20]).toFixed(1);
													break;
												default:
													// 默认处理
													break;
											}
										}
									} else {
										bleInfo.ble_recv_data = '';
									}
								}
							}
						});
					},
					fail: (err) => {
						console.error("读取设置失败: " + err.errMsg);
					}
				});
			}
		}
	}
</script>

<style>
	.container {
		padding: 16px;
		font-size: 14px;
		line-height: 24px;
	}

	.data_container {
		height: 88vh;
	}

	.data_cell {
		/* height: 35px;
		border: 1px solid lightgrey;
		margin: 8px 0; */
		display: flex;
		flex-direction: row;
		border: 1px solid lightgray;
		margin: 8px 0;
		align-items: center;
	}

	.data_label {
		display: inline-block;
		font-size: 18px;
		width: 215px;
	}

	.data_value {
		font-size: 20px;
	}

	.data_unit {
		font-size: 18px;
		padding-left: 5px;
	}

	.time_label {
		display: inline-block;
		font-size: 18px;
		margin-right: 20px;
	}

	.read_time {
		font-size: 16px;
	}

	.read_btn {
		width: 100%;
		position: fixed;
		left: 0;
		bottom: 0;
	}
</style>