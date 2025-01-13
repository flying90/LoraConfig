<template>
	<view class="container">
		<view class="data_container">
			<scroll-view scroll-y="true">
				<view>
					<view class="data_show" v-for="(comChannel, comIndex) in commonChannels" :key="comIndex">
						<text style="display: inline-block; font-size: 18px; width: 220px;">{{comChannel.channel_name}}: </text>
						<text style="font-size: 20px;">{{comChannel.value}} </text>
						<text style="font-size: 18px;">{{comChannel.unit}}</text>
					</view>
					<view class="data_show" v-if="deviceName.includes('DWL4')" v-for="(dwl4Channel, dwl4Index) in dwl4Channels" :key="dwl4Index+9">
						<text style="display: inline-block; font-size: 18px; width: 220px;">{{dwl4Channel.channel_name}}: </text>
						<text style="font-size: 20px;">{{dwl4Channel.value}} </text>
						<text style="font-size: 18px;">{{dwl4Channel.unit}}</text>
					</view>
					<view class="data_show" v-else-if="deviceName.includes('FD')" v-for="(fdChannel, fdIndex) in fdChannels" :key="fdIndex+9">
						<text style="display: inline-block; font-size: 18px; width: 220px;">{{channel.channel_name}}: </text>
						<text style="font-size: 20px;">{{channel.value}} </text>
						<text style="font-size: 18px;">{{channel.unit}}</text>
					</view>
				</view>
			</scroll-view>
		</view>
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
				commonChannels: [{
						channel_name: "Number Of Cache",
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
						unit: " Hz"
					},
					{
						channel_name: "Temperature of CH1",
						value: 0,
						unit: " ℃"
					},
					{
						channel_name: "Frequency of CH2",
						value: 0,
						unit: " Hz"
					},
					{
						channel_name: "Temperature of CH2",
						value: 0,
						unit: " ℃"
					},
					{
						channel_name: "Frequency of CH3",
						value: 0,
						unit: " Hz"
					},
					{
						channel_name: "Temperature of CH3",
						value: 0,
						unit: " ℃"
					},
					{
						channel_name: "Frequency of CH4",
						value: 0,
						unit: " Hz"
					},
					{
						channel_name: "Temperature of CH4",
						value: 0,
						unit: " ℃"
					},
				],
				fdChannels: [{
						channel_name: "X-axis reading",
						value: 0,
						unit: " °"
					},
					{
						channel_name: "Y-axis reading",
						value: 0,
						unit: " °"
					},
					{
						channel_name: "Z-axis reading",
						value: 0,
						unit: " °"
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
						console.log("读取数据成功: " + res.errMsg);
						setTimeout(() => {
							if (bleInfo.ble_recv_data) {
								// console.log("ble info " + bleInfo.ble_recv_data);
								if (crcCheck(bleInfo.ble_recv_data)) {
									//0103 54 000001c3 0000000a 0003a982 00000144 45cccc00 4479f99a 45cccc00 4479f99a 45cccc00 4479f99a 45cccc00 4479f99a
									//41c9c4c4 42024aa6 446430d8 41f00000 3f99999a 00000000 00000000 00000000 c2340000 6610
									let data = bleInfo.ble_recv_data.slice(6, bleInfo.ble_recv_data.length - 4).match(/.{1,8}/g);
									// console.log(data);
									if (bleInfo.ble_device.name.includes("DWL4")) {
										for (let i = 0; i < data.length; i++) {
											if (i < 4) {
												if (i === 3) {
													this.commonChannels[i].value = byteStr2Int(data[i]) / 100;
												} else {
													this.commonChannels[i].value = byteStr2Int(data[i]);
												}
											} else if (i < 12) {
												this.dwl4Channels[i - 4].value = byteStr2Float(data[i]).toFixed(1);
											} else if (i < 14) {
												this.commonChannels[i - 8].value = byteStr2Float(data[i]).toFixed(1);
											} else if (i > 18) {
												if (i === 19) {
													this.commonChannels[i - 12].value = (byteStr2Float(data[i]).toFixed(0) == 1) ? "Joined" : "Not Joined";
												} else {
													this.commonChannels[i - 12].value = byteStr2Float(data[i]).toFixed(1);
												}
											}
										}
									} else if (bleInfo.ble_device.name.includes("FD")) {
										for (let i = 0; i < data.length; i++) {
											if (i < 4) {
												if (i === 3) {
													this.commonChannels[i].value = byteStr2Int(data[i]) / 100;
												} else {
													this.commonChannels[i].value = byteStr2Int(data[i]);
												}
											} else if (i < 12) {

											} else if (i < 14) {
												this.commonChannels[i - 8].value = byteStr2Float(data[i]).toFixed(1);
											} else if (i > 18) {
												if (i === 19) {
													this.commonChannels[i - 12].value = (byteStr2Float(data[i]).toFixed(0) == 1) ? "Joined" : "Not Joined";
												} else {
													this.commonChannels[i - 12].value = byteStr2Float(data[i]).toFixed(1);
												}
											}
										}
									}
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
		height: 80vh;
	}

	.data_show {
		height: 35px;
		border: 1px solid lightgrey;
		margin: 8px 0;
	}

	.read_btn {
		width: 100%;
		position: fixed;
		left: 0;
		bottom: 0;
	}
</style>